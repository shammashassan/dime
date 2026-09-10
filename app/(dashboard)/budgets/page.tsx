import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getBudgetsWithSpending } from "@/lib/queries/budgets"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { BudgetsView } from "@/components/budgets/budgets-view"
import { Skeleton } from "@/components/ui/skeleton"
import { unstable_rethrow } from "next/navigation"
import { serializeData } from "@/lib/utils"



import { BudgetsSkeleton } from "./loading"

async function BudgetsContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let budgets: any[] = []
  let categories: any[] = []
  let wallets: any[] = []

  try {
    const [fetchedBudgets, fetchedCategories, fetchedWallets] = await Promise.all([
      getBudgetsWithSpending(userId),
      getCategories(userId),
      getWallets(userId)
    ])
    budgets = fetchedBudgets
    categories = fetchedCategories
    wallets = fetchedWallets
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
