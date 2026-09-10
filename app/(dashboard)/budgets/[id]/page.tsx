import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getBudgetWithSpendingById, getBudgetTransactions } from "@/lib/queries/budgets"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { BudgetDetails } from "@/components/budgets/budget-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { BudgetDetailSkeleton } from "./loading"

interface PageProps {
  params: Promise<{ id: string }>
}

async function BudgetDetailContent({ id }: { id: string }) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const [budget, transactions, categories, wallets] = await Promise.all([
    getBudgetWithSpendingById(userId, id),
    getBudgetTransactions(userId, id),
    getCategories(userId),
    getWallets(userId),
  ])

  if (!budget) {
    notFound()
  }

  // Filter categories to only expense to represent budgets (consistent with the budgets list page)
  const expenseCategories = categories.filter((c: any) => {
    if (Array.isArray(c.type)) {
      return c.type.includes("expense")
    }
    return c.type === "expense" || c.type === "both"
  })

  return (
    <BudgetDetails
      budget={serializeData(budget)}
      transactions={serializeData(transactions) as any}
      categories={serializeData(expenseCategories)}
      wallets={serializeData(wallets)}
    />
  )
}

export default async function BudgetDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<BudgetDetailSkeleton />}>
      <BudgetDetailContent id={id} />
    </Suspense>
  )
}