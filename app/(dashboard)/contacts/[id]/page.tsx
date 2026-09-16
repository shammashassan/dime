import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Contact Profile",
  description: "View outstanding balances, loan history, and shared expenses with this contact.",
}
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter, buildScopedQuery } from "@/lib/scope"
import { getCollection } from "@/lib/db/collections"
import { SharedExpense, SharedSettlement } from "@/types"
import { getContactById, getLoansByContact, getActiveBaseCurrency, getContactBalanceDailyHistory, getLoanRepayments } from "@/lib/queries/loans"
import { ContactDetails } from "@/components/contacts/contact-details"
import { unstable_rethrow } from "next/navigation"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { ContactDetailSkeleton } from "./loading"

interface PageProps {
  params: Promise<{ id: string }>
}

async function ContactDetailContent({ params }: PageProps) {
  const { id } = await params
  await requireApprovedUser()
  const scope = await getFinancialScope()
  const scopeFilter = getScopeFilter(scope)

  let contact
  let loans
  let baseCurrency
  let history
  let repayments: any[] = []
  let sharedExpenses: any[] = []
  let sharedSettlements: any[] = []

  try {
    contact = await getContactById(id)
    if (!contact) {
      notFound()
    }
    const sharedExpensesColl = await getCollection<SharedExpense>("shared_expenses")
    const sharedSettlementsColl = await getCollection<SharedSettlement>("shared_settlements")

    // Fetch in parallel
    const [fetchedLoans, fetchedBaseCurrency, fetchedHistory, fetchedExpenses, fetchedSettlements] = await Promise.all([
      getLoansByContact(id, contact.name),
      getActiveBaseCurrency(),
      getContactBalanceDailyHistory(id, contact.name, 90),
      sharedExpensesColl
        .find(buildScopedQuery(scopeFilter, { "participants.participantId": id }))
        .toArray(),
      sharedSettlementsColl
        .find(buildScopedQuery(scopeFilter, { $or: [{ fromParticipantId: id }, { toParticipantId: id }] }))
        .toArray(),
    ])

    loans = fetchedLoans
    baseCurrency = fetchedBaseCurrency
    history = fetchedHistory
    sharedExpenses = fetchedExpenses
    sharedSettlements = fetchedSettlements

    // Fetch repayments for every loan tied to this contact, in parallel
    const repaymentLists = await Promise.all(loans.map((loan) => getLoanRepayments(loan._id.toString())))
    repayments = repaymentLists.flat()
  } catch (error: any) {
    unstable_rethrow(error)
    notFound()
  }

  return (
    <ContactDetails
      contact={serializeData(contact)}
      loans={serializeData(loans)}
      baseCurrency={baseCurrency}
      history={serializeData(history)}
      repayments={serializeData(repayments)}
      sharedExpenses={serializeData(sharedExpenses)}
      sharedSettlements={serializeData(sharedSettlements)}
    />
  )
}

export default function ContactDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<ContactDetailSkeleton />}>
      <ContactDetailContent {...props} />
    </Suspense>
  )
}