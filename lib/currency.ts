import { cache } from "react"
import type { ExchangeRate } from "@/types"
import type { Collection } from "mongodb"

const FREE_EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest"
const DEFAULT_TIMEOUT_MS = 2500
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes failure cooldown
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour fresh cache

// In-memory circuit breaker and request deduplication
const failureCooldownMap = new Map<string, number>()
const inflightRequests = new Map<string, Promise<Record<string, number>>>()

// Optional provider override for unit testing
type CollectionProvider = <T extends object>(name: string) => Promise<Collection<T> | null>
let customCollectionProvider: CollectionProvider | null = null

export function _setCollectionProvider(provider: CollectionProvider | null): void {
  customCollectionProvider = provider
}

async function getExchangeRatesCollection(): Promise<Collection<ExchangeRate> | null> {
  try {
    if (customCollectionProvider) {
      return await customCollectionProvider<ExchangeRate>("exchange_rates")
    }
    const { getCollection } = await import("./db/collections")
    return await getCollection<ExchangeRate>("exchange_rates")
  } catch (err) {
    console.warn("[ExchangeRate] Could not access exchange_rates collection:", err)
    return null
  }
}

/**
 * Built-in fallback exchange rates for major currencies supported in Dime.
 * Used when network is unreachable/timed out and no DB cache exists.
 */
export const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1.0, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 155.0, CAD: 1.36, AUD: 1.52, CHF: 0.90, SGD: 1.35 },
  EUR: { EUR: 1.0, USD: 1.09, GBP: 0.86, INR: 90.8, JPY: 168.5, CAD: 1.48, AUD: 1.65, CHF: 0.98, SGD: 1.47 },
  GBP: { GBP: 1.0, USD: 1.27, EUR: 1.16, INR: 105.8, JPY: 196.0, CAD: 1.72, AUD: 1.92, CHF: 1.14, SGD: 1.71 },
  INR: { INR: 1.0, USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.86, CAD: 0.016, AUD: 0.018, CHF: 0.011, SGD: 0.016 },
  JPY: { JPY: 1.0, USD: 0.0065, EUR: 0.0059, GBP: 0.0051, INR: 0.54, CAD: 0.0088, AUD: 0.0098, CHF: 0.0058, SGD: 0.0087 },
  CAD: { CAD: 1.0, USD: 0.74, EUR: 0.68, GBP: 0.58, INR: 61.4, JPY: 114.0, AUD: 1.12, CHF: 0.66, SGD: 0.99 },
  AUD: { AUD: 1.0, USD: 0.66, EUR: 0.61, GBP: 0.52, INR: 55.0, JPY: 102.0, CAD: 0.89, CHF: 0.59, SGD: 0.89 },
  SGD: { SGD: 1.0, USD: 0.74, EUR: 0.68, GBP: 0.58, INR: 61.8, JPY: 114.8, CAD: 1.01, AUD: 1.12, CHF: 0.67 },
  CHF: { CHF: 1.0, USD: 1.11, EUR: 1.02, GBP: 0.88, INR: 92.7, JPY: 172.0, CAD: 1.51, AUD: 1.69, SGD: 1.50 },
}

function getFallbackRate(base: string): Record<string, number> {
  return FALLBACK_RATES[base] || { [base]: 1.0 }
}

/**
 * Resets in-memory circuit breaker and inflight maps (primarily for test environments).
 */
export function _resetCurrencyState(): void {
  failureCooldownMap.clear()
  inflightRequests.clear()
}

/**
 * Fetches exchange rates with timeout protection, circuit breaker, and stale caching.
 */
async function fetchExchangeRatesInternal(baseCurrency: string): Promise<Record<string, number>> {
  const base = baseCurrency.toUpperCase()

  // 1. In-flight request deduplication: return existing promise if already in progress
  const inflight = inflightRequests.get(base)
  if (inflight) {
    return inflight
  }

  const promise = (async () => {
    const timeoutMs = Number(process.env.EXCHANGE_RATE_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
    const cooldownMs = Number(process.env.EXCHANGE_RATE_COOLDOWN_MS) || DEFAULT_COOLDOWN_MS

    // 2. Check fresh DB cache (< 1 hour)
    const coll = await getExchangeRatesCollection()
    if (coll) {
      try {
        const oneHourAgo = new Date(Date.now() - CACHE_TTL_MS)
        const cached = await coll.findOne({
          base,
          updatedAt: { $gte: oneHourAgo },
        })

        if (cached?.rates && Object.keys(cached.rates).length > 0) {
          return cached.rates
        }
      } catch (dbErr) {
        console.warn(`[ExchangeRate] Failed to query fresh rates from DB for ${base}:`, dbErr)
      }
    }

    // 3. Circuit breaker check: if in cooldown, skip outgoing network call immediately
    const cooldownUntil = failureCooldownMap.get(base)
    if (cooldownUntil && Date.now() < cooldownUntil) {
      if (coll) {
        try {
          const stale = await coll.findOne({ base })
          if (stale?.rates && Object.keys(stale.rates).length > 0) {
            return stale.rates
          }
        } catch {
          // Ignore DB errors during fallback
        }
      }
      return getFallbackRate(base)
    }

    // 4. Outgoing fetch with timeout and circuit breaker protection
    try {
      const res = await fetch(`${FREE_EXCHANGE_RATE_API}/${base}`, {
        signal: AbortSignal.timeout(timeoutMs),
        next: { revalidate: 3600 },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      const rates = data?.rates as Record<string, number> | undefined

      if (!rates || typeof rates !== "object" || Object.keys(rates).length === 0) {
        throw new Error(`Invalid response format from exchange rate API for ${base}`)
      }

      // Success: reset circuit breaker cooldown
      failureCooldownMap.delete(base)

      // Cache rates in MongoDB
      if (coll) {
        try {
          await coll.updateOne(
            { base },
            {
              $set: {
                rates,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          )
        } catch (saveErr) {
          console.warn(`[ExchangeRate] Failed to save rates to DB for ${base}:`, saveErr)
        }
      }

      return rates
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.warn(
        `[ExchangeRate] Outgoing fetch failed for ${base} (${reason}). Circuit breaker active for ${cooldownMs / 1000}s.`
      )

      // Trip circuit breaker
      failureCooldownMap.set(base, Date.now() + cooldownMs)

      // Attempt to retrieve stale cache from DB
      if (coll) {
        try {
          const stale = await coll.findOne({ base })
          if (stale?.rates && Object.keys(stale.rates).length > 0) {
            // Extend stale cache updatedAt by 15 mins in DB to reduce DB checks across processes
            await coll.updateOne(
              { base },
              { $set: { updatedAt: new Date(Date.now() - (CACHE_TTL_MS - 15 * 60 * 1000)) } }
            ).catch(() => {})
            return stale.rates
          }
        } catch (dbErr) {
          console.warn(`[ExchangeRate] Failed to read stale cache from DB for ${base}:`, dbErr)
        }
      }

      // Static fallback
      return getFallbackRate(base)
    }
  })().finally(() => {
    inflightRequests.delete(base)
  })

  inflightRequests.set(base, promise)
  return promise
}

/**
 * Get exchange rates for a base currency.
 * Wrapped with React cache() to deduplicate queries within the same RSC render tree.
 */
export const getExchangeRates = cache(fetchExchangeRatesInternal)

/**
 * Converts an amount from one currency to another using live or cached rates,
 * falling back gracefully if network is unavailable.
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()

  if (fromUpper === toUpper) {
    return amount
  }

  const rates = await getExchangeRates(fromUpper)
  const rate = rates[toUpper]

  if (rate !== undefined) {
    return Math.round(amount * rate)
  }

  // If not found in base rates, try inverse from target currency
  const targetRates = await getExchangeRates(toUpper)
  const inverseRate = targetRates[fromUpper]
  if (inverseRate !== undefined && inverseRate !== 0) {
    return Math.round(amount / inverseRate)
  }

  console.warn(`[ExchangeRate] No rate found between ${fromUpper} and ${toUpper}. Using 1:1 fallback.`)
  return amount
}

/**
 * Returns a high-performance currency conversion function pre-populated
 * with rates for targetCurrency and all sourceCurrencies.
 */
export async function getCurrencyConverter(targetCurrency: string, sourceCurrencies: string[]) {
  const targetUpper = targetCurrency.toUpperCase()
  const uniqueCurrencies = Array.from(
    new Set([...sourceCurrencies.map((c) => c.toUpperCase()), targetUpper])
  )
  const ratesMap = new Map<string, Record<string, number>>()

  await Promise.all(
    uniqueCurrencies.map(async (curr) => {
      try {
        const rates = await getExchangeRates(curr)
        ratesMap.set(curr, rates)
      } catch (err) {
        console.warn(`[ExchangeRate] Failed to prefetch rates for ${curr}:`, err)
      }
    })
  )

  return (amount: number, from: string) => {
    const fromUpper = from.toUpperCase()
    if (fromUpper === targetUpper) return amount

    const rates = ratesMap.get(fromUpper)
    const rate = rates?.[targetUpper]
    if (rate !== undefined) {
      return Math.round(amount * rate)
    }

    const targetRates = ratesMap.get(targetUpper)
    const inverseRate = targetRates?.[fromUpper]
    if (inverseRate !== undefined && inverseRate !== 0) {
      return Math.round(amount / inverseRate)
    }

    return amount
  }
}

export const SUPPORTED_CURRENCIES = [
  "USD",
  "INR",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "SGD",
  "CHF",
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
