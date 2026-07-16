import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { AutomationRule, AutomationJob } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

export const getAutomationRules = cache(async (userId: string): Promise<AutomationRule[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  return rulesColl.find(filter).sort({ priority: -1 }).toArray()
})

export const getAutomationRuleById = cache(async (userId: string, ruleId: string): Promise<AutomationRule | null> => {
  try {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const rulesColl = await getCollection<AutomationRule>("automation_rules")
    return rulesColl.findOne({ _id: new ObjectId(ruleId), ...filter })
  } catch {
    return null
  }
})

export const getAutomationJobs = cache(async (userId: string): Promise<AutomationJob[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const jobsColl = await getCollection<AutomationJob>("automation_jobs")
  return jobsColl.find(filter).sort({ createdAt: -1 }).toArray()
})

export const getAutomationJobById = cache(async (userId: string, jobId: string): Promise<AutomationJob | null> => {
  try {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const jobsColl = await getCollection<AutomationJob>("automation_jobs")
    return jobsColl.findOne({ _id: new ObjectId(jobId), ...filter })
  } catch {
    return null
  }
})
