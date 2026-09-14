"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { goalSchema, GoalInput } from "@/lib/validations/goal.schema"
import { Goal, Wallet, Transaction, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { canManageBudgets, Role } from "@/lib/permissions"
import { createNotification } from "@/lib/actions/notifications"

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

export async function createGoal(input: GoalInput) {
  const session = await requireApprovedUser()
  const validated = goalSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const goalsColl = await getCollection<Goal>("goals")
  const newGoal: Omit<Goal, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
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
    version: 1,
  }

  const result = await goalsColl.insertOne(newGoal as Goal)

  updateTag("goals")
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateGoal(id: string, input: GoalInput) {
  const session = await requireApprovedUser()
  const validated = goalSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const goalsColl = await getCollection<Goal>("goals")
  const goalOid = new ObjectId(id)

  const existing = await goalsColl.findOne({ _id: goalOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Goal not found")

  await goalsColl.updateOne(
    { _id: goalOid, ...getScopeFilter(scope) },
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
        updatedBy: scope.userId,
      },
      $inc: { version: 1 }
    }
  )

  updateTag("goals")
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteGoal(id: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const goalsColl = await getCollection<Goal>("goals")
  const goalOid = new ObjectId(id)

  const existing = await goalsColl.findOne({ _id: goalOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Goal not found")

  await goalsColl.deleteOne({ _id: goalOid, ...getScopeFilter(scope) })

  updateTag("goals")
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function contributeToGoal(id: string, amount: number, walletId: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const goalsColl = await getCollection<Goal>("goals")
  const walletsColl = await getCollection<Wallet>("wallets")
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categoriesColl = await getCollection<Category>("categories")

  const goal = await goalsColl.findOne({ _id: new ObjectId(id), ...getScopeFilter(scope) })
  if (!goal) throw new Error("Goal not found")

  const wallet = await walletsColl.findOne({ _id: new ObjectId(walletId), ...getScopeFilter(scope) })
  if (!wallet) throw new Error("Wallet not found")

  if (wallet.balance < amount) {
    throw new Error("Insufficient balance in the selected wallet")
  }

  // Find a category for savings or defaults to "Other"
  let category = await categoriesColl.findOne({
    $or: [{ userId: null }, getScopeFilter(scope)],
    name: "Goals"
  })

  // Fallback to "Savings" if Goals not found
  if (!category) {
    category = await categoriesColl.findOne({
      $or: [{ userId: null }, getScopeFilter(scope)],
      name: "Savings"
    })
  }

  // Fallback to "Other" if Savings not found
  if (!category) {
    category = await categoriesColl.findOne({
      $or: [{ userId: null }, getScopeFilter(scope)],
      name: "Other"
    })
  }

  // Fallback to any category if none found
  if (!category) {
    category = await categoriesColl.findOne({
      $or: [{ userId: null }, getScopeFilter(scope)]
    })
  }

  const categoryId = category ? category._id.toString() : new ObjectId().toString()

  // 1. Log transaction
  const tx: Omit<Transaction, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
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
    version: 1,
  }

  const txResult = await transactionsColl.insertOne(tx as Transaction)

  // 2. Decrement wallet balance
  await updateWalletBalance(scope, walletId, -amount)

  // 3. Increment goal balance
  await goalsColl.updateOne(
    { _id: goal._id, ...getScopeFilter(scope) },
    {
      $inc: { currentAmount: amount, version: 1 },
      $set: { updatedAt: new Date(), updatedBy: scope.userId }
    }
  )

  // 4. Milestone & Goal Completion Celebration
  const newAmount = (goal.currentAmount || 0) + amount
  const oldPct = Math.floor(((goal.currentAmount || 0) / goal.targetAmount) * 100)
  const newPct = Math.floor((newAmount / goal.targetAmount) * 100)

  if (newPct >= 100 && oldPct < 100) {
    await createNotification({
      userId: scope.userId,
      title: "Goal Achieved! 🎉",
      message: `Congratulations! You've reached 100% of your savings goal for "${goal.name}".`,
      type: "goal_achieved",
      link: "/goals",
    }).catch((err) => console.error("Failed to trigger goal achievement notification:", err))
  } else if (newPct >= 75 && oldPct < 75) {
    await createNotification({
      userId: scope.userId,
      title: "Goal Milestone (75%) 🎯",
      message: `You're almost there! You've reached 75% of your savings goal for "${goal.name}".`,
      type: "goal_milestone",
      link: "/goals",
    }).catch((err) => console.error("Failed to trigger goal milestone notification:", err))
  } else if (newPct >= 50 && oldPct < 50) {
    await createNotification({
      userId: scope.userId,
      title: "Goal Milestone (50%) 🎯",
      message: `Halfway there! You've reached 50% of your savings goal for "${goal.name}".`,
      type: "goal_milestone",
      link: "/goals",
    }).catch((err) => console.error("Failed to trigger goal milestone notification:", err))
  }

  updateTag("goals")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/goals")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${walletId}`)
  revalidatePath("/dashboard")

  return { success: true, transactionId: txResult.insertedId.toString() }
}
