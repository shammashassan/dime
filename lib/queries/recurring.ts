import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { RecurringRule } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

export const getRecurringRules = cache(async (userId: string): Promise<RecurringRule[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  return recurringColl.find(filter).sort({ createdAt: -1 }).toArray()
})

export const getActiveRecurringRules = cache(async (userId: string): Promise<RecurringRule[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  return recurringColl.find({ ...filter, isActive: true }).toArray()
})

export const getRecurringRuleById = cache(async (userId: string, ruleId: string): Promise<RecurringRule | null> => {
  try {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const recurringColl = await getCollection<RecurringRule>("recurring_rules")
    return recurringColl.findOne({ _id: new ObjectId(ruleId), ...filter })
  } catch (err) {
    return null
  }
})
