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
  latestPrices: Map<string, number> = new Map()
): InvestmentHolding[] {
  const holdingMap = new Map<string, InvestmentHolding>()

  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const tx of sortedTransactions) {
    const holdingId = tx.holdingId
    
    if (!holdingMap.has(holdingId)) {
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
        currency: "USD",
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
  holdings: InvestmentHolding[]
}

export function buildPortfolioViewModel(holdings: InvestmentHolding[]): PortfolioViewModel {
  const activeHoldings = holdings.filter(h => h.status === "active")
  
  const totalValue = activeHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0)
  const totalCostBasis = activeHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0)
  const unrealizedGain = totalValue - totalCostBasis
  const realizedGain = holdings.reduce((sum, h) => sum + (h.realizedGain || 0), 0)

  const accountIds = new Set(holdings.map(h => h.walletId))

  return {
    totalValue,
    totalCostBasis,
    unrealizedGain,
    realizedGain,
    holdingsCount: activeHoldings.length,
    accountsCount: accountIds.size
  }
}

export function buildAccountViewModel(holdings: InvestmentHolding[], account: Wallet): AccountViewModel {
  const accountHoldings = holdings.filter(h => h.walletId === account._id.toString())
  const activeHoldings = accountHoldings.filter(h => h.status === "active")
  
  const totalValue = activeHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0)
  const totalCostBasis = activeHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0)
  const unrealizedGain = totalValue - totalCostBasis
  const realizedGain = accountHoldings.reduce((sum, h) => sum + (h.realizedGain || 0), 0)

  return {
    accountId: account._id.toString(),
    accountName: account.name,
    color: account.color,
    currency: account.currency,
    totalValue,
    totalCostBasis,
    unrealizedGain,
    realizedGain,
    holdings: accountHoldings
  }
}
