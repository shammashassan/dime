"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection, loansCollection, loanRepaymentsCollection, contactsCollection, transactionsCollection, walletsCollection } from "@/lib/db/collections"
import { loanSchema, LoanInput, repaymentSchema, RepaymentInput, contactSchema, ContactInput } from "@/lib/validations/loan.schema"
import { Loan, LoanRepayment, Contact, Transaction, Wallet, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { canCreateTransactions, canEditTransactions, canDeleteTransactions, Role } from "@/lib/permissions"

// Helper to update a wallet's balance
async function updateWalletBalance(scope: any, walletId: string, amountChange: number) {
  const walletsColl = await getCollection<Wallet>("wallets")
  await walletsColl.updateOne(
    { _id: new ObjectId(walletId), ...getScopeFilter(scope) },
    {
      $inc: { balance: amountChange, version: 1 },
      $set: { updatedAt: new Date(), updatedBy: scope.userId }
    }
  )
}

// Internal helper to recalculate loan remainingAmount and status
export async function recalculateLoanState(loanId: string | ObjectId) {
  const loanOid = typeof loanId === "string" ? new ObjectId(loanId) : loanId
  const loansColl = await getCollection<Loan>("loans")
  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")

  const loan = await loansColl.findOne({ _id: loanOid })
  if (!loan) return

  const repayments = await repaymentsColl.find({ loanId: loanOid.toString() }).toArray()
  const totalRepaid = repayments.reduce((sum, rep) => sum + rep.amount, 0)
  const remainingAmount = Math.max(0, loan.amount - totalRepaid)

  let status = loan.status

  if (status !== "cancelled") {
    if (remainingAmount <= 0) {
      status = "fully_repaid"
    } else if (totalRepaid > 0) {
      status = "partially_repaid"
    } else {
      status = "active"
    }

    // Check if past due date (and not fully repaid)
    if (status !== "fully_repaid" && loan.dueDate) {
      if (new Date(loan.dueDate) < new Date()) {
        status = "overdue"
      }
    }
  }

  await loansColl.updateOne(
    { _id: loanOid },
    {
      $set: {
        remainingAmount,
        status,
        updatedAt: new Date()
      },
      $inc: { version: 1 }
    }
  )
}

export async function createContact(input: ContactInput) {
  await requireApprovedUser()
  const validated = contactSchema.parse(input)
  const scope = await getFinancialScope()

  const contactsColl = await getCollection<Contact>("contacts")

  const contact: Omit<Contact, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    name: validated.name,
    email: validated.email || undefined,
    phone: validated.phone || undefined,
    notes: validated.notes || undefined,
    metadata: validated.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }

  const result = await contactsColl.insertOne(contact as Contact)
  updateTag("contacts")
  return { success: true, id: result.insertedId.toString() }
}

export async function createLoan(input: LoanInput) {
  await requireApprovedUser()
  const validated = loanSchema.parse(input)
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canCreateTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const walletsColl = await getCollection<Wallet>("wallets")
  const wallet = await walletsColl.findOne({ _id: new ObjectId(validated.walletId), ...getScopeFilter(scope) })
  if (!wallet) throw new Error("Wallet not found")

  // 1. Resolve or create Contact
  let contactId = validated.contactId
  if (!contactId) {
    const contactsColl = await getCollection<Contact>("contacts")
    const existingContact = await contactsColl.findOne({
      name: validated.personName,
      ...getScopeFilter(scope)
    })

    if (existingContact) {
      contactId = existingContact._id.toString()
    } else {
      const newContact: Omit<Contact, "_id"> = {
        userId: scope.userId,
        organizationId: scope.organizationId,
        name: validated.personName,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }
      const res = await contactsColl.insertOne(newContact as Contact)
      contactId = res.insertedId.toString()
      updateTag("contacts")
    }
  }

  // 2. Resolve default Loan / Lending Category
  const categoriesColl = await getCollection<Category>("categories")
  let category = await categoriesColl.findOne({ name: "Loan / Lending" })
  if (!category) {
    category = await categoriesColl.findOne({ name: "Other" })
  }
  const categoryId = category ? category._id.toString() : new ObjectId().toString()

  // 3. Create derived transaction for the principal
  const txOid = new ObjectId()
  const txType = validated.type === "lent" ? "expense" : "income"
  const txDescription = validated.type === "lent"
    ? `Lent to ${validated.personName}`
    : `Borrowed from ${validated.personName}`

  const principalTx: Transaction = {
    _id: txOid,
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    walletId: validated.walletId,
    categoryId,
    type: txType,
    amount: validated.amount,
    currency: validated.currency,
    description: txDescription,
    notes: validated.notes || "Loan principal transaction",
    date: validated.date,
    tags: ["loan-principal"],
    isRecurring: false,
    isLoanPrincipal: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }

  const transactionsColl = await getCollection<Transaction>("transactions")
  await transactionsColl.insertOne(principalTx)

  // Update wallet balance for the principal cash flow
  const balanceChange = txType === "income" ? validated.amount : -validated.amount
  await updateWalletBalance(scope, validated.walletId, balanceChange)

  // 4. Create Loan
  const loanOid = new ObjectId()
  let initialStatus = validated.status
  if (initialStatus === "active" && validated.dueDate && new Date(validated.dueDate) < new Date()) {
    initialStatus = "overdue"
  }

  const loan: Loan = {
    _id: loanOid,
    userId: scope.userId,
    organizationId: scope.organizationId,
    type: validated.type,
    contactId,
    personName: validated.personName,
    amount: validated.amount,
    currency: validated.currency,
    interestRate: validated.interestRate || 0,
    walletId: validated.walletId,
    transactionId: txOid.toString(),
    date: validated.date,
    dueDate: validated.dueDate || undefined,
    notes: validated.notes || undefined,
    status: initialStatus,
    remainingAmount: validated.amount,
    reminderSchedule: validated.reminderSchedule,
    sentReminders: [],
    metadata: validated.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }

  const loansColl = await getCollection<Loan>("loans")
  await loansColl.insertOne(loan)

  // Link the transaction to the loan
  await transactionsColl.updateOne(
    { _id: txOid },
    { $set: { loanId: loanOid.toString() } }
  )

  updateTag("loans")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/loans")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${validated.walletId}`)
  revalidatePath("/", "layout")

  return { success: true, id: loanOid.toString() }
}

export async function updateLoan(id: string, input: LoanInput) {
  await requireApprovedUser()
  const validated = loanSchema.parse(input)
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canEditTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const loansColl = await getCollection<Loan>("loans")
  const loanOid = new ObjectId(id)
  const existing = await loansColl.findOne({ _id: loanOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Loan not found")

  // Check if principal financial details changed
  const amountChanged = existing.amount !== validated.amount
  const walletChanged = existing.walletId !== validated.walletId
  const dateChanged = existing.date.getTime() !== validated.date.getTime()
  const currencyChanged = existing.currency !== validated.currency

  const transactionsColl = await getCollection<Transaction>("transactions")

  if (amountChanged || walletChanged || dateChanged || currencyChanged) {
    // 1. Revert the old principal transaction's wallet balance impact
    const oldTxType = existing.type === "lent" ? "expense" : "income"
    const oldBalanceRevert = oldTxType === "income" ? -existing.amount : existing.amount
    await updateWalletBalance(scope, existing.walletId, oldBalanceRevert)

    // 2. Apply the new balance impact
    const newTxType = validated.type === "lent" ? "expense" : "income"
    const newBalanceApply = newTxType === "income" ? validated.amount : -validated.amount
    await updateWalletBalance(scope, validated.walletId, newBalanceApply)

    // 3. Update the derived principal transaction
    const txOid = new ObjectId(existing.transactionId)
    const txDescription = validated.type === "lent"
      ? `Lent to ${validated.personName}`
      : `Borrowed from ${validated.personName}`

    await transactionsColl.updateOne(
      { _id: txOid },
      {
        $set: {
          walletId: validated.walletId,
          type: newTxType,
          amount: validated.amount,
          currency: validated.currency,
          description: txDescription,
          notes: validated.notes || "Loan principal transaction",
          date: validated.date,
          updatedAt: new Date(),
          updatedBy: scope.userId
        },
        $inc: { version: 1 }
      }
    )
  }

  // Update contact if changed
  let contactId = validated.contactId || existing.contactId

  // Update loan document
  await loansColl.updateOne(
    { _id: loanOid },
    {
      $set: {
        type: validated.type,
        contactId,
        personName: validated.personName,
        amount: validated.amount,
        currency: validated.currency,
        interestRate: validated.interestRate || 0,
        walletId: validated.walletId,
        date: validated.date,
        dueDate: validated.dueDate || undefined,
        notes: validated.notes || undefined,
        status: validated.status,
        reminderSchedule: validated.reminderSchedule,
        metadata: validated.metadata || {},
        updatedAt: new Date()
      },
      $inc: { version: 1 }
    }
  )

  // Recalculate remainingAmount and status
  await recalculateLoanState(loanOid)

  updateTag("loans")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/loans")
  revalidatePath(`/loans/${id}`)
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${validated.walletId}`)
  if (walletChanged) {
    revalidatePath(`/wallets/${existing.walletId}`)
  }
  revalidatePath("/", "layout")

  return { success: true }
}

export async function deleteLoan(id: string) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canDeleteTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  return deleteLoanInternal(id, scope)
}

// Internal reusable helper for deleting a loan (handles wallet balance revertion)
async function deleteLoanInternal(id: string, scope: any) {
  const loansColl = await getCollection<Loan>("loans")
  const loanOid = new ObjectId(id)
  const loan = await loansColl.findOne({ _id: loanOid, ...getScopeFilter(scope) })
  if (!loan) throw new Error("Loan not found")

  const transactionsColl = await getCollection<Transaction>("transactions")
  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")

  // 1. Fetch and delete all repayment transactions, reverting their wallet balances
  const repayments = await repaymentsColl.find({ loanId: id }).toArray()
  for (const rep of repayments) {
    const repTx = await transactionsColl.findOne({ _id: new ObjectId(rep.transactionId) })
    if (repTx) {
      // Revert repayment balance change (repayment is income for lent, expense for borrowed)
      const balanceRevert = repTx.type === "income" ? -repTx.amount : repTx.amount
      await updateWalletBalance(scope, repTx.walletId, balanceRevert)
      await transactionsColl.deleteOne({ _id: repTx._id })
    }
  }

  // Delete repayment records
  await repaymentsColl.deleteMany({ loanId: id })

  // 2. Revert and delete principal transaction
  const principalTx = await transactionsColl.findOne({ _id: new ObjectId(loan.transactionId) })
  if (principalTx) {
    const balanceRevert = principalTx.type === "income" ? -principalTx.amount : principalTx.amount
    await updateWalletBalance(scope, principalTx.walletId, balanceRevert)
    await transactionsColl.deleteOne({ _id: principalTx._id })
  }

  // 3. Delete Loan
  await loansColl.deleteOne({ _id: loanOid })

  updateTag("loans")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/loans")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${loan.walletId}`)
  revalidatePath("/", "layout")

  return { success: true }
}

export async function createRepayment(input: RepaymentInput) {
  await requireApprovedUser()
  const validated = repaymentSchema.parse(input)
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canCreateTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const loansColl = await getCollection<Loan>("loans")
  const loan = await loansColl.findOne({ _id: new ObjectId(validated.loanId), ...getScopeFilter(scope) })
  if (!loan) throw new Error("Loan not found")

  // Determine transaction type
  // If you lent money, receiving a repayment is income.
  // If you borrowed money, making a repayment is an expense.
  const txType = loan.type === "lent" ? "income" : "expense"
  const txDescription = loan.type === "lent"
    ? `Repayment from ${loan.personName}`
    : `Repayment to ${loan.personName}`

  // Resolve Category
  const categoriesColl = await getCollection<Category>("categories")
  let category = await categoriesColl.findOne({ name: "Loan / Lending" })
  if (!category) {
    category = await categoriesColl.findOne({ name: "Other" })
  }
  const categoryId = category ? category._id.toString() : new ObjectId().toString()

  // Create derived transaction record
  const txOid = new ObjectId()
  const repaymentTx: Transaction = {
    _id: txOid,
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    walletId: validated.walletId,
    categoryId,
    type: txType,
    amount: validated.amount,
    currency: loan.currency,
    description: txDescription,
    notes: validated.notes || `Repayment for loan`,
    date: validated.date,
    tags: ["loan-repayment"],
    isRecurring: false,
    loanId: loan._id.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }

  const transactionsColl = await getCollection<Transaction>("transactions")
  await transactionsColl.insertOne(repaymentTx)

  // Update wallet balance for the repayment flow
  const balanceChange = txType === "income" ? validated.amount : -validated.amount
  await updateWalletBalance(scope, validated.walletId, balanceChange)

  // Create repayment record
  const repayment: LoanRepayment = {
    _id: new ObjectId(),
    loanId: validated.loanId,
    transactionId: txOid.toString(),
    amount: validated.amount,
    date: validated.date,
    notes: validated.notes || undefined,
    createdAt: new Date()
  }

  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
  await repaymentsColl.insertOne(repayment)

  // Recalculate remaining amount and status
  await recalculateLoanState(loan._id)

  updateTag("loans")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/loans")
  revalidatePath(`/loans/${validated.loanId}`)
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${validated.walletId}`)
  revalidatePath("/", "layout")

  return { success: true, id: repayment._id.toString() }
}

export async function deleteRepayment(repaymentId: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canDeleteTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
  const repOid = new ObjectId(repaymentId)
  const repayment = await repaymentsColl.findOne({ _id: repOid })
  if (!repayment) throw new Error("Repayment not found")

  const transactionsColl = await getCollection<Transaction>("transactions")
  const repTx = await transactionsColl.findOne({ _id: new ObjectId(repayment.transactionId), ...getScopeFilter(scope) })

  if (repTx) {
    // Revert balance change
    const balanceRevert = repTx.type === "income" ? -repTx.amount : repTx.amount
    await updateWalletBalance(scope, repTx.walletId, balanceRevert)
    await transactionsColl.deleteOne({ _id: repTx._id })
  }

  // Delete repayment document
  await repaymentsColl.deleteOne({ _id: repOid })

  // Recalculate remainingAmount and status
  await recalculateLoanState(repayment.loanId)

  updateTag("loans")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/loans")
  revalidatePath(`/loans/${repayment.loanId}`)
  revalidatePath("/transactions")
  if (repTx) {
    revalidatePath(`/wallets/${repTx.walletId}`)
  }
  revalidatePath("/", "layout")

  return { success: true }
}

// Exportable internal helper for hook usage in transactions actions
export async function handleTransactionDeletedHook(txId: string, scope: any) {
  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
  const repayment = await repaymentsColl.findOne({ transactionId: txId })
  if (repayment) {
    const loanId = repayment.loanId
    await repaymentsColl.deleteOne({ transactionId: txId })
    await recalculateLoanState(loanId)
    updateTag("loans")
    return
  }

  const loansColl = await getCollection<Loan>("loans")
  const loan = await loansColl.findOne({ transactionId: txId })
  if (loan) {
    // If the principal transaction is deleted, delete the entire loan and all its repayments
    await deleteLoanInternal(loan._id.toString(), scope)
  }
}

export async function handleTransactionUpdatedHook(txId: string, updatedAmount: number, updatedWalletId: string, updatedDate: Date, scope: any) {
  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
  const repayment = await repaymentsColl.findOne({ transactionId: txId })
  if (repayment) {
    await repaymentsColl.updateOne(
      { transactionId: txId },
      { $set: { amount: updatedAmount, date: updatedDate } }
    )
    await recalculateLoanState(repayment.loanId)
    updateTag("loans")
    return
  }

  const loansColl = await getCollection<Loan>("loans")
  const loan = await loansColl.findOne({ transactionId: txId })
  if (loan) {
    await loansColl.updateOne(
      { _id: loan._id },
      {
        $set: {
          amount: updatedAmount,
          walletId: updatedWalletId,
          date: updatedDate,
          updatedAt: new Date()
        }
      }
    )
    await recalculateLoanState(loan._id)
    updateTag("loans")
  }
}

export async function updateContact(id: string, input: ContactInput) {
  await requireApprovedUser()
  const validated = contactSchema.parse(input)
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canEditTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const contactsColl = await getCollection<Contact>("contacts")
  const contactOid = new ObjectId(id)

  const existing = await contactsColl.findOne({ _id: contactOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Contact not found")

  await contactsColl.updateOne(
    { _id: contactOid, ...getScopeFilter(scope) },
    {
      $set: {
        name: validated.name,
        email: validated.email || undefined,
        phone: validated.phone || undefined,
        notes: validated.notes || undefined,
        metadata: validated.metadata || {},
        updatedAt: new Date()
      },
      $inc: { version: 1 }
    }
  )

  // Also update personName in any linked loans!
  const loansColl = await getCollection<Loan>("loans")
  await loansColl.updateMany(
    { contactId: id },
    { $set: { personName: validated.name, updatedAt: new Date() } }
  )

  updateTag("contacts")
  updateTag("loans")
  revalidatePath("/contacts")
  revalidatePath("/loans")
  return { success: true }
}

export async function deleteContact(id: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canDeleteTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  // Check if contact has active loans
  const loansColl = await getCollection<Loan>("loans")
  const activeLoansCount = await loansColl.countDocuments({
    contactId: id,
    status: { $in: ["active", "partially_repaid", "overdue"] }
  })

  if (activeLoansCount > 0) {
    return { success: false, error: "Cannot delete contact with active or unpaid loans." }
  }

  const contactsColl = await getCollection<Contact>("contacts")
  const contactOid = new ObjectId(id)

  await contactsColl.deleteOne({ _id: contactOid, ...getScopeFilter(scope) })

  updateTag("contacts")
  revalidatePath("/contacts")
  return { success: true }
}
