const YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"
const DEFAULT_TIMEOUT_MS = 3500

export interface TickerSearchResult {
  symbol: string
  name: string
  assetType: "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other"
  exchange?: string
}

const COMMON_CRYPTOS: Array<{ symbol: string; name: string }> = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "XLM", name: "Stellar" },
]

function mapQuoteTypeToAssetType(
  quoteType?: string
): "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other" {
  if (!quoteType) return "stock"
  switch (quoteType.toUpperCase()) {
    case "EQUITY":
      return "stock"
    case "ETF":
      return "etf"
    case "CRYPTOCURRENCY":
      return "crypto"
    case "MUTUALFUND":
      return "mutual_fund"
    case "FUTURE":
    case "COMMODITY":
      return "commodity"
    default:
      return "stock"
  }
}

export async function searchMarketTickers(
  rawQuery: string,
  limit: number = 8
): Promise<TickerSearchResult[]> {
  const query = rawQuery.trim()
  if (!query || query.length < 1) {
    return []
  }

  const results: TickerSearchResult[] = []
  const seenSymbols = new Set<string>()

  // 1. Local common crypto match check
  const qUpper = query.toUpperCase()
  const qLower = query.toLowerCase()
  for (const c of COMMON_CRYPTOS) {
    if (c.symbol.startsWith(qUpper) || c.name.toLowerCase().includes(qLower)) {
      results.push({
        symbol: c.symbol,
        name: c.name,
        assetType: "crypto",
        exchange: "Crypto",
      })
      seenSymbols.add(c.symbol)
      seenSymbols.add(`${c.symbol}-USD`)
    }
  }

  // 2. Query Yahoo Finance Search API
  try {
    const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })

    if (res.ok) {
      const data = await res.json()
      const quotes = data?.quotes || []

      for (const q of quotes) {
        if (!q.symbol) continue

        let cleanSymbol = q.symbol
        const isCrypto = q.quoteType === "CRYPTOCURRENCY" || cleanSymbol.endsWith("-USD")

        if (isCrypto && cleanSymbol.endsWith("-USD")) {
          cleanSymbol = cleanSymbol.replace(/-USD$/, "")
        }

        if (seenSymbols.has(cleanSymbol)) continue
        seenSymbols.add(cleanSymbol)

        const name = q.shortname || q.longname || cleanSymbol
        const assetType = isCrypto ? "crypto" : mapQuoteTypeToAssetType(q.quoteType)

        results.push({
          symbol: cleanSymbol,
          name,
          assetType,
          exchange: q.exchange || (isCrypto ? "Crypto" : undefined),
        })

        if (results.length >= limit) break
      }
    }
  } catch (err) {
    console.warn("[TickerSearch] Yahoo search query failed or timed out:", err)
  }

  return results.slice(0, limit)
}
