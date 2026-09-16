import type { Metadata } from "next"
import { Suspense } from "react"
import { getSharedExpensesOverviewAction } from "@/lib/actions/shared-expenses"
import { SharedExpensesClient } from "@/components/shared-expenses/shared-expenses-client"
import { getCollection, walletsCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { SharedExpensesSkeleton } from "./loading"

export const metadata: Metadata = {
  title: "Shared Expenses",
  description: "Split bills and group expenses fairly, track who paid what, and settle balances easily.",
}

interface SharedExpensesPageProps {
  searchParams: Promise<{ contactId?: string }>
}

async function SharedExpensesContent({
  searchParams,
}: SharedExpensesPageProps) {
  const { contactId } = await searchParams
  const scope = await getFinancialScope()

  const [overviewData, userWallets] = await Promise.all([
    getSharedExpensesOverviewAction(contactId),
    walletsCollection.find({ ...getScopeFilter(scope), isArchived: false }).toArray(),
  ])

  const serializedWallets = userWallets.map((w) => ({
    id: w._id.toString(),
    name: w.name,
  }))

  return (
    <SharedExpensesClient
      viewModel={overviewData.viewModel}
      contacts={overviewData.contacts}
      wallets={serializedWallets}
      currentUserId={overviewData.currentUserId}
      currentUserName={overviewData.currentUserName}
    />
  )
}

export default function SharedExpensesPage(props: SharedExpensesPageProps) {
  return (
    <Suspense fallback={<SharedExpensesSkeleton />}>
      <SharedExpensesContent {...props} />
    </Suspense>
  )
}
