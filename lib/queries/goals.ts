import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Goal, Transaction } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

export const getGoals = cache(async (userId: string): Promise<Goal[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const goalsColl = await getCollection<Goal>("goals")
  return goalsColl.find(filter).sort({ targetDate: 1 }).toArray()
})

export const getGoalById = cache(async (userId: string, id: string): Promise<Goal | null> => {
  try {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const goalsColl = await getCollection<Goal>("goals")
    return goalsColl.findOne({ _id: new ObjectId(id), ...filter })
  } catch {
    return null
  }
})

// Contributions are just transactions tagged with this goal's id (see contributeToGoal
// in lib/actions/goals.ts, which logs an expense transaction with goalId set).
export const getGoalContributions = cache(async (goalId: string): Promise<Transaction[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  return transactionsColl
    .find({ ...filter, goalId })
    .sort({ date: -1 })
    .toArray()
})