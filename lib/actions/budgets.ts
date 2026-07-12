"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { budgetSchema, BudgetInput } from "@/lib/validations/budget.schema"
import { Budget } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { canManageBudgets, Role } from "@/lib/permissions"

export async function createBudget(input: BudgetInput) {
  const session = await requireApprovedUser()
  const validated = budgetSchema.parse(input)

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

  const budgetsColl = await getCollection<Budget>("budgets")

  const budget: Omit<Budget, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
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
    version: 1,
  }

  const result = await budgetsColl.insertOne(budget as Budget)

  updateTag("budgets")
  revalidatePath("/budgets")
  revalidatePath("/", "layout")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateBudget(id: string, input: BudgetInput) {
  const session = await requireApprovedUser()
  const validated = budgetSchema.parse(input)

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

  const budgetsColl = await getCollection<Budget>("budgets")
  const budgetOid = new ObjectId(id)

  const existing = await budgetsColl.findOne({ _id: budgetOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Budget not found")

  await budgetsColl.updateOne(
    { _id: budgetOid, ...getScopeFilter(scope) },
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
        updatedBy: scope.userId,
      },
      $inc: { version: 1 }
    }
  )

  updateTag("budgets")
  revalidatePath("/budgets")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteBudget(id: string) {
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

  const budgetsColl = await getCollection<Budget>("budgets")
  const budgetOid = new ObjectId(id)

  const existing = await budgetsColl.findOne({ _id: budgetOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Budget not found")

  await budgetsColl.deleteOne({ _id: budgetOid, ...getScopeFilter(scope) })

  updateTag("budgets")
  revalidatePath("/budgets")
  revalidatePath("/", "layout")
  return { success: true }
}
