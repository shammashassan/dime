import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { sharedExpensesCollection, sharedSettlementsCollection, contactsCollection, walletsCollection } from "@/lib/db/collections"
import { SharedExpenseDetails } from "@/components/shared-expenses/shared-expense-details"
import { ObjectId } from "mongodb"

export default async function SharedExpenseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!ObjectId.isValid(id)) {
    notFound()
  }

  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const scopeFilter = getScopeFilter(scope)

  const expense = await sharedExpensesCollection.findOne({
    _id: new ObjectId(id),
    ...scopeFilter,
  })

  if (!expense) {
    notFound()
  }

  const participantIds = expense.participants.map((p) => p.participantId)

  const [rawSettlements, rawContacts, rawWallets] = await Promise.all([
    sharedSettlementsCollection
      .find({
        ...scopeFilter,
        $or: [
          { expenseId: id },
          {
            fromParticipantId: { $in: participantIds },
            toParticipantId: { $in: participantIds },
          },
        ],
      })
      .sort({ settledAt: -1 })
      .toArray(),
    contactsCollection.find(scopeFilter).toArray(),
    walletsCollection.find({ ...scopeFilter, isArchived: false }).toArray(),
  ])

  const contacts = rawContacts.map((c) => ({
    id: c._id.toString(),
    name: c.name,
  }))

  const wallets = rawWallets.map((w) => ({
    id: w._id.toString(),
    name: w.name,
    currency: w.currency || "INR",
    balanceCents: w.balance ?? 0,
  }))

  return (
    <SharedExpenseDetails
      expense={JSON.parse(JSON.stringify(expense))}
      settlements={JSON.parse(JSON.stringify(rawSettlements))}
      currentUserId={session.user.id}
      currentUserName={session.user.name}
      contacts={contacts}
      wallets={wallets}
    />
  )
}
