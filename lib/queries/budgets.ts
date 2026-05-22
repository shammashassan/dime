import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Budget, Category, Wallet, Transaction } from "@/types"
import { getCategories } from "./categories"
import { getWallets } from "./wallets"

export interface BudgetWithSpending extends Budget {
  spent: number
  categoryName: string
  categoryColor: string
  walletName?: string
}

export const getBudgets = cache(async (userId: string): Promise<Budget[]> => {
  const budgetsColl = await getCollection<Budget>("budgets")
  return budgetsColl.find({ userId }).toArray()
})

export const getActiveBudgets = cache(async (userId: string): Promise<Budget[]> => {
  const budgetsColl = await getCollection<Budget>("budgets")
  return budgetsColl.find({ userId, isActive: true }).toArray()
})

export const getBudgetById = cache(async (userId: string, budgetId: string): Promise<Budget | null> => {
  try {
    const budgetsColl = await getCollection<Budget>("budgets")
    return budgetsColl.findOne({ _id: new ObjectId(budgetId), userId })
  } catch (err) {
    return null
  }
})

export const getBudgetsWithSpending = cache(async (userId: string): Promise<BudgetWithSpending[]> => {
  const budgets = await getBudgets(userId)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const [categories, wallets] = await Promise.all([
    getCategories(userId),
    getWallets(userId),
  ])

  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
  const walletMap = new Map(wallets.map((w) => [w._id.toString(), w]))

  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const cat = categoryMap.get(budget.categoryId)
      const wallet = budget.walletId ? walletMap.get(budget.walletId) : undefined

      const query: any = {
        userId,
        categoryId: budget.categoryId,
        type: "expense",
        date: { $gte: budget.startDate },
      }
      if (budget.endDate) {
        query.date.$lte = budget.endDate
      }
      if (budget.walletId) {
        query.walletId = budget.walletId
      }

      const txs = await transactionsColl.find(query).toArray()
      const spent = txs.reduce((sum, tx) => sum + tx.amount, 0)

      return {
        ...budget,
        spent,
        categoryName: cat ? cat.name : "Category",
        categoryColor: cat ? cat.color : "#94a3b8",
        walletName: wallet ? wallet.name : undefined,
      }
    })
  )

  return budgetsWithSpending
})

