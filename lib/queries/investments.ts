import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import {
  InvestmentTransaction,
  InvestmentPrice,
  InvestmentHolding,
  Wallet,
  Watchlist,
  WatchlistItem,
  PriceHistoryPoint,
  PortfolioRisk,
  SectorAllocation,
} from "@/types"
import { ObjectId } from "mongodb"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import {
  deriveHoldingState,
  calculatePortfolioRisk,
  calculateSectorAllocation,
} from "@/lib/calculations/investments"

export const getTransactionsByAccount = cache(async (accountId: string) => {
  const scope = await getFinancialScope()
  const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")

  return transactionsColl
    .find({ walletId: accountId, ...getScopeFilter(scope) })
    .sort({ date: -1 })
    .toArray()
})

export const getTransactionsByHolding = cache(async (holdingId: string) => {
  const scope = await getFinancialScope()
  const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")

  return transactionsColl
    .find({ holdingId, ...getScopeFilter(scope) })
    .sort({ date: -1 })
    .toArray()
})

export const getLatestPrices = cache(async (holdingIds: string[]) => {
  const pricesColl = await getCollection<InvestmentPrice>("investment_prices")
  
  const pipeline = [
    { $match: { holdingId: { $in: holdingIds } } },
    { $sort: { date: -1, createdAt: -1 } },
    { 
      $group: { 
        _id: "$holdingId", 
        latestPrice: { $first: "$price" } 
      } 
    }
  ]
  
  const results = await pricesColl.aggregate(pipeline).toArray()
  
  const priceMap = new Map<string, number>()
  for (const row of results) {
    priceMap.set(row._id, row.latestPrice)
  }
  
  return priceMap
})

export const getPortfolioHoldings = cache(async (): Promise<InvestmentHolding[]> => {
  const scope = await getFinancialScope()
  const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")
  
  const allTransactions = await transactionsColl
    .find({ ...getScopeFilter(scope) })
    .toArray()
    
  if (allTransactions.length === 0) {
    return []
  }
    
  const holdingIds = Array.from(new Set(allTransactions.map(t => t.holdingId)))
  const [latestPrices, walletsColl] = await Promise.all([
    getLatestPrices(holdingIds),
    getCollection<Wallet>("wallets"),
  ])

  const wallets = await walletsColl
    .find({ ...getScopeFilter(scope) })
    .project<Pick<Wallet, "_id" | "currency">>({ _id: 1, currency: 1 })
    .toArray()

  const walletCurrencyMap = new Map<string, string>()
  for (const w of wallets) {
    if (w.currency) {
      walletCurrencyMap.set(w._id.toString(), w.currency)
    }
  }
  
  return deriveHoldingState(allTransactions, latestPrices, walletCurrencyMap)
})

export const getRecentInvestmentTransactions = cache(async (limit: number = 10): Promise<InvestmentTransaction[]> => {
  const scope = await getFinancialScope()
  const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")

  const txs = await transactionsColl
    .find({ ...getScopeFilter(scope) })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray()

  if (txs.length === 0) {
    return []
  }

  const walletsColl = await getCollection<Wallet>("wallets")
  const walletIds = Array.from(new Set(txs.map((t) => t.walletId))).filter(Boolean)
  const objectIds = walletIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id))

  const wallets = objectIds.length > 0
    ? await walletsColl
        .find({ _id: { $in: objectIds } })
        .project<Pick<Wallet, "_id" | "currency">>({ _id: 1, currency: 1 })
        .toArray()
    : []

  const walletCurrencyMap = new Map<string, string>()
  for (const w of wallets) {
    if (w.currency) {
      walletCurrencyMap.set(w._id.toString(), w.currency)
    }
  }

  return txs.map((t) => ({
    ...t,
    currency: t.currency || walletCurrencyMap.get(t.walletId) || "USD",
  }))
})

export const getPriceHistory = cache(
  async (holdingId: string, days: number = 365): Promise<PriceHistoryPoint[]> => {
    const pricesColl = await getCollection<InvestmentPrice>("investment_prices")

    const cutoffDate = new Date(Date.now() - days * 24 * 3600 * 1000)

    const prices = await pricesColl
      .find({
        holdingId,
        date: { $gte: cutoffDate },
      })
      .sort({ date: 1 })
      .toArray()

    return prices.map((p) => ({
      date: p.date instanceof Date ? p.date.toISOString().slice(0, 10) : String(p.date).slice(0, 10),
      price: p.price,
      source: p.source || "manual",
    }))
  }
)

export const getDividendTransactions = cache(
  async (userId: string, accountId?: string): Promise<InvestmentTransaction[]> => {
    const scope = await getFinancialScope()
    const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")

    const query: any = {
      ...getScopeFilter(scope),
      type: { $in: ["cash_dividend", "reinvested_dividend"] },
    }

    if (accountId) {
      query.walletId = accountId
    }

    return transactionsColl.find(query).sort({ date: -1 }).toArray()
  }
)

export const getWatchlists = cache(
  async (userId: string): Promise<Array<Watchlist & { items: WatchlistItem[] }>> => {
    const scope = await getFinancialScope()
    const watchlistsColl = await getCollection<Watchlist>("watchlists")
    const itemsColl = await getCollection<WatchlistItem>("watchlist_items")

    const watchlists = await watchlistsColl
      .find({ ...getScopeFilter(scope) })
      .sort({ createdAt: -1 })
      .toArray()

    if (watchlists.length === 0) return []

    const watchlistIds = watchlists.map((w) => w._id.toString())
    const allItems = await itemsColl
      .find({ watchlistId: { $in: watchlistIds } })
      .sort({ createdAt: 1 })
      .toArray()

    const itemsByWatchlist = new Map<string, WatchlistItem[]>()
    for (const item of allItems) {
      const list = itemsByWatchlist.get(item.watchlistId) || []
      list.push(item)
      itemsByWatchlist.set(item.watchlistId, list)
    }

    return watchlists.map((w) => ({
      ...w,
      items: itemsByWatchlist.get(w._id.toString()) || [],
    }))
  }
)

export function getPortfolioRiskAndAllocation(holdings: InvestmentHolding[]): {
  risk: PortfolioRisk
  allocation: SectorAllocation[]
} {
  return {
    risk: calculatePortfolioRisk(holdings),
    allocation: calculateSectorAllocation(holdings),
  }
}

