import { InvestmentTransaction, InvestmentHolding, Wallet } from "@/types"

export function calculateUnrealizedGain(currentValue: number, costBasis: number): number {
  return currentValue - costBasis
}

export function calculateRealizedGain(sellPrice: number, costBasis: number, qty: number): number {
  return (sellPrice - costBasis) * qty
}

export function calculateNewCostBasis(
  existingQty: number,
  existingCost: number,
  newQty: number,
  newPrice: number
): number {
  if (existingQty + newQty === 0) return 0
  const totalCost = existingQty * existingCost + newQty * newPrice
  return totalCost / (existingQty + newQty)
}

export function calculateAllocationPercentages(
  holdings: { symbol: string; currentValue: number; assetType: string }[]
): {
  bySymbol: Record<string, number>
  byAssetType: Record<string, number>
} {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  
  const bySymbol: Record<string, number> = {}
  const byAssetType: Record<string, number> = {}

  if (totalValue === 0) {
    return { bySymbol, byAssetType }
  }

  for (const h of holdings) {
    bySymbol[h.symbol] = (bySymbol[h.symbol] || 0) + (h.currentValue / totalValue) * 100
    byAssetType[h.assetType] = (byAssetType[h.assetType] || 0) + (h.currentValue / totalValue) * 100
  }

  return { bySymbol, byAssetType }
}

export function deriveHoldingState(
  transactions: InvestmentTransaction[],
  latestPrices: Map<string, number> = new Map(),
  walletCurrencyMap?: Map<string, string>
): InvestmentHolding[] {
  const holdingMap = new Map<string, InvestmentHolding>()

  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const tx of sortedTransactions) {
    const holdingId = tx.holdingId
    
    if (!holdingMap.has(holdingId)) {
      const holdingCurrency = walletCurrencyMap?.get(tx.walletId) || tx.currency || "USD"
      holdingMap.set(holdingId, {
        _id: holdingId as any,
        userId: tx.userId,
        organizationId: tx.organizationId,
        walletId: tx.walletId,
        symbol: tx.symbol,
        name: tx.symbol,
        assetType: tx.assetType,
        quantity: 0,
        averageCostBasis: 0,
        totalCostBasis: 0,
        currentPrice: latestPrices.get(holdingId) || 0,
        status: "active",
        realizedGain: 0,
        currency: holdingCurrency,
        exchange: tx.metadata?.exchange as string | undefined,
        isin: tx.metadata?.isin as string | undefined,
        cusip: tx.metadata?.cusip as string | undefined,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })
    }

    const holding = holdingMap.get(holdingId)!
    holding.updatedAt = tx.date > holding.updatedAt ? tx.date : holding.updatedAt

    if (tx.type === "buy" || tx.type === "reinvested_dividend") {
      holding.averageCostBasis = calculateNewCostBasis(
        holding.quantity,
        holding.averageCostBasis,
        tx.quantity,
        tx.price
      )
      holding.quantity += tx.quantity
      holding.totalCostBasis = holding.quantity * holding.averageCostBasis
    } else if (tx.type === "sell") {
      const realizedGain = calculateRealizedGain(tx.price, holding.averageCostBasis, tx.quantity)
      holding.realizedGain += realizedGain
      holding.quantity -= tx.quantity
      holding.totalCostBasis = holding.quantity * holding.averageCostBasis
    } else if (tx.type === "stock_split") {
      holding.quantity *= tx.quantity
      holding.averageCostBasis /= tx.quantity
    } else if (tx.type === "reverse_split") {
      holding.quantity /= tx.quantity
      holding.averageCostBasis *= tx.quantity
    }
  }

  const results = Array.from(holdingMap.values()).map((holding) => {
    const holdingKey = `${holding.walletId}_${holding.symbol}`
    const manualPrice = latestPrices.get(holdingKey) || latestPrices.get(holding._id.toString())

    if (manualPrice !== undefined && manualPrice > 0) {
      holding.currentPrice = manualPrice
    } else if (holding.averageCostBasis > 0) {
      holding.currentPrice = holding.averageCostBasis
    }

    if (holding.quantity <= 0) {
      holding.status = "closed"
      holding.quantity = 0
      holding.totalCostBasis = 0
    }
    return holding
  })

  return results
}

export interface PortfolioViewModel {
  totalValue: number
  totalCostBasis: number
  unrealizedGain: number
  realizedGain: number
  holdingsCount: number
  accountsCount: number
}

export interface AccountViewModel {
  accountId: string
  accountName: string
  color?: string
  currency?: string
  totalValue: number
  totalCostBasis: number
  unrealizedGain: number
  realizedGain: number
  convertedTotalValue?: number
  convertedUnrealizedGain?: number
  holdings: InvestmentHolding[]
}

export function buildPortfolioViewModel(
  holdings: InvestmentHolding[],
  convert?: (amount: number, from: string) => number
): PortfolioViewModel {
  const activeHoldings = holdings.filter(h => h.status === "active")
  
  let totalValue = 0
  let totalCostBasis = 0
  let realizedGain = 0

  for (const h of activeHoldings) {
    const rawVal = h.quantity * h.currentPrice
    const rawCost = h.totalCostBasis
    totalValue += convert ? convert(rawVal, h.currency || "USD") : rawVal
    totalCostBasis += convert ? convert(rawCost, h.currency || "USD") : rawCost
  }

  for (const h of holdings) {
    const rawRealized = h.realizedGain || 0
    realizedGain += convert ? convert(rawRealized, h.currency || "USD") : rawRealized
  }

  const unrealizedGain = totalValue - totalCostBasis
  const accountIds = new Set(holdings.map(h => h.walletId))

  return {
    totalValue: Math.round(totalValue),
    totalCostBasis: Math.round(totalCostBasis),
    unrealizedGain: Math.round(unrealizedGain),
    realizedGain: Math.round(realizedGain),
    holdingsCount: activeHoldings.length,
    accountsCount: accountIds.size
  }
}

export function buildAccountViewModel(
  holdings: InvestmentHolding[],
  account: Wallet,
  convert?: (amount: number, from: string) => number
): AccountViewModel {
  const accountHoldings = holdings.filter(h => h.walletId === account._id.toString())
  const activeHoldings = accountHoldings.filter(h => h.status === "active")
  
  const totalValue = activeHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0)
  const totalCostBasis = activeHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0)
  const unrealizedGain = totalValue - totalCostBasis
  const realizedGain = accountHoldings.reduce((sum, h) => sum + (h.realizedGain || 0), 0)

  const accountCurrency = account.currency || "USD"
  const convertedTotalValue = convert ? convert(totalValue, accountCurrency) : totalValue
  const convertedUnrealizedGain = convert ? convert(unrealizedGain, accountCurrency) : unrealizedGain

  return {
    accountId: account._id.toString(),
    accountName: account.name,
    color: account.color,
    currency: account.currency,
    totalValue,
    totalCostBasis,
    unrealizedGain,
    realizedGain,
    convertedTotalValue,
    convertedUnrealizedGain,
    holdings: accountHoldings
  }
}

// ─── Portfolio Enhancements: XIRR, Dividends, Risk & Allocation ──────────────

import type {
  PortfolioReturn,
  DividendSummary,
  SectorAllocation,
  PortfolioRisk,
} from "@/types"

/**
 * Calculates the Extended Internal Rate of Return (XIRR) using the Newton-Raphson method.
 * Returns annualized rate (e.g. 0.125 for +12.5% p.a.) or null if non-convergent.
 */
export function calculateXIRR(cashFlows: Array<{ date: Date; amount: number }>): number | null {
  if (cashFlows.length < 2) return null

  // Ensure cash flows have both positive and negative values
  let hasPositive = false
  let hasNegative = false
  for (const cf of cashFlows) {
    if (cf.amount > 0) hasPositive = true
    if (cf.amount < 0) hasNegative = true
  }
  if (!hasPositive || !hasNegative) return null

  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const d0 = sorted[0].date.getTime()

  // Guard against identical dates for all cash flows
  const lastDate = sorted[sorted.length - 1].date.getTime()
  if (lastDate === d0) return null

  const years = sorted.map((cf) => (cf.date.getTime() - d0) / (365.25 * 24 * 3600 * 1000))

  let rate = 0.1 // initial guess 10%
  const MAX_ITERATIONS = 100
  const TOLERANCE = 1e-6

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Prevent invalid base for fractional exponent
    if (1 + rate <= 0) {
      rate = 0.01
    }

    let fValue = 0
    let fDerivative = 0

    for (let j = 0; j < sorted.length; j++) {
      const c = sorted[j].amount
      const t = years[j]
      const denom = Math.pow(1 + rate, t)

      fValue += c / denom
      fDerivative -= (t * c) / (denom * (1 + rate))
    }

    if (Math.abs(fDerivative) < 1e-12) break

    const nextRate = rate - fValue / fDerivative
    if (!isFinite(nextRate)) break

    if (Math.abs(nextRate - rate) < TOLERANCE) {
      // Bound reasonable annual return between -99% and +10,000%
      if (nextRate >= -0.99 && nextRate <= 100) {
        return Number(nextRate.toFixed(4))
      }
      return null
    }

    rate = nextRate
  }

  return null
}

/**
 * Builds holding-level return analysis including XIRR and simple holding period return.
 */
export function buildHoldingReturn(
  transactions: InvestmentTransaction[],
  currentValueCents: number
): PortfolioReturn {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  const cashFlows: Array<{ date: Date; amount: number }> = []

  let totalCostBasisCents = 0

  for (const tx of sorted) {
    // Buys: cash outflow (negative)
    if (tx.type === "buy") {
      const outflow = (tx.price * tx.quantity + tx.fees)
      cashFlows.push({ date: new Date(tx.date), amount: -outflow })
      totalCostBasisCents += outflow
    } else if (tx.type === "sell") {
      const inflow = (tx.price * tx.quantity - tx.fees)
      cashFlows.push({ date: new Date(tx.date), amount: inflow })
    } else if (tx.type === "cash_dividend" || tx.type === "reinvested_dividend") {
      const divAmount = tx.dividendAmount || tx.grossAmount || 0
      cashFlows.push({ date: new Date(tx.date), amount: divAmount })
    }
  }

  // Terminal cash flow: current market value as an inflow today
  const now = new Date()
  cashFlows.push({ date: now, amount: currentValueCents })

  const firstDate = sorted.length > 0 ? new Date(sorted[0].date) : now
  const holdingPeriodDays = Math.max(
    1,
    Math.round((now.getTime() - firstDate.getTime()) / (24 * 3600 * 1000))
  )

  const absoluteGainCents = currentValueCents - totalCostBasisCents
  const simpleReturn =
    totalCostBasisCents > 0
      ? Number(((currentValueCents - totalCostBasisCents) / totalCostBasisCents).toFixed(4))
      : 0

  const xirr = calculateXIRR(cashFlows)

  return {
    xirr,
    simpleReturn,
    absoluteGainCents,
    holdingPeriodDays,
  }
}

/**
 * Summarizes dividend transactions and calculates trailing annual yield.
 */
export function calculateDividendSummary(
  transactions: InvestmentTransaction[],
  costBasisCents: number,
  holdingId?: string,
  symbol?: string
): DividendSummary {
  const dividendTxs = transactions.filter(
    (t) =>
      (t.type === "cash_dividend" || t.type === "reinvested_dividend") &&
      (!holdingId || t.holdingId === holdingId)
  )

  let totalDividendCents = 0
  let lastDividendDate: Date | null = null
  const yearMap = new Map<number, number>()

  for (const tx of dividendTxs) {
    const amount = tx.dividendAmount || tx.grossAmount || 0
    totalDividendCents += amount

    const txDate = new Date(tx.date)
    if (!lastDividendDate || txDate > lastDividendDate) {
      lastDividendDate = txDate
    }

    const year = txDate.getFullYear()
    yearMap.set(year, (yearMap.get(year) || 0) + amount)
  }

  const byYear = Array.from(yearMap.entries())
    .map(([year, totalCents]) => ({ year, totalCents }))
    .sort((a, b) => b.year - a.year)

  const annualYield =
    costBasisCents > 0 ? Number((totalDividendCents / costBasisCents).toFixed(4)) : null

  return {
    holdingId,
    symbol,
    totalDividendCents,
    dividendCount: dividendTxs.length,
    annualYield,
    lastDividendDate,
    byYear,
  }
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: "Equities / Stocks",
  etf: "ETFs",
  crypto: "Cryptocurrency",
  mutual_fund: "Mutual Funds",
  bond: "Bonds & Fixed Income",
  commodity: "Commodities & Precious Metals",
  other: "Alternative Assets",
}

/**
 * Calculates sector/asset-class allocation breakdown with display labels.
 */
export function calculateSectorAllocation(holdings: InvestmentHolding[]): SectorAllocation[] {
  const activeHoldings = holdings.filter((h) => h.status === "active")
  const totalValue = activeHoldings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0)

  if (totalValue === 0) return []

  const sectorMap = new Map<string, number>()
  for (const h of activeHoldings) {
    const val = h.quantity * h.currentPrice
    const type = h.assetType || "other"
    sectorMap.set(type, (sectorMap.get(type) || 0) + val)
  }

  const allocations: SectorAllocation[] = []
  sectorMap.forEach((val, sector) => {
    allocations.push({
      sector,
      label: ASSET_TYPE_LABELS[sector] || sector,
      valuePercent: Number(((val / totalValue) * 100).toFixed(1)),
      valueCents: Math.round(val),
    })
  })

  return allocations.sort((a, b) => b.valueCents - a.valueCents)
}

/**
 * Evaluates portfolio diversification and concentration risk via Herfindahl-Hirschman Index (HHI).
 */
export function calculatePortfolioRisk(holdings: InvestmentHolding[]): PortfolioRisk {
  const activeHoldings = holdings.filter((h) => h.status === "active")
  const totalValue = activeHoldings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0)

  if (activeHoldings.length === 0 || totalValue === 0) {
    return {
      hhiIndex: 0,
      diversificationScore: 100,
      concentrationWarnings: [],
      assetClassCount: 0,
      singleAssetRisk: "low",
    }
  }

  let hhi = 0
  const concentrationWarnings: PortfolioRisk["concentrationWarnings"] = []
  const assetTypes = new Set<string>()

  for (const h of activeHoldings) {
    const holdingVal = h.quantity * h.currentPrice
    const shareFraction = holdingVal / totalValue
    hhi += Math.pow(shareFraction, 2)

    if (h.assetType) assetTypes.add(h.assetType)

    const holdingPercent = Number((shareFraction * 100).toFixed(1))
    if (holdingPercent > 25) {
      concentrationWarnings.push({
        symbol: h.symbol,
        holdingPercent,
        message: `${h.symbol} accounts for ${holdingPercent}% of total portfolio value. High exposure to a single holding increases volatility.`,
      })
    }
  }

  const roundedHhi = Number(hhi.toFixed(3))
  const diversificationScore = Math.max(0, Math.min(100, Math.round((1 - hhi) * 100)))

  let singleAssetRisk: "low" | "moderate" | "high" = "low"
  if (roundedHhi > 0.25) {
    singleAssetRisk = "high"
  } else if (roundedHhi > 0.15) {
    singleAssetRisk = "moderate"
  }

  return {
    hhiIndex: roundedHhi,
    diversificationScore,
    concentrationWarnings,
    assetClassCount: assetTypes.size,
    singleAssetRisk,
  }
}
