"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { recurringRuleSchema, RecurringRuleInput } from "@/lib/validations/recurring.schema"
import { RecurringRule, Transaction, Wallet } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { createTransaction } from "./transactions"
import { calculateNextDueDate } from "@/lib/utils"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { canManageBudgets, Role } from "@/lib/permissions"

export async function createRecurringRule(input: RecurringRuleInput) {
  const session = await requireApprovedUser()
  const validated = recurringRuleSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      throw new Error("Unauthorized")
    }
  }

  const recurringColl = await getCollection<RecurringRule>("recurring_rules")

  const rule: Omit<RecurringRule, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    walletId: validated.walletId,
    categoryId: validated.categoryId,
    type: validated.type,
    amount: validated.amount,
    currency: validated.currency,
    description: validated.description,
    frequency: validated.frequency,
    startDate: validated.startDate,
    endDate: validated.endDate || undefined,
    nextDueDate: validated.startDate, // Initial run is on start date
    isActive: validated.isActive ?? true,
    tags: validated.tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }

  const result = await recurringColl.insertOne(rule as RecurringRule)

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath("/", "layout")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateRecurringRule(id: string, input: RecurringRuleInput) {
  const session = await requireApprovedUser()
  const validated = recurringRuleSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      throw new Error("Unauthorized")
    }
  }

  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const ruleOid = new ObjectId(id)

  const existing = await recurringColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Recurring rule not found")

  // If start date or frequency changed, we might need to recalculate nextDueDate.
  // Otherwise, we keep nextDueDate unchanged or reset it to validated.startDate.
  // Let's reset nextDueDate if startDate changed, otherwise keep it.
  const nextDueDate =
    existing.startDate.getTime() !== validated.startDate.getTime() ||
    existing.frequency !== validated.frequency
      ? validated.startDate
      : existing.nextDueDate

  await recurringColl.updateOne(
    { _id: ruleOid, ...getScopeFilter(scope) },
    {
      $set: {
        walletId: validated.walletId,
        categoryId: validated.categoryId,
        type: validated.type,
        amount: validated.amount,
        currency: validated.currency,
        description: validated.description,
        frequency: validated.frequency,
        startDate: validated.startDate,
        endDate: validated.endDate || undefined,
        nextDueDate,
        isActive: validated.isActive,
        tags: validated.tags,
        updatedAt: new Date(),
        updatedBy: scope.userId,
      },
      $inc: { version: 1 }
    }
  )

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteRecurringRule(id: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      throw new Error("Unauthorized")
    }
  }

  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const ruleOid = new ObjectId(id)

  const existing = await recurringColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Recurring rule not found")

  await recurringColl.deleteOne({ _id: ruleOid, ...getScopeFilter(scope) })

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function processRecurringRuleNow(id: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      throw new Error("Unauthorized")
    }
  }

  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const ruleOid = new ObjectId(id)

  const rule = await recurringColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!rule) throw new Error("Recurring rule not found")
  if (!rule.isActive) throw new Error("Rule is inactive")

  let nextDueDate = new Date(rule.nextDueDate)
  const now = new Date()
  let processedCount = 0

  // Run loops to process any due occurrences
  while (nextDueDate <= now) {
    // Break if we exceed the endDate
    if (rule.endDate && nextDueDate > new Date(rule.endDate)) {
      break
    }

    // Call createTransaction
    await createTransaction({
      walletId: rule.walletId,
      categoryId: rule.categoryId,
      type: rule.type as "income" | "expense",
      amount: rule.amount,
      currency: rule.currency,
      description: rule.description,
      date: new Date(nextDueDate),
      tags: [...rule.tags, "recurring"],
      isRecurring: true,
      recurringId: rule._id.toString(),
    })

    // Advance nextDueDate
    nextDueDate = calculateNextDueDate(nextDueDate, rule.frequency)
    processedCount++

    // If frequency is biweekly/monthly etc., prevent infinite loops if misconfigured
    if (processedCount > 50) {
      console.warn("Safety limit of 50 recurring transactions processed at once hit for rule:", id)
      break
    }
  }

  if (processedCount > 0) {
    await recurringColl.updateOne(
      { _id: ruleOid, ...getScopeFilter(scope) },
      {
        $set: {
          nextDueDate,
          lastProcessedDate: new Date(),
          updatedAt: new Date(),
          updatedBy: scope.userId,
        },
        $inc: { version: 1 }
      }
    )
  }

  updateTag("recurring")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/recurring")
  revalidatePath("/transactions")
  revalidatePath("/", "layout")
  return { success: true, processedCount }
}

export async function toggleRecurringRuleActive(id: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      throw new Error("Unauthorized")
    }
  }

  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const ruleOid = new ObjectId(id)

  const existing = await recurringColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Recurring rule not found")

  const nextState = !existing.isActive

  await recurringColl.updateOne(
    { _id: ruleOid, ...getScopeFilter(scope) },
    {
      $set: {
        isActive: nextState,
        updatedAt: new Date(),
        updatedBy: scope.userId,
      },
      $inc: { version: 1 }
    }
  )

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath("/", "layout")
  return { success: true, isActive: nextState }
}

