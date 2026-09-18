import { cache } from "react"
import type { InvestmentPrice } from "@/types"
import type { Collection } from "mongodb"
import { convertCurrency } from "./currency"

const YAHOO_FINANCE_URL = "https://query1.finance.yahoo.com/v8/finance/quote"
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes fresh cache
const DEFAULT_TIMEOUT_MS = 3000
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes failure cooldown

// In-memory circuit breaker and request deduplication
const failureCooldownMap = new Map<string, number>()
const inflightRequests = new Map<string, Promise<number | null>>()

const CRYPTO_COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  USDC: "usd-coin",
  XRP: "ripple",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  DOT: "polkadot",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  TRX: "tron",
  LINK: "chainlink",
  ATOM: "cosmos",
  UNI: "uniswap",
  XLM: "stellar",
}

async function getPricesCollection(): Promise<Collection<InvestmentPrice> | null> {
  try {
    const { getCollection } = await import("./db/collections")
    return await getCollection<InvestmentPrice>("investment_prices")
  } catch (err) {
    console.warn("[MarketPrice] Could not access investment_prices collection:", err)
    return null
  }
}

/**
 * Internal price fetcher routing to Yahoo Finance or CoinGecko with timeout,
 * circuit breaker, and MongoDB caching.
 */
async function fetchMarketPriceInternal(
  symbol: string,
  assetType: string = "stock",
  holdingId?: string,
  currency: string = "USD"
): Promise<number | null> {
  const cleanSymbol = symbol.trim().toUpperCase()
  const key = `${cleanSymbol}_${assetType.toLowerCase()}_${currency.toUpperCase()}`

  // 1. Inflight request deduplication
  const inflight = inflightRequests.get(key)
  if (inflight) {
    return inflight
  }

  const promise = (async (): Promise<number | null> => {
    // 2. Check fresh DB cache (< 15 min old)
    const coll = await getPricesCollection()
    if (coll && holdingId) {
      try {
        const freshThreshold = new Date(Date.now() - CACHE_TTL_MS)
        const cached = await coll.findOne({
          holdingId,
          source: "market",
          createdAt: { $gte: freshThreshold },
        })

        if (cached && typeof cached.price === "number" && cached.price > 0) {
          return cached.price
        }
      } catch (dbErr) {
        console.warn(`[MarketPrice] Failed to query fresh price for ${cleanSymbol}:`, dbErr)
      }
    }

    // 3. Circuit breaker check
    const cooldownUntil = failureCooldownMap.get(key)
    if (cooldownUntil && Date.now() < cooldownUntil) {
      // Return stale price from DB if available
      if (coll && holdingId) {
        try {
          const stale = await coll.findOne(
            { holdingId },
            { sort: { date: -1, createdAt: -1 } }
          )
          if (stale && typeof stale.price === "number") {
            return stale.price
          }
        } catch {
          // ignore
        }
      }
      return null
    }

    // 4. Outgoing fetch based on asset type
    try {
      let fetchedPrice: number | null = null

      if (assetType === "crypto") {
        const coinId = CRYPTO_COINGECKO_IDS[cleanSymbol]
        if (coinId) {
          const res = await fetch(`${COINGECKO_URL}?ids=${coinId}&vs_currencies=usd`, {
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
          })
          if (res.ok) {
            const data = await res.json()
            if (data[coinId]?.usd && typeof data[coinId].usd === "number") {
              fetchedPrice = data[coinId].usd
            }
          }
        }

        // If CoinGecko didn't return a price, fallback to Yahoo Finance (e.g. BTC-USD)
        if (fetchedPrice === null) {
          const ySymbol = `${cleanSymbol}-USD`
          const res = await fetch(
            `${YAHOO_FINANCE_URL}?symbols=${encodeURIComponent(ySymbol)}&fields=regularMarketPrice,currency`,
            { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) }
          )
          if (res.ok) {
            const data = await res.json()
            const result = data?.quoteResponse?.result?.[0]
            if (result?.regularMarketPrice && typeof result.regularMarketPrice === "number") {
              fetchedPrice = result.regularMarketPrice
            }
          }
        }
      } else if (cleanSymbol === "GOLD" || assetType === "commodity") {
        // Try Yahoo Finance gold futures or spot symbol
        const goldSymbol = cleanSymbol === "GOLD" ? "GC=F" : cleanSymbol
        const res = await fetch(
          `${YAHOO_FINANCE_URL}?symbols=${encodeURIComponent(goldSymbol)}&fields=regularMarketPrice,currency`,
          { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) }
        )
        if (res.ok) {
          const data = await res.json()
          const result = data?.quoteResponse?.result?.[0]
          if (result?.regularMarketPrice && typeof result.regularMarketPrice === "number") {
            fetchedPrice = result.regularMarketPrice
          }
        }
      } else {
        // Standard equities, ETFs, mutual funds via Yahoo Finance
        const res = await fetch(
          `${YAHOO_FINANCE_URL}?symbols=${encodeURIComponent(cleanSymbol)}&fields=regularMarketPrice,currency`,
          { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) }
        )
        if (res.ok) {
          const data = await res.json()
          const result = data?.quoteResponse?.result?.[0]
          if (result?.regularMarketPrice && typeof result.regularMarketPrice === "number") {
            fetchedPrice = result.regularMarketPrice
          }
        }
      }

      if (fetchedPrice === null || fetchedPrice <= 0) {
        throw new Error(`No price returned from market APIs for ${cleanSymbol}`)
      }

      // Success: reset circuit breaker cooldown
      failureCooldownMap.delete(key)

      // Convert fetched price (USD) to cents and target currency
      let priceInCents = Math.round(fetchedPrice * 100)
      if (currency && currency.toUpperCase() !== "USD") {
        try {
          priceInCents = await convertCurrency(priceInCents, "USD", currency.toUpperCase())
        } catch (convErr) {
          console.warn(`[MarketPrice] Failed currency conversion for ${cleanSymbol}:`, convErr)
        }
      }

      // Cache price to DB if holdingId is provided (stored in cents)
      if (coll && holdingId) {
        try {
          await coll.insertOne({
            holdingId,
            price: priceInCents,
            date: new Date(),
            source: "market",
            createdAt: new Date(),
          } as InvestmentPrice)
        } catch (saveErr) {
          console.warn(`[MarketPrice] Failed to cache price for ${cleanSymbol}:`, saveErr)
        }
      }

      return priceInCents
    } catch (err) {
      console.warn(`[MarketPrice] Outgoing fetch failed for ${cleanSymbol}:`, err)
      failureCooldownMap.set(key, Date.now() + DEFAULT_COOLDOWN_MS)

      // Stale fallback
      if (coll && holdingId) {
        try {
          const stale = await coll.findOne(
            { holdingId },
            { sort: { date: -1, createdAt: -1 } }
          )
          if (stale && typeof stale.price === "number") {
            return stale.price
          }
        } catch {
          // ignore
        }
      }

      return null
    }
  })().finally(() => {
    inflightRequests.delete(key)
  })

  inflightRequests.set(key, promise)
  return promise
}

export const getMarketPrice = cache(fetchMarketPriceInternal)

/**
 * Batch synchronize market prices for multiple holdings.
 * Respects rate limits with gentle batching and saves to DB.
 */
export async function syncHoldingPrices(
  holdings: Array<{ holdingId: string; symbol: string; assetType: string; currency?: string }>
): Promise<Map<string, number>> {
  const results = new Map<string, number>()
  if (holdings.length === 0) return results

  // Process in chunks of 4 to prevent rate limiting
  const CHUNK_SIZE = 4
  for (let i = 0; i < holdings.length; i += CHUNK_SIZE) {
    const chunk = holdings.slice(i, i + CHUNK_SIZE)
    const promises = chunk.map(async (h) => {
      try {
        const price = await fetchMarketPriceInternal(h.symbol, h.assetType, h.holdingId, h.currency)
        if (price !== null) {
          results.set(h.holdingId, price)
        }
      } catch (err) {
        console.warn(`[MarketPrice] Error syncing ${h.symbol}:`, err)
      }
    })

    await Promise.allSettled(promises)

    if (i + CHUNK_SIZE < holdings.length) {
      // 100ms pause between batches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Resolves market price with fallback to any previously recorded price.
 */
export async function getMarketPriceWithFallback(
  holdingId: string,
  symbol: string,
  assetType: string
): Promise<number | null> {
  const livePrice = await getMarketPrice(symbol, assetType, holdingId)
  if (livePrice !== null) return livePrice

  const coll = await getPricesCollection()
  if (!coll) return null

  try {
    const last = await coll.findOne(
      { holdingId },
      { sort: { date: -1, createdAt: -1 } }
    )
    return last?.price ?? null
  } catch {
    return null
  }
}
