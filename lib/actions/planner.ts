"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getCollection } from "@/lib/db/collections"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { PlannerScenario } from "@/types"
import { ObjectId } from "mongodb"

const plannerScenarioSchema = z.object({
  name: z.string().trim().min(1, "Scenario name is required").max(60, "Name too long"),
  description: z.string().trim().max(200).optional(),
  monthlyIncomeAdjustment: z.number().int().default(0),   // in cents
  monthlyExpenseAdjustment: z.number().int().default(0),  // in cents
  extraLoanRepayment: z.number().int().nonnegative().default(0), // in cents
  extraGoalContribution: z.number().int().nonnegative().default(0), // in cents
  pausedRecurringIds: z.array(z.string()).default([]),
  investmentReturnRate: z.number().min(-50).max(100).default(7), // percentage
  savingsApy: z.number().min(0).max(50).default(4), // percentage
  horizonMonths: z.number().int().min(1).max(120).default(12),
})

export async function createPlannerScenario(input: z.infer<typeof plannerScenarioSchema>) {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const data = plannerScenarioSchema.parse(input)
  const scenariosColl = await getCollection<PlannerScenario>("planner_scenarios")

  // Check for duplicate scenario name for this user/scope
  const existing = await scenariosColl.findOne({
    ...getScopeFilter(scope),
    name: { $regex: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  })

  if (existing) {
    throw new Error(`A scenario named "${data.name}" already exists. Please choose a different name.`)
  }

  const now = new Date()
  const newScenario: PlannerScenario = {
    _id: new ObjectId(),
    userId,
    name: data.name,
    description: data.description,
    isDefault: false,
    monthlyIncomeAdjustment: data.monthlyIncomeAdjustment,
    monthlyExpenseAdjustment: data.monthlyExpenseAdjustment,
    extraLoanRepayment: data.extraLoanRepayment,
    extraGoalContribution: data.extraGoalContribution,
    pausedRecurringIds: data.pausedRecurringIds,
    investmentReturnRate: data.investmentReturnRate,
    savingsApy: data.savingsApy,
    horizonMonths: data.horizonMonths,
    createdAt: now,
    updatedAt: now,
    ...(scope.type === "organization" ? { organizationId: scope.organizationId } : {}),
  }

  await scenariosColl.insertOne(newScenario)

  revalidatePath("/planner")
  return {
    success: true,
    scenarioId: newScenario._id.toString(),
  }
}

export async function updatePlannerScenario(
  scenarioId: string,
  input: Partial<z.infer<typeof plannerScenarioSchema>>
) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const scenariosColl = await getCollection<PlannerScenario>("planner_scenarios")
  const existing = await scenariosColl.findOne({
    _id: new ObjectId(scenarioId),
    ...getScopeFilter(scope),
  })

  if (!existing) {
    throw new Error("Planner scenario not found.")
  }

  if (input.name && input.name !== existing.name) {
    const duplicate = await scenariosColl.findOne({
      ...getScopeFilter(scope),
      _id: { $ne: existing._id },
      name: { $regex: new RegExp(`^${input.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    })
    if (duplicate) {
      throw new Error(`A scenario named "${input.name}" already exists.`)
    }
  }

  const updateFields: Partial<PlannerScenario> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) updateFields.name = input.name.trim()
  if (input.description !== undefined) updateFields.description = input.description.trim()
  if (input.monthlyIncomeAdjustment !== undefined) updateFields.monthlyIncomeAdjustment = input.monthlyIncomeAdjustment
  if (input.monthlyExpenseAdjustment !== undefined) updateFields.monthlyExpenseAdjustment = input.monthlyExpenseAdjustment
  if (input.extraLoanRepayment !== undefined) updateFields.extraLoanRepayment = Math.max(0, input.extraLoanRepayment)
  if (input.extraGoalContribution !== undefined) updateFields.extraGoalContribution = Math.max(0, input.extraGoalContribution)
  if (input.pausedRecurringIds !== undefined) updateFields.pausedRecurringIds = input.pausedRecurringIds
  if (input.investmentReturnRate !== undefined) updateFields.investmentReturnRate = Math.min(100, Math.max(-50, input.investmentReturnRate))
  if (input.horizonMonths !== undefined) updateFields.horizonMonths = Math.min(120, Math.max(1, input.horizonMonths))

  await scenariosColl.updateOne(
    { _id: existing._id },
    { $set: updateFields }
  )

  revalidatePath("/planner")
  return { success: true }
}

export async function deletePlannerScenario(scenarioId: string) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const scenariosColl = await getCollection<PlannerScenario>("planner_scenarios")
  const result = await scenariosColl.deleteOne({
    _id: new ObjectId(scenarioId),
    ...getScopeFilter(scope),
  })

  if (result.deletedCount === 0) {
    throw new Error("Scenario not found or permission denied.")
  }

  revalidatePath("/planner")
  return { success: true }
}
