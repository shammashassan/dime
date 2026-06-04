"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { goalSchema, GoalInput } from "@/lib/validations/goal.schema"
import { Goal, Wallet, Transaction, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"

async function updateWalletBalance(userId: string, walletId: string, amountChange: number) {
  const walletsColl = await getCollection<Wallet>("wallets")
  await walletsColl.updateOne(
    { _id: new ObjectId(walletId), userId },
    { $inc: { balance: amountChange }, $set: { updatedAt: new Date() } }
  )
}

export async function createGoal(input: GoalInput) {
  const session = await requireApprovedUser()
  const validated = goalSchema.parse(input)

  const goalsColl = await getCollection<Goal>("goals")
  const newGoal: Omit<Goal, "_id"> = {
    userId: session.user.id,
    name: validated.name,
    targetAmount: validated.targetAmount,
    currentAmount: validated.currentAmount,
    currency: validated.currency,
    targetDate: validated.targetDate,
    walletId: validated.walletId || undefined,
    color: validated.color,
    icon: validated.icon,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await goalsColl.insertOne(newGoal as Goal)
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateGoal(id: string, input: GoalInput) {
  const session = await requireApprovedUser()
  const validated = goalSchema.parse(input)

  const goalsColl = await getCollection<Goal>("goals")
  await goalsColl.updateOne(
    { _id: new ObjectId(id), userId: session.user.id },
    {
      $set: {
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        currency: validated.currency,
        targetDate: validated.targetDate,
        walletId: validated.walletId || undefined,
        color: validated.color,
        icon: validated.icon,
        updatedAt: new Date(),
      },
    }
  )

  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteGoal(id: string) {
  const session = await requireApprovedUser()
  const goalsColl = await getCollection<Goal>("goals")

  await goalsColl.deleteOne({ _id: new ObjectId(id), userId: session.user.id })

  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function contributeToGoal(id: string, amount: number, walletId: string) {
  const session = await requireApprovedUser()
  const goalsColl = await getCollection<Goal>("goals")
  const walletsColl = await getCollection<Wallet>("wallets")
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categoriesColl = await getCollection<Category>("categories")

  const goal = await goalsColl.findOne({ _id: new ObjectId(id), userId: session.user.id })
  if (!goal) throw new Error("Goal not found")

  const wallet = await walletsColl.findOne({ _id: new ObjectId(walletId), userId: session.user.id })
  if (!wallet) throw new Error("Wallet not found")

  if (wallet.balance < amount) {
    throw new Error("Insufficient balance in the selected wallet")
  }

  // Find a category for savings or defaults to "Other"
  let category = await categoriesColl.findOne({
    userId: null,
    name: "Goals"
  })

  // Fallback to "Savings" if Goals not found
  if (!category) {
    category = await categoriesColl.findOne({
      userId: null,
      name: "Savings"
    })
  }

  // Fallback to "Other" if Savings not found
  if (!category) {
    category = await categoriesColl.findOne({
      userId: null,
      name: "Other"
    })
  }

  // Fallback to any category if none found
  if (!category) {
    category = await categoriesColl.findOne({
      $or: [{ userId: null }, { userId: session.user.id }]
    })
  }

  const categoryId = category ? category._id.toString() : new ObjectId().toString()

  // 1. Log transaction
  const tx: Omit<Transaction, "_id"> = {
    userId: session.user.id,
    walletId: walletId,
    categoryId: categoryId,
    type: "expense",
    amount: amount,
    currency: wallet.currency,
    description: `Goal savings: ${goal.name}`,
    notes: `Contributed to goal "${goal.name}"`,
    date: new Date(),
    tags: ["savings", "goal"],
    isRecurring: false,
    goalId: id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const txResult = await transactionsColl.insertOne(tx as Transaction)

  // 2. Decrement wallet balance
  await updateWalletBalance(session.user.id, walletId, -amount)

  // 3. Increment goal balance
  await goalsColl.updateOne(
    { _id: goal._id },
    {
      $inc: { currentAmount: amount },
      $set: { updatedAt: new Date() }
    }
  )

  revalidatePath("/goals")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${walletId}`)
  revalidatePath("/dashboard")

  return { success: true, transactionId: txResult.insertedId.toString() }
}
