import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Recurring Rule Details",
  description: "View recurring transaction schedule, past occurrences, and billing status.",
}
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

import { RecurringDetailSkeleton } from "./loading"

interface PageProps {
  params: Promise<{ id: string }>
}

async function RecurringDetailContent({ params }: PageProps) {
  const { id } = await params
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

export default function RecurringDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<RecurringDetailSkeleton />}>
      <RecurringDetailContent {...props} />
    </Suspense>
  )
}
