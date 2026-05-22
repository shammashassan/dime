"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { walletSchema, WalletInput } from "@/lib/validations/wallet.schema"
import { Wallet, Transaction, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"

export async function createWallet(input: WalletInput) {
  const session = await requireApprovedUser()
  const validated = walletSchema.parse(input)

  const walletsColl = await getCollection<Wallet>("wallets")

  const wallet: Omit<Wallet, "_id"> = {
    userId: session.user.id,
    name: validated.name,
    type: validated.type,
    currency: validated.currency,
    balance: validated.balance,
    color: validated.color,
    icon: validated.icon,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await walletsColl.insertOne(wallet as Wallet)

  // If the initial balance is non-zero, create a transaction record
  if (validated.balance !== 0) {
    const categoriesColl = await getCollection<Category>("categories")
    let category = await categoriesColl.findOne({
      userId: null,
      name: "Other",
    })
    if (!category) {
      category = await categoriesColl.findOne({ name: "Other" })
    }
    const categoryId = category ? category._id.toString() : new ObjectId().toString()

    const transactionsColl = await getCollection<Transaction>("transactions")
    const tx: Omit<Transaction, "_id"> = {
      userId: session.user.id,
      walletId: result.insertedId.toString(),
      categoryId,
      type: validated.balance > 0 ? "income" : "expense",
      amount: Math.abs(validated.balance),
      currency: validated.currency,
      description: "Initial Balance",
      notes: "System generated on wallet creation",
      date: new Date(),
      tags: ["system"],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await transactionsColl.insertOne(tx as Transaction)
  }

  revalidatePath("/wallets")
  revalidatePath("/")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateWallet(id: string, input: WalletInput) {
  const session = await requireApprovedUser()
  const validated = walletSchema.parse(input)

  const walletsColl = await getCollection<Wallet>("wallets")
  const walletOid = new ObjectId(id)

  const existing = await walletsColl.findOne({ _id: walletOid, userId: session.user.id })
  if (!existing) throw new Error("Wallet not found")

  // Handle balance adjustment
  if (existing.balance !== validated.balance) {
    const diff = validated.balance - existing.balance
    const categoriesColl = await getCollection<Category>("categories")
    let category = await categoriesColl.findOne({
      userId: null,
      name: "Other",
    })
    if (!category) {
      category = await categoriesColl.findOne({ name: "Other" })
    }
    const categoryId = category ? category._id.toString() : new ObjectId().toString()

    const transactionsColl = await getCollection<Transaction>("transactions")
    const tx: Omit<Transaction, "_id"> = {
      userId: session.user.id,
      walletId: id,
      categoryId,
      type: diff > 0 ? "income" : "expense",
      amount: Math.abs(diff),
      currency: validated.currency,
      description: "Balance Adjustment",
      notes: `Manual balance adjustment from ${(existing.balance / 100).toFixed(2)} to ${(validated.balance / 100).toFixed(2)}`,
      date: new Date(),
      tags: ["system", "adjustment"],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await transactionsColl.insertOne(tx as Transaction)
  }

  await walletsColl.updateOne(
    { _id: walletOid, userId: session.user.id },
    {
      $set: {
        name: validated.name,
        type: validated.type,
        currency: validated.currency,
        balance: validated.balance,
        color: validated.color,
        icon: validated.icon,
        isArchived: validated.isArchived,
        updatedAt: new Date(),
      },
    }
  )

  revalidatePath("/wallets")
  revalidatePath(`/wallets/${id}`)
  revalidatePath("/")
  return { success: true }
}

export async function toggleArchiveWallet(id: string) {
  const session = await requireApprovedUser()
  const walletsColl = await getCollection<Wallet>("wallets")
  const walletOid = new ObjectId(id)

  const existing = await walletsColl.findOne({ _id: walletOid, userId: session.user.id })
  if (!existing) throw new Error("Wallet not found")

  const nextState = !existing.isArchived

  await walletsColl.updateOne(
    { _id: walletOid, userId: session.user.id },
    {
      $set: {
        isArchived: nextState,
        updatedAt: new Date(),
      },
    }
  )

  revalidatePath("/wallets")
  revalidatePath(`/wallets/${id}`)
  revalidatePath("/")
  return { success: true, isArchived: nextState }
}

export async function deleteWallet(id: string) {
  const session = await requireApprovedUser()
  const walletsColl = await getCollection<Wallet>("wallets")
  const walletOid = new ObjectId(id)

  const existing = await walletsColl.findOne({ _id: walletOid, userId: session.user.id })
  if (!existing) throw new Error("Wallet not found")

  await walletsColl.deleteOne({ _id: walletOid, userId: session.user.id })

  // Delete associated transactions
  const transactionsColl = await getCollection<Transaction>("transactions")
  // For transfers, we also need to clean up linked transactions in other wallets
  const userTxs = await transactionsColl.find({ walletId: id, userId: session.user.id }).toArray()
  const linkedTxIds = userTxs
    .map((tx) => tx.linkedTransactionId)
    .filter((id): id is string => !!id)

  if (linkedTxIds.length > 0) {
    const oids = linkedTxIds.map((id) => new ObjectId(id))
    await transactionsColl.deleteMany({ _id: { $in: oids } })
  }

  await transactionsColl.deleteMany({ walletId: id, userId: session.user.id })

  revalidatePath("/wallets")
  revalidatePath("/")
  return { success: true }
}
