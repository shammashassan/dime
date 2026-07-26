import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getBudgetWithSpendingById, getBudgetTransactions } from "@/lib/queries/budgets"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { BudgetDetails } from "@/components/budgets/budget-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function BudgetDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse p-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

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