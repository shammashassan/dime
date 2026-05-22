import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { RecurringRule } from "@/types"

export const getRecurringRules = cache(async (userId: string): Promise<RecurringRule[]> => {
  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  return recurringColl.find({ userId }).sort({ createdAt: -1 }).toArray()
})

export const getActiveRecurringRules = cache(async (userId: string): Promise<RecurringRule[]> => {
  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  return recurringColl.find({ userId, isActive: true }).toArray()
})

export const getRecurringRuleById = cache(async (userId: string, ruleId: string): Promise<RecurringRule | null> => {
  try {
    const recurringColl = await getCollection<RecurringRule>("recurring_rules")
    return recurringColl.findOne({ _id: new ObjectId(ruleId), userId })
  } catch (err) {
    return null
  }
})
