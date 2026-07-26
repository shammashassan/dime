"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { recurringRuleSchema, RecurringRuleInput } from "@/lib/validations/recurring.schema"
import { RecurringRule, Transaction, BillInstance } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { createTransaction } from "./transactions"
import { calculateNextDueDate } from "@/lib/utils"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { canManageBudgets, Role } from "@/lib/permissions"

export async function createRecurringRule(input: RecurringRuleInput) {
  await requireApprovedUser()
  const validated = recurringRuleSchema.parse(input)

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
    
    // Subscription fields
    kind: validated.kind || "recurring",
    providerName: validated.providerName ?? undefined,
    providerUrl: validated.providerUrl ?? undefined,
    cancellationUrl: validated.cancellationUrl ?? undefined,
    trialEndDate: validated.trialEndDate ?? undefined,
    reminderDaysBefore: validated.reminderDaysBefore ?? undefined,
    nextRenewalDate: validated.nextRenewalDate ?? undefined,
    lastRenewalDate: validated.lastRenewalDate ?? undefined,
    renewalPrice: validated.renewalPrice ?? undefined,
    cancelledAt: validated.cancelledAt ?? undefined,
    cancelReason: validated.cancelReason ?? undefined,
    status: validated.status ?? undefined,
  }

  const result = await recurringColl.insertOne(rule as RecurringRule)

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath("/", "layout")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateRecurringRule(id: string, input: RecurringRuleInput) {
  await requireApprovedUser()
  const validated = recurringRuleSchema.parse(input)

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
        
        // Subscription fields
        kind: validated.kind || existing.kind || "recurring",
        providerName: validated.providerName ?? undefined,
        providerUrl: validated.providerUrl ?? undefined,
        cancellationUrl: validated.cancellationUrl ?? undefined,
        trialEndDate: validated.trialEndDate ?? undefined,
        reminderDaysBefore: validated.reminderDaysBefore ?? undefined,
        nextRenewalDate: validated.nextRenewalDate ?? undefined,
        lastRenewalDate: validated.lastRenewalDate ?? undefined,
        renewalPrice: validated.renewalPrice ?? undefined,
        cancelledAt: validated.cancelledAt ?? undefined,
        cancelReason: validated.cancelReason ?? undefined,
        status: validated.status ?? undefined,
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
  await requireApprovedUser()

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
  await requireApprovedUser()

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

  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const ruleOid = new ObjectId(id)

  const rule = await recurringColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!rule) throw new Error("Recurring rule not found")
  if (!rule.isActive) throw new Error("Rule is inactive")

  const billInstancesColl = await getCollection<Omit<BillInstance, "_id">>("bill_instances")
  const transactionsColl = await getCollection<Transaction>("transactions")

  let currentCheckDate = new Date(rule.startDate)
  let generated = false
  let safetyCounter = 0

  while (!generated && safetyCounter < 1000) {
    safetyCounter++
    // Break if we exceed the endDate
    if (rule.endDate && currentCheckDate > new Date(rule.endDate)) {
      break
    }

    if (rule.kind === "bill") {
      const existingBill = await billInstancesColl.findOne({
        ruleId: ruleOid.toString(),
        dueDate: new Date(currentCheckDate),
      })
      if (!existingBill) {
        const billInstance = {
          userId: rule.userId,
          organizationId: rule.organizationId || null,
          ruleId: ruleOid.toString(),
          description: rule.description,
          expectedAmount: rule.amount,
          currency: rule.currency,
          dueDate: new Date(currentCheckDate),
          status: "pending" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        }
        await billInstancesColl.insertOne(billInstance)
        generated = true
      }
    } else {
      const existingTx = await transactionsColl.findOne({
        recurringId: rule._id.toString(),
        date: new Date(currentCheckDate),
      })
      if (!existingTx) {
        await createTransaction({
          walletId: rule.walletId,
          categoryId: rule.categoryId,
          type: rule.type as "income" | "expense",
          amount: rule.amount,
          currency: rule.currency,
          description: rule.description,
          date: new Date(currentCheckDate),
          tags: [...rule.tags, "recurring"],
          isRecurring: true,
          recurringId: rule._id.toString(),
        })
        generated = true
      }
    }

    if (generated) {
      // If the generated date is >= current nextDueDate, we must advance nextDueDate
      let nextDueDate = new Date(rule.nextDueDate)
      if (currentCheckDate >= nextDueDate) {
        nextDueDate = calculateNextDueDate(currentCheckDate, rule.frequency)
      }

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
      break
    }

    currentCheckDate = calculateNextDueDate(currentCheckDate, rule.frequency)
  }

  updateTag("recurring")
  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/recurring")
  revalidatePath("/transactions")
  revalidatePath("/", "layout")
  return { success: true, processedCount: generated ? 1 : 0 }
}

export async function toggleRecurringRuleActive(id: string) {
  await requireApprovedUser()

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

