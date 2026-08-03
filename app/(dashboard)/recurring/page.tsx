import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getRecurringRules } from "@/lib/queries/recurring"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { getBillInstances } from "@/lib/queries/bills"
import { RecurringView } from "@/components/recurring/recurring-view"
import { Skeleton } from "@/components/ui/skeleton"
import { unstable_rethrow } from "next/navigation"
import { serializeData } from "@/lib/utils"



function RecurringSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-22.5 flex-1 min-w-50 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  )
}

async function RecurringContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let rules: any[] = []
  let categories: any[] = []
  let wallets: any[] = []
  let billInstances: any[] = []

  try {
    const [fetchedRules, fetchedCategories, fetchedWallets, fetchedBills] = await Promise.all([
      getRecurringRules(userId),
      getCategories(userId),
      getWallets(userId),
      getBillInstances()
    ])
    rules = fetchedRules
    categories = fetchedCategories
    wallets = fetchedWallets
    billInstances = fetchedBills
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load recurring rules:", error)
  }

  return (
    <RecurringView
      rules={serializeData(rules)}
      categories={serializeData(categories)}
      wallets={serializeData(wallets)}
      billInstances={serializeData(billInstances)}
    />
  )
}

export default async function RecurringPage() {
  return (
    <Suspense fallback={<RecurringSkeleton />}>
      <RecurringContent />
    </Suspense>
  )
}
