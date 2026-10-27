import { cache } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Goal, Transaction } from "@/types"
import { getFinancialScope } from "@/lib/scope"

async function fetchGoals(userId: string, orgId?: string | null): Promise<Goal[]> {
  "use cache"
  cacheTag("goals", `goals-${userId}`)
  cacheLife("minutes")

  const filter = orgId
    ? { organizationId: orgId }
    : {
        userId,
        $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
      }
  const goalsColl = await getCollection<Goal>("goals")
  return goalsColl.find(filter).sort({ targetDate: 1 }).toArray()
}

export const getGoals = cache(async (userId: string): Promise<Goal[]> => {
  const scope = await getFinancialScope()
  return fetchGoals(userId, scope.organizationId)
})

async function fetchGoalById(userId: string, id: string, orgId?: string | null): Promise<Goal | null> {
  "use cache"
  cacheTag("goals", `goals-${userId}`)
  cacheLife("minutes")

  try {
    const filter = orgId
      ? { organizationId: orgId }
      : {
          userId,
          $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
        }
    const goalsColl = await getCollection<Goal>("goals")
    return goalsColl.findOne({ _id: new ObjectId(id), ...filter })
  } catch {
    return null
  }
}

export const getGoalById = cache(async (userId: string, id: string): Promise<Goal | null> => {
  const scope = await getFinancialScope()
  return fetchGoalById(userId, id, scope.organizationId)
})

// Contributions are just transactions tagged with this goal's id (see contributeToGoal
// in lib/actions/goals.ts, which logs an expense transaction with goalId set).
export const getGoalContributions = cache(async (goalId: string): Promise<Transaction[]> => {
  const scope = await getFinancialScope()
  const filter = scope.isOrganization
    ? { organizationId: scope.organizationId }
    : {
        userId: scope.userId,
        $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
      }
  const transactionsColl = await getCollection<Transaction>("transactions")
  return transactionsColl
    .find({ ...filter, goalId })
    .sort({ date: -1 })
    .toArray()
})
