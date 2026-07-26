import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getRecurringRuleById } from "@/lib/queries/recurring"
import { getFilteredTransactions } from "@/lib/queries/transactions"
import { getBillInstancesByRuleId } from "@/lib/queries/bills"
import { getWallets } from "@/lib/queries/wallets"
import { getCategories } from "@/lib/queries/categories"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { RecurringDetails } from "@/components/recurring/recurring-details"

function RecurringDetailSkeleton() {
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

async function RecurringDetailContent({ id }: { id: string }) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const rule = await getRecurringRuleById(userId, id)
  if (!rule) {
    notFound()
  }

  const isBill = rule.kind === "bill"

  // Fetch relevant history
  const historyData = await Promise.all([
    isBill ? getBillInstancesByRuleId(id) : getFilteredTransactions(userId, { recurringId: id }, { limit: 50 }),
    getWallets(userId),
    getCategories(userId)
  ])

  const history = historyData[0]
  const wallets = historyData[1]
  const categories = historyData[2]

  return (
    <RecurringDetails
      rule={serializeData(rule)}
      history={serializeData(history)}
      wallets={serializeData(wallets)}
      categories={serializeData(categories)}
    />
  )
}

export default async function RecurringDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<RecurringDetailSkeleton />}>
      <RecurringDetailContent id={id} />
    </Suspense>
  )
}
