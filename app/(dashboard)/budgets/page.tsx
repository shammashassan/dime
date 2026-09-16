import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Budgets",
  description: "Set and track category budgets, monitor spending thresholds, and prevent overspending.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getBudgetsWithSpending, BudgetWithSpending } from "@/lib/queries/budgets"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { getBudgetTemplates } from "@/lib/queries/budget-templates"
import { getTemplateRecommendation } from "@/lib/queries/budget-templates"
import { TemplateRecommendation } from "@/lib/budget-templates/recommendations"
import { Category, Wallet, BudgetTemplate } from "@/types"
import { BudgetsView } from "@/components/budgets/budgets-view"
import { unstable_rethrow } from "next/navigation"
import { serializeData } from "@/lib/utils"

import { BudgetsSkeleton } from "./loading"

async function BudgetsContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let budgets: BudgetWithSpending[] = []
  let categories: Category[] = []
  let wallets: Wallet[] = []
  let templates: BudgetTemplate[] = []
  let recommendation: TemplateRecommendation | null = null

  try {
    const [fetchedBudgets, fetchedCategories, fetchedWallets, fetchedTemplates, fetchedRecommendation] = await Promise.all([
      getBudgetsWithSpending(userId),
      getCategories(userId),
      getWallets(userId),
      getBudgetTemplates(userId),
      getTemplateRecommendation(userId),
    ])
    budgets = fetchedBudgets
    categories = fetchedCategories
    wallets = fetchedWallets
    templates = fetchedTemplates
    recommendation = fetchedRecommendation
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load budgets:", error)
  }

  // Filter categories to only expense to represent budgets (budgets are typically expense limits)
  const expenseCategories = categories.filter((c) => {
    if (Array.isArray(c.type)) {
      return c.type.includes("expense")
    }
    return c.type === "expense" || c.type === "both"
  })

  return (
    <BudgetsView
      budgets={serializeData(budgets)}
      categories={serializeData(expenseCategories)}
      wallets={serializeData(wallets)}
      templates={serializeData(templates)}
      recommendation={serializeData(recommendation)}
    />
  )
}

export default async function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsSkeleton />}>
      <BudgetsContent />
    </Suspense>
  )
}
