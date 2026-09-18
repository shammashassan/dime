import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { InvestmentTransaction, InvestmentPrice, InvestmentHolding, Wallet } from "@/types"
import { ObjectId } from "mongodb"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { deriveHoldingState } from "@/lib/calculations/investments"

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

