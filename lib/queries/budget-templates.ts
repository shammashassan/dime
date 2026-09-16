import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { BudgetTemplate } from "@/types"
import { SYSTEM_BUDGET_TEMPLATES } from "@/lib/budget-templates/system-templates"
import { computeTemplateRecommendation, TemplateRecommendation } from "@/lib/budget-templates/recommendations"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getBudgetTemplates = cache(async (userId: string): Promise<BudgetTemplate[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const templatesColl = await getCollection<BudgetTemplate>("budget_templates")
  const customTemplates = await templatesColl.find(filter).sort({ createdAt: -1 }).toArray()

  // Return system templates followed by custom user templates
  return [...SYSTEM_BUDGET_TEMPLATES, ...customTemplates]
})

export const getTemplateRecommendation = cache(async (userId: string): Promise<TemplateRecommendation> => {
  return computeTemplateRecommendation(userId)
})
