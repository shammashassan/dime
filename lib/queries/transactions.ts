import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId, Filter } from "mongodb"
import { Transaction } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getWallets } from "./wallets"

export interface TransactionFilters {
  startDate?: Date
  endDate?: Date
  type?: "income" | "expense" | "transfer"
  categoryIds?: string[]
  walletIds?: string[]
  minAmount?: number
  maxAmount?: number
  tags?: string[]
  search?: string
  isFlagged?: boolean
  needsReview?: boolean
}

function buildQuery(
  filters: TransactionFilters,
  allowedWalletIds: string[],
  scopeFilter: Filter<Transaction>
): Filter<Transaction> {
  // Query transactions in wallets the user has access to
  const query: Filter<Transaction> = {
    ...scopeFilter,
    walletId: { $in: allowedWalletIds }
  }

  if (filters.startDate || filters.endDate) {
    const dateQuery: { $gte?: Date; $lte?: Date } = {}
    if (filters.startDate) {
      dateQuery.$gte = filters.startDate
    }
    if (filters.endDate) {
      dateQuery.$lte = filters.endDate
    }
    query.date = dateQuery
  }

  if (filters.type) {
    query.type = filters.type
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    query.$or = [
      { categoryId: { $in: filters.categoryIds } },
      { "splits.categoryId": { $in: filters.categoryIds } }
    ]
  }

  if (filters.walletIds && filters.walletIds.length > 0) {
    // Intersect requested wallets with allowed wallets for security
    const intersected = filters.walletIds.filter(id => allowedWalletIds.includes(id))
    query.walletId = { $in: intersected }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const amountQuery: { $gte?: number; $lte?: number } = {}
    if (filters.minAmount !== undefined) {
      amountQuery.$gte = filters.minAmount
    }
    if (filters.maxAmount !== undefined) {
      amountQuery.$lte = filters.maxAmount
    }
    query.amount = amountQuery
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags }
  }

  if (filters.search) {
    query.description = { $regex: filters.search, $options: "i" }
  }

  if (filters.isFlagged !== undefined) {
    query.isFlagged = filters.isFlagged
  }

  if (filters.needsReview !== undefined) {
    query.needsReview = filters.needsReview
  }

  return query
}

export const getFilteredTransactions = cache(
  async (
    userId: string,
    filters: TransactionFilters,
    pagination?: { limit?: number; skip?: number },
    sort?: { sortBy?: "date" | "amount" | "description"; sortOrder?: "asc" | "desc" }
  ): Promise<Transaction[]> => {
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)
    const transactionsColl = await getCollection<Transaction>("transactions")
    
    // Resolve allowed wallet IDs (owned and shared)
    const wallets = await getWallets(userId)
    const allowedWalletIds = wallets.map(w => w._id.toString())
    
    const query = buildQuery(filters, allowedWalletIds, scopeFilter)

    // Build sort object: default to date desc
    const sortBy = sort?.sortBy || "date"
    const sortOrder = sort?.sortOrder === "asc" ? 1 : -1
    const sortObj: Record<string, 1 | -1> = {}
    sortObj[sortBy] = sortOrder
    // Always add secondary sort for stable pagination
    if (sortBy !== "date") sortObj.date = -1
    sortObj.createdAt = -1

    let cursor = transactionsColl.find(query).sort(sortObj)

    if (pagination) {
      if (pagination.skip !== undefined) {
        cursor = cursor.skip(pagination.skip)
      }
      if (pagination.limit !== undefined) {
        cursor = cursor.limit(pagination.limit)
      }
    }

    return cursor.toArray()
  }
)

export const getFilteredTransactionsCount = cache(
  async (userId: string, filters: TransactionFilters): Promise<number> => {
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)
    const transactionsColl = await getCollection<Transaction>("transactions")
    
    // Resolve allowed wallet IDs (owned and shared)
    const wallets = await getWallets(userId)
    const allowedWalletIds = wallets.map(w => w._id.toString())
    
    const query = buildQuery(filters, allowedWalletIds, scopeFilter)
    return transactionsColl.countDocuments(query)
  }
)

export const getTransactionById = cache(
  async (userId: string, transactionId: string): Promise<Transaction | null> => {
    try {
      const scope = await getFinancialScope()
      const scopeFilter = getScopeFilter(scope)
      const transactionsColl = await getCollection<Transaction>("transactions")
      const wallets = await getWallets(userId)
      const allowedWalletIds = wallets.map(w => w._id.toString())
      
      return transactionsColl.findOne({ 
        _id: new ObjectId(transactionId),
        walletId: { $in: allowedWalletIds },
        ...scopeFilter
      })
    } catch {
      return null
    }
  }
)

export const getRecentTransactions = cache(
  async (userId: string, limit: number = 5): Promise<Transaction[]> => {
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)
    const transactionsColl = await getCollection<Transaction>("transactions")
    const wallets = await getWallets(userId)
    const allowedWalletIds = wallets.map(w => w._id.toString())

    return transactionsColl.find({ 
      walletId: { $in: allowedWalletIds },
      ...scopeFilter
    }).sort({ date: -1, createdAt: -1 }).limit(limit).toArray()
  }
)
