import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getWallets } from "@/lib/queries/wallets"
import { getLoans, getContacts, getOwedSummaries } from "@/lib/queries/loans"
import { LoansList } from "@/components/loans/loans-list"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { LoansSkeleton } from "./loading"

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
