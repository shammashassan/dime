"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { budgetSchema, BudgetInput } from "@/lib/validations/budget.schema"
import { Budget } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"

export async function createBudget(input: BudgetInput) {
  const session = await requireApprovedUser()
  const validated = budgetSchema.parse(input)

  const budgetsColl = await getCollection<Budget>("budgets")

  const budget: Omit<Budget, "_id"> = {
    userId: session.user.id,
    name: validated.name,
    categoryId: validated.categoryId,
    walletId: validated.walletId || undefined,
    amount: validated.amount,
    currency: validated.currency,
    period: validated.period,
    startDate: validated.startDate,
    endDate: validated.endDate || undefined,
    alertThreshold: validated.alertThreshold,
    isActive: validated.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await budgetsColl.insertOne(budget as Budget)

  revalidatePath("/budgets")
  revalidatePath("/")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateBudget(id: string, input: BudgetInput) {
  const session = await requireApprovedUser()
  const validated = budgetSchema.parse(input)

  const budgetsColl = await getCollection<Budget>("budgets")
  const budgetOid = new ObjectId(id)

  const existing = await budgetsColl.findOne({ _id: budgetOid, userId: session.user.id })
  if (!existing) throw new Error("Budget not found")

  await budgetsColl.updateOne(
    { _id: budgetOid, userId: session.user.id },
    {
      $set: {
        name: validated.name,
        categoryId: validated.categoryId,
        walletId: validated.walletId || undefined,
        amount: validated.amount,
        currency: validated.currency,
        period: validated.period,
        startDate: validated.startDate,
        endDate: validated.endDate || undefined,
        alertThreshold: validated.alertThreshold,
        isActive: validated.isActive,
        updatedAt: new Date(),
      },
    }
  )

  revalidatePath("/budgets")
  revalidatePath("/")
  return { success: true }
}

export async function deleteBudget(id: string) {
  const session = await requireApprovedUser()
  const budgetsColl = await getCollection<Budget>("budgets")
  const budgetOid = new ObjectId(id)

  const existing = await budgetsColl.findOne({ _id: budgetOid, userId: session.user.id })
  if (!existing) throw new Error("Budget not found")

  await budgetsColl.deleteOne({ _id: budgetOid, userId: session.user.id })

  revalidatePath("/budgets")
  revalidatePath("/")
  return { success: true }
}
