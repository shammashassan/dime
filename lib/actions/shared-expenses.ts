"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import {
  sharedExpensesCollection,
  sharedSettlementsCollection,
  contactsCollection,
  notificationsCollection,
  walletsCollection,
  transactionsCollection,
  categoriesCollection
} from "@/lib/db/collections"
import {
  createSharedExpenseSchema,
  CreateSharedExpenseInput,
  recordSettlementSchema,
  RecordSettlementInput,
} from "@/lib/validations/shared-expenses"
import { validateExpenseSplits, buildSharedExpensesOverviewViewModel } from "@/lib/calculations/shared-expenses"
import { SharedExpense, SharedSettlement, Transaction, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"

/**
 * Creates a new shared expense split.
 */
export async function createSharedExpenseAction(rawInput: CreateSharedExpenseInput) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const parsed = createSharedExpenseSchema.parse(rawInput)
  const now = new Date()

  // Validate splits with pure domain calculation rule
  const splitError = validateExpenseSplits(parsed.totalAmount, parsed.participants)
  if (splitError) {
    throw new Error(splitError)
  }

  // Optional: Create actual wallet transaction if walletId was provided
  let createdTxId = parsed.transactionId

  if (parsed.walletId) {
    const wallet = await walletsCollection.findOne({
      _id: new ObjectId(parsed.walletId),
      ...getScopeFilter(scope),
    })

    if (wallet) {
      let category = await categoriesCollection.findOne({
        name: "Food & Dining",
        userId: null,
      })
      if (!category) {
        category = await categoriesCollection.findOne({ isDefault: true })
      }

      // If current user paid upfront -> expense on wallet for total amount paid
      const userParticipant = parsed.participants.find((p) => p.participantId === session.user.id)
      const amountPaidByUser = userParticipant?.amountPaid || 0

      if (amountPaidByUser > 0) {
        const tx: Transaction = {
          _id: new ObjectId(),
          userId: session.user.id,
          walletId: parsed.walletId,
          categoryId: category?._id.toString() || null,
          type: "expense",
          amount: amountPaidByUser,
          currency: parsed.currency,
          description: `Shared Expense: ${parsed.title}`,
          notes: parsed.notes,
          date: parsed.date,
          tags: ["shared-expense"],
          isRecurring: false,
          createdAt: now,
          updatedAt: now,
          organizationId: scope.organizationId,
          version: 1,
        }

        await transactionsCollection.insertOne(tx)
        createdTxId = tx._id.toString()

        // Update wallet balance (money paid out)
        await walletsCollection.updateOne(
          { _id: new ObjectId(parsed.walletId) },
          { $inc: { balance: -amountPaidByUser }, $set: { updatedAt: now } }
        )
      }
    }
  }

  const newExpense: SharedExpense = {
    _id: new ObjectId(),
    userId: session.user.id,
    organizationId: scope.organizationId,
    transactionId: createdTxId,
    title: parsed.title,
    totalAmount: parsed.totalAmount,
    currency: parsed.currency,
    paidByParticipantId: parsed.paidByParticipantId,
    paidByParticipantType: parsed.paidByParticipantType,
    splitMode: parsed.splitMode,
    participants: parsed.participants,
    status: "unsettled",
    date: parsed.date,
    notes: parsed.notes,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }

  await sharedExpensesCollection.insertOne(newExpense)

  // Optional: Trigger inbox notification for participants
  try {
    for (const p of parsed.participants) {
      if (p.participantType === "user" && p.participantId !== session.user.id) {
        await notificationsCollection.insertOne({
          _id: new ObjectId(),
          userId: p.participantId,
          title: "New Shared Expense",
          message: `${session.user.name || "A partner"} added "${parsed.title}" (${(p.amountOwed / 100).toFixed(2)} ${parsed.currency}).`,
          type: "shared_expense",
          link: "/shared-expenses",
          createdAt: now,
          updatedAt: now,
        })
      }
    }
  } catch (err) {
    console.error("Failed to dispatch shared expense notifications:", err)
  }

  revalidatePath("/shared-expenses")
  revalidatePath("/contacts")
  updateTag("shared-expenses")

  return { success: true, expenseId: newExpense._id.toString() }
}

/**
 * Records a settlement payment between participants.
 */
export async function recordSettlementAction(rawInput: RecordSettlementInput) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const parsed = recordSettlementSchema.parse(rawInput)
  const now = new Date()

  // Optional Wallet Transaction creation if walletId is provided
  let createdTransactionId: string | undefined = undefined

  if (parsed.walletId) {
    const wallet = await walletsCollection.findOne({
      _id: new ObjectId(parsed.walletId),
      ...getScopeFilter(scope),
    })

    if (wallet) {
      // Find or create default "Transfer / Settlement" category
      let category = await categoriesCollection.findOne({
        name: "Loan / Lending",
        userId: null,
      })
      if (!category) {
        category = await categoriesCollection.findOne({ isDefault: true })
      }

      // If current user is receiving money from settlement -> income, if paying -> expense
      const isUserReceiving = parsed.toParticipantId === session.user.id
      const txType = isUserReceiving ? "income" : "expense"

      const tx: Transaction = {
        _id: new ObjectId(),
        userId: session.user.id,
        walletId: parsed.walletId,
        categoryId: category?._id.toString() || null,
        type: txType,
        amount: parsed.amount,
        currency: parsed.currency,
        description: `Expense Settlement - ${parsed.notes || "Repayment"}`,
        notes: `Settlement from ${parsed.fromParticipantId} to ${parsed.toParticipantId}`,
        date: parsed.settledAt,
        tags: ["shared-expense", "settlement"],
        isRecurring: false,
        createdAt: now,
        updatedAt: now,
        organizationId: scope.organizationId,
        version: 1,
      }

      await transactionsCollection.insertOne(tx)
      createdTransactionId = tx._id.toString()

      // Adjust wallet balance
      const balanceChange = isUserReceiving ? parsed.amount : -parsed.amount
      await walletsCollection.updateOne(
        { _id: new ObjectId(parsed.walletId) },
        { $inc: { balance: balanceChange }, $set: { updatedAt: now } }
      )
    }
  }

  const newSettlement: SharedSettlement = {
    _id: new ObjectId(),
    userId: session.user.id,
    organizationId: scope.organizationId,
    expenseId: parsed.expenseId,
    fromParticipantId: parsed.fromParticipantId,
    fromParticipantType: parsed.fromParticipantType,
    toParticipantId: parsed.toParticipantId,
    toParticipantType: parsed.toParticipantType,
    amount: parsed.amount,
    currency: parsed.currency,
    paymentMethod: parsed.paymentMethod,
    transactionId: createdTransactionId,
    settledAt: parsed.settledAt,
    notes: parsed.notes,
    createdAt: now,
  }

  await sharedSettlementsCollection.insertOne(newSettlement)

  // Update specific expense status if expenseId was supplied
  if (parsed.expenseId && ObjectId.isValid(parsed.expenseId)) {
    await sharedExpensesCollection.updateOne(
      { _id: new ObjectId(parsed.expenseId) },
      { $set: { status: "settled", updatedAt: now } }
    )
  }

  revalidatePath("/shared-expenses")
  revalidatePath("/contacts")
  revalidatePath("/wallets")
  updateTag("shared-expenses")

  return { success: true, settlementId: newSettlement._id.toString() }
}

/**
 * Deletes a shared expense record.
 */
export async function deleteSharedExpenseAction(id: string) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid expense ID")
  }

  const res = await sharedExpensesCollection.deleteOne({
    _id: new ObjectId(id),
    ...getScopeFilter(scope),
  })

  if (res.deletedCount === 0) {
    throw new Error("Shared expense not found or unauthorized")
  }

  revalidatePath("/shared-expenses")
  updateTag("shared-expenses")

  return { success: true }
}

/**
 * Retrieves the complete Overview ViewModel for the `/shared-expenses` page.
 */
export async function getSharedExpensesOverviewAction(contactId?: string) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const scopeFilter = getScopeFilter(scope)

  // Fetch raw expenses
  const rawExpenses = await sharedExpensesCollection
    .find(scopeFilter)
    .sort({ date: -1 })
    .toArray()

  // Fetch raw settlements
  const rawSettlements = await sharedSettlementsCollection
    .find(scopeFilter)
    .sort({ settledAt: -1 })
    .toArray()

  // Also fetch contacts to ensure participant names/emails are populated
  const contacts = await contactsCollection.find(scopeFilter).toArray()
  const contactMap = new Map(contacts.map((c) => [c._id.toString(), c]))

  // Enrich expense participants with fresh contact metadata if needed
  const enrichedExpenses = rawExpenses.map((exp) => ({
    ...exp,
    participants: exp.participants.map((p) => {
      if (p.participantType === "contact" && contactMap.has(p.participantId)) {
        const c = contactMap.get(p.participantId)!
        return {
          ...p,
          name: c.name,
          email: c.email || p.email,
        }
      }
      return p
    }),
  }))

  // Filter by contactId if requested
  const filteredExpenses = contactId
    ? enrichedExpenses.filter((e) =>
        e.participants.some((p) => p.participantId === contactId)
      )
    : enrichedExpenses

  const filteredSettlements = contactId
    ? rawSettlements.filter(
        (s) =>
          s.fromParticipantId === contactId || s.toParticipantId === contactId
      )
    : rawSettlements

  // Build ViewModel using pure domain function
  const viewModel = buildSharedExpensesOverviewViewModel({
    currentUserId: session.user.id,
    currentUserName: session.user.name,
    expenses: JSON.parse(JSON.stringify(filteredExpenses)),
    settlements: JSON.parse(JSON.stringify(filteredSettlements)),
  })

  // Also fetch user's contacts list for UI selectors
  const serializedContacts = contacts.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    email: c.email,
  }))

  return {
    viewModel,
    contacts: serializedContacts,
    currentUserId: session.user.id,
    currentUserName: session.user.name,
  }
}
