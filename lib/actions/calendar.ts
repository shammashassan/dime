"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { calendarEventsCollection } from "@/lib/db/collections"
import {
  createCalendarPlanSchema,
  updateCalendarPlanSchema,
  CreateCalendarPlanInput,
  UpdateCalendarPlanInput,
} from "@/lib/validations/calendar.schema"
import { CalendarPlanEvent } from "@/types"

export async function createCalendarPlanAction(input: CreateCalendarPlanInput) {
  const session = await requireApprovedUser()
  const validated = createCalendarPlanSchema.parse(input)
  const scope = await getFinancialScope()

  const [year, month, day] = validated.date.split("-").map(Number)
  const scheduledDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  const newDoc: CalendarPlanEvent = {
    _id: new ObjectId(),
    userId: session.user.id,
    organizationId: scope.isOrganization ? scope.organizationId : null,
    ownerUserId: session.user.id,
    title: validated.title,
    amount: validated.amount,
    currency: validated.currency.toUpperCase(),
    date: scheduledDate,
    flow: validated.flow,
    walletId: validated.walletId || undefined,
    categoryId: validated.categoryId || undefined,
    notes: validated.notes || undefined,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await calendarEventsCollection.insertOne(newDoc)
  revalidatePath("/calendar")

  return { success: true, id: newDoc._id.toString() }
}

export async function updateCalendarPlanAction(input: UpdateCalendarPlanInput) {
  const session = await requireApprovedUser()
  const validated = updateCalendarPlanSchema.parse(input)
  const scope = await getFinancialScope()

  const updateFields: Partial<CalendarPlanEvent> = {
    updatedAt: new Date(),
  }

  if (validated.title !== undefined) updateFields.title = validated.title
  if (validated.amount !== undefined) updateFields.amount = validated.amount
  if (validated.currency !== undefined) updateFields.currency = validated.currency.toUpperCase()
  if (validated.flow !== undefined) updateFields.flow = validated.flow
  if (validated.walletId !== undefined) updateFields.walletId = validated.walletId || undefined
  if (validated.categoryId !== undefined) updateFields.categoryId = validated.categoryId || undefined
  if (validated.notes !== undefined) updateFields.notes = validated.notes || undefined
  if (validated.isCompleted !== undefined) updateFields.isCompleted = validated.isCompleted

  if (validated.date) {
    const [year, month, day] = validated.date.split("-").map(Number)
    updateFields.date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  }

  const result = await calendarEventsCollection.updateOne(
    {
      _id: new ObjectId(validated.id),
      ...getScopeFilter(scope),
    },
    { $set: updateFields }
  )

  if (result.matchedCount === 0) {
    throw new Error("Planned event not found or unauthorized")
  }

  revalidatePath("/calendar")
  return { success: true }
}

export async function deleteCalendarPlanAction(planId: string) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const result = await calendarEventsCollection.deleteOne({
    _id: new ObjectId(planId),
    ...getScopeFilter(scope),
  })

  if (result.deletedCount === 0) {
    throw new Error("Planned event not found or unauthorized")
  }

  revalidatePath("/calendar")
  return { success: true }
}

export async function toggleCalendarPlanCompletedAction(planId: string, isCompleted: boolean) {
  return updateCalendarPlanAction({ id: planId, isCompleted })
}
