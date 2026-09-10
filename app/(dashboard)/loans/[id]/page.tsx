import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getLoanById, getLoanRepayments, getContacts } from "@/lib/queries/loans"
import { getWallets } from "@/lib/queries/wallets"
import { LoanDetails } from "@/components/loans/loan-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { LoanDetailSkeleton } from "./loading"

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
