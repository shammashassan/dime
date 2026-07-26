import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getLoanById, getLoanRepayments, getContacts } from "@/lib/queries/loans"
import { getWallets } from "@/lib/queries/wallets"
import { LoanDetails } from "@/components/loans/loan-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function LoanDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse p-1">
      {/* Header Skeleton */}
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
        {/* Left Side Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        {/* Right Side Skeleton */}
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

async function LoanDetailContent({ id }: { id: string }) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  // Fetch loan, repayments, wallets, and contacts in parallel
  const [loan, repayments, wallets, contacts] = await Promise.all([
    getLoanById(id),
    getLoanRepayments(id),
    getWallets(userId),
    getContacts(),
  ])

  if (!loan) {
    notFound()
  }

  return (
    <LoanDetails
      loan={serializeData(loan)}
      repayments={serializeData(repayments)}
      wallets={serializeData(wallets)}
      contacts={serializeData(contacts)}
    />
  )
}

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<LoanDetailSkeleton />}>
      <LoanDetailContent id={id} />
    </Suspense>
  )
}
