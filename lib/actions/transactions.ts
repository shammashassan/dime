"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { transactionSchema, TransactionInput } from "@/lib/validations/transaction.schema"
import { Wallet, Transaction, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { convertCurrency } from "@/lib/currency"

// Helper to update a wallet's balance
async function updateWalletBalance(userId: string, walletId: string, amountChange: number) {
  const walletsColl = await getCollection<Wallet>("wallets")
  await walletsColl.updateOne(
    { _id: new ObjectId(walletId), userId },
    { $inc: { balance: amountChange }, $set: { updatedAt: new Date() } }
  )
}

export async function createTransaction(input: TransactionInput) {
  const session = await requireApprovedUser()
  const validated = transactionSchema.parse(input)

  const walletsColl = await getCollection<Wallet>("wallets")
  const transactionsColl = await getCollection<Transaction>("transactions")

  // Verify wallet exists
  const wallet = await walletsColl.findOne({ _id: new ObjectId(validated.walletId), userId: session.user.id })
  if (!wallet) throw new Error("Source wallet not found")

  if (validated.type !== "transfer") {
    // Normal Transaction
    const tx: Omit<Transaction, "_id"> = {
      userId: session.user.id,
      walletId: validated.walletId,
      categoryId: validated.categoryId,
      type: validated.type,
      amount: validated.amount,
      currency: validated.currency,
      description: validated.description,
      notes: validated.notes || undefined,
      date: validated.date,
      tags: validated.tags || [],
      isRecurring: validated.isRecurring || false,
      recurringId: validated.recurringId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await transactionsColl.insertOne(tx as Transaction)

    // Update balance
    const balanceChange = validated.type === "income" ? validated.amount : -validated.amount
    await updateWalletBalance(session.user.id, validated.walletId, balanceChange)

    revalidatePath("/transactions")
    revalidatePath(`/wallets/${validated.walletId}`)
    revalidatePath("/")
    return { success: true, id: result.insertedId.toString() }
  } else {
    // Transfer Transaction
    // Needs targetWalletId
    if (!validated.targetWalletId) throw new Error("Target wallet is required for transfers")

    const targetWallet = await walletsColl.findOne({ _id: new ObjectId(validated.targetWalletId), userId: session.user.id })
    if (!targetWallet) throw new Error("Target wallet not found")

    // Convert amount to target wallet currency if different
    const targetAmount = await convertCurrency(validated.amount, wallet.currency, targetWallet.currency)

    const debitOid = new ObjectId()
    const creditOid = new ObjectId()

    // 1. Debit Transaction (from Source Wallet)
    const debitTx: Transaction = {
      _id: debitOid,
      userId: session.user.id,
      walletId: validated.walletId,
      categoryId: validated.categoryId,
      type: "transfer",
      transferType: "debit",
      amount: validated.amount,
      currency: wallet.currency,
      description: validated.description || `Transfer to ${targetWallet.name}`,
      notes: validated.notes || undefined,
      date: validated.date,
      tags: validated.tags || [],
      isRecurring: validated.isRecurring || false,
      recurringId: validated.recurringId || undefined,
      linkedTransactionId: creditOid.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 2. Credit Transaction (to Target Wallet)
    const creditTx: Transaction = {
      _id: creditOid,
      userId: session.user.id,
      walletId: validated.targetWalletId,
      categoryId: validated.categoryId,
      type: "transfer",
      transferType: "credit",
      amount: targetAmount,
      currency: targetWallet.currency,
      description: validated.description || `Transfer from ${wallet.name}`,
      notes: validated.notes || undefined,
      date: validated.date,
      tags: validated.tags || [],
      isRecurring: validated.isRecurring || false,
      recurringId: validated.recurringId || undefined,
      linkedTransactionId: debitOid.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await transactionsColl.insertMany([debitTx, creditTx])

    // Update balances
    await updateWalletBalance(session.user.id, validated.walletId, -validated.amount)
    await updateWalletBalance(session.user.id, validated.targetWalletId, targetAmount)

    revalidatePath("/transactions")
    revalidatePath(`/wallets/${validated.walletId}`)
    revalidatePath(`/wallets/${validated.targetWalletId}`)
    revalidatePath("/")
    return { success: true, id: debitOid.toString() }
  }
}

export async function deleteTransaction(id: string) {
  const session = await requireApprovedUser()
  const transactionsColl = await getCollection<Transaction>("transactions")

  const tx = await transactionsColl.findOne({ _id: new ObjectId(id), userId: session.user.id })
  if (!tx) throw new Error("Transaction not found")

  // Revert balance change
  if (tx.type !== "transfer") {
    const balanceRevert = tx.type === "income" ? -tx.amount : tx.amount
    await updateWalletBalance(session.user.id, tx.walletId, balanceRevert)
    await transactionsColl.deleteOne({ _id: tx._id })
  } else {
    // Revert debit wallet
    if (tx.transferType === "debit") {
      await updateWalletBalance(session.user.id, tx.walletId, tx.amount)
      
      // Delete linked credit transaction and revert target balance
      if (tx.linkedTransactionId) {
        const linkedOid = new ObjectId(tx.linkedTransactionId)
        const linkedTx = await transactionsColl.findOne({ _id: linkedOid, userId: session.user.id })
        if (linkedTx) {
          await updateWalletBalance(session.user.id, linkedTx.walletId, -linkedTx.amount)
          await transactionsColl.deleteOne({ _id: linkedOid })
        }
      }
      await transactionsColl.deleteOne({ _id: tx._id })
    } else {
      // Revert credit wallet
      await updateWalletBalance(session.user.id, tx.walletId, -tx.amount)

      // Delete linked debit transaction and revert source balance
      if (tx.linkedTransactionId) {
        const linkedOid = new ObjectId(tx.linkedTransactionId)
        const linkedTx = await transactionsColl.findOne({ _id: linkedOid, userId: session.user.id })
        if (linkedTx) {
          await updateWalletBalance(session.user.id, linkedTx.walletId, linkedTx.amount)
          await transactionsColl.deleteOne({ _id: linkedOid })
        }
      }
      await transactionsColl.deleteOne({ _id: tx._id })
    }
  }

  revalidatePath("/transactions")
  revalidatePath(`/wallets/${tx.walletId}`)
  if (tx.type === "transfer" && tx.linkedTransactionId) {
    // Revalidate target wallet path too if we have it
    // (the actual wallet ID of the linked tx is in the database, we fetched or will fetch it)
  }
  revalidatePath("/")
  return { success: true }
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const session = await requireApprovedUser()
  const validated = transactionSchema.parse(input)

  // To update a transaction cleanly:
  // 1. Delete the old one (which reverts its balance impact)
  // 2. Insert the new one (which applies the new balance impact)
  // This avoids massive complex state reconciliation blocks!
  
  // First, verify existence and retrieve details
  const transactionsColl = await getCollection<Transaction>("transactions")
  const tx = await transactionsColl.findOne({ _id: new ObjectId(id), userId: session.user.id })
  if (!tx) throw new Error("Transaction not found")

  // Delete old transaction (handles reverting balances for normal and transfers)
  await deleteTransaction(id)

  // Create new transaction using our robust createTransaction action
  const result = await createTransaction(validated)

  return result
}

export async function getTransactionWalletId(id: string): Promise<string | null> {
  const session = await requireApprovedUser()
  const transactionsColl = await getCollection<Transaction>("transactions")
  const tx = await transactionsColl.findOne({ _id: new ObjectId(id), userId: session.user.id })
  return tx ? tx.walletId : null
}
