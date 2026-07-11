import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Goal } from "@/types"
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
