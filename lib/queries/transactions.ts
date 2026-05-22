import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Transaction } from "@/types"

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
}

function buildQuery(userId: string, filters: TransactionFilters) {
  const query: any = { userId }

  if (filters.startDate || filters.endDate) {
    query.date = {}
    if (filters.startDate) {
      query.date.$gte = filters.startDate
    }
    if (filters.endDate) {
      query.date.$lte = filters.endDate
    }
  }

  if (filters.type) {
    query.type = filters.type
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    query.categoryId = { $in: filters.categoryIds }
  }

  if (filters.walletIds && filters.walletIds.length > 0) {
    query.walletId = { $in: filters.walletIds }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    query.amount = {}
    if (filters.minAmount !== undefined) {
      query.amount.$gte = filters.minAmount
    }
    if (filters.maxAmount !== undefined) {
      query.amount.$lte = filters.maxAmount
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags }
  }

  if (filters.search) {
    query.description = { $regex: filters.search, $options: "i" }
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
    const transactionsColl = await getCollection<Transaction>("transactions")
    const query = buildQuery(userId, filters)

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
    const transactionsColl = await getCollection<Transaction>("transactions")
    const query = buildQuery(userId, filters)
    return transactionsColl.countDocuments(query)
  }
)

export const getTransactionById = cache(
  async (userId: string, transactionId: string): Promise<Transaction | null> => {
    try {
      const transactionsColl = await getCollection<Transaction>("transactions")
      return transactionsColl.findOne({ _id: new ObjectId(transactionId), userId })
    } catch (err) {
      return null
    }
  }
)

export const getRecentTransactions = cache(
  async (userId: string, limit: number = 5): Promise<Transaction[]> => {
    const transactionsColl = await getCollection<Transaction>("transactions")
    return transactionsColl.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(limit).toArray()
  }
)
