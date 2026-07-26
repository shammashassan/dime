import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getWallets } from "@/lib/queries/wallets"
import { getLoans, getContacts, getOwedSummaries } from "@/lib/queries/loans"
import { LoansList } from "@/components/loans/loans-list"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function LoansSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {/* Metrics Row */}
      <div className="flex flex-wrap gap-4 mt-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="flex gap-3 w-full sm:w-auto">
          <Skeleton className="h-9 w-full sm:w-48 rounded-xl" />
        </div>
      </div>
      {/* Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

async function LoansContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  // Fetch wallets, loans, contacts and summaries in parallel
  const [wallets, loans, contacts, summaries] = await Promise.all([
    getWallets(userId),
    getLoans(),
    getContacts(),
    getOwedSummaries(),
  ])

  return (
    <LoansList
      initialLoans={serializeData(loans)}
      wallets={serializeData(wallets)}
      contacts={serializeData(contacts)}
      summaries={serializeData(summaries)}
    />
  )
}

export default async function LoansPage() {
  return (
    <Suspense fallback={<LoansSkeleton />}>
      <LoansContent />
    </Suspense>
  )
}
