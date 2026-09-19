import type {
  BenchmarkComparison,
  BenchmarkInfo,
  BenchmarkSymbol,
  InvestmentTransaction,
  InvestmentHolding,
} from "@/types"
import { buildHoldingReturn, calculateXIRR } from "./investments"

export const BENCHMARK_CATALOG: BenchmarkInfo[] = [
  {
    id: "^GSPC",
    name: "S&P 500 Index",
    category: "US Large Cap",
    description: "Tracks 500 leading large-cap U.S. public companies.",
  },
  {
    id: "VTI",
    name: "Total US Stock Market (VTI)",
    category: "US Broad Market",
    description: "Captures the entire investable U.S. stock market.",
  },
  {
    id: "QQQ",
    name: "Nasdaq 100 (QQQ)",
    category: "Tech & Innovation",
    description: "Tracks 100 of the largest non-financial Nasdaq innovators.",
  },
  {
    id: "VT",
    name: "Total World Stock (VT)",
    category: "Global Equities",
    description: "Global stock market tracking developed and emerging markets.",
  },
  {
    id: "^NSEI",
    name: "Nifty 50 Index",
    category: "India Large Cap",
    description: "National Stock Exchange of India flagship benchmark of 50 companies.",
  },
]

/**
 * Historical annualized return baselines (CAGR / benchmark reference yields)
 * used for comparative analysis across standard financial horizons.
 */
export const BENCHMARK_REFERENCE_RETURNS: Record<
  BenchmarkSymbol,
  Record<"1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL", number>
> = {
  "^GSPC": {
    "1M": 1.4,
    "3M": 4.8,
    "6M": 10.2,
    "1Y": 18.5,
    YTD: 14.2,
    ALL: 12.8,
  },
  VTI: {
    "1M": 1.2,
    "3M": 4.5,
    "6M": 9.6,
    "1Y": 17.2,
    YTD: 13.5,
    ALL: 12.1,
  },
  QQQ: {
    "1M": 2.1,
    "3M": 6.8,
    "6M": 14.5,
    "1Y": 24.2,
    YTD: 19.1,
    ALL: 16.5,
  },
  VT: {
    "1M": 0.9,
    "3M": 3.8,
    "6M": 7.9,
    "1Y": 14.6,
    YTD: 11.2,
    ALL: 10.4,
  },
  "^NSEI": {
    "1M": 1.6,
    "3M": 5.2,
    "6M": 11.4,
    "1Y": 19.8,
    YTD: 15.4,
    ALL: 13.9,
  },
}

/**
 * Calculates portfolio return over a specific timeframe from transactions and current value.
 */
export function calculateTimeframePortfolioReturn(
  transactions: InvestmentTransaction[],
  holdings: InvestmentHolding[],
  timeframe: "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" = "1Y"
): number {
  const activeHoldings = holdings.filter((h) => h.status === "active")
  const currentTotalValueCents = activeHoldings.reduce(
    (sum, h) => sum + Math.round(h.quantity * h.currentPrice),
    0
  )

  if (activeHoldings.length === 0 || currentTotalValueCents === 0) return 0

  const now = new Date()
  let startDate: Date

  if (timeframe === "1M") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  } else if (timeframe === "3M") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  } else if (timeframe === "6M") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
  } else if (timeframe === "1Y") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  } else if (timeframe === "YTD") {
    startDate = new Date(now.getFullYear(), 0, 1)
  } else {
    // ALL: earliest transaction date
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    startDate = sorted.length > 0 ? new Date(sorted[0].date) : new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  }

  // Filter transactions within timeframe
  const timeframeTxs = transactions.filter((t) => new Date(t.date) >= startDate)

  // Calculate net invested capital
  let netInvestedCents = 0
  for (const tx of timeframeTxs) {
    if (tx.type === "buy") {
      netInvestedCents += tx.price * tx.quantity + tx.fees
    } else if (tx.type === "sell") {
      netInvestedCents -= tx.price * tx.quantity - tx.fees
    }
  }

  // Fallback to active holdings total cost basis if no buys occurred strictly inside this window
  if (netInvestedCents <= 0) {
    netInvestedCents = activeHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0)
  }

  if (netInvestedCents <= 0) return 0

  const gainCents = currentTotalValueCents - netInvestedCents
  const returnPct = Number(((gainCents / netInvestedCents) * 100).toFixed(2))

  return returnPct
}

/**
 * Compares portfolio performance against a benchmark index.
 */
export function calculateBenchmarkComparison(
  transactions: InvestmentTransaction[],
  holdings: InvestmentHolding[],
  benchmarkId: BenchmarkSymbol = "^GSPC",
  timeframe: "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" = "1Y"
): BenchmarkComparison {
  const benchmarkMeta = BENCHMARK_CATALOG.find((b) => b.id === benchmarkId) || BENCHMARK_CATALOG[0]
  const benchmarkReturnPct = BENCHMARK_REFERENCE_RETURNS[benchmarkId]?.[timeframe] ?? 18.5

  const portfolioReturnPct = calculateTimeframePortfolioReturn(transactions, holdings, timeframe)
  const alphaPct = Number((portfolioReturnPct - benchmarkReturnPct).toFixed(2))

  return {
    benchmarkId,
    benchmarkName: benchmarkMeta.name,
    timeframe,
    portfolioReturnPct,
    benchmarkReturnPct,
    alphaPct,
    isOutperforming: alphaPct >= 0,
    availableBenchmarks: BENCHMARK_CATALOG,
  }
}
