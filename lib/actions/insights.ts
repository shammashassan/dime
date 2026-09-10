"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { userInsightStatesCollection } from "@/lib/db/collections"
import { updateInsightStateSchema } from "@/lib/validations/insight.schema"
import { getFinancialScope } from "@/lib/scope"
import { revalidatePath } from "next/cache"

export async function dismissInsightAction(insightKey: string) {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const validated = updateInsightStateSchema.parse({ insightKey, status: "dismissed" })

  await userInsightStatesCollection.updateOne(
    { userId, insightKey: validated.insightKey },
    {
      $set: {
        userId,
        organizationId: scope.organizationId || null,
        insightKey: validated.insightKey,
        status: "dismissed",
        dismissedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  revalidatePath("/insights")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function toggleBookmarkInsightAction(insightKey: string, currentlyBookmarked: boolean) {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const nextStatus = currentlyBookmarked ? "active" : "bookmarked"
  const validated = updateInsightStateSchema.parse({ insightKey, status: nextStatus })

  await userInsightStatesCollection.updateOne(
    { userId, insightKey: validated.insightKey },
    {
      $set: {
        userId,
        organizationId: scope.organizationId || null,
        insightKey: validated.insightKey,
        status: validated.status,
        ...(nextStatus === "bookmarked" ? { bookmarkedAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  revalidatePath("/insights")
  return { success: true, isBookmarked: !currentlyBookmarked }
}

export async function restoreAllDismissedInsightsAction() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  await userInsightStatesCollection.deleteMany({
    userId,
    status: "dismissed",
  })

  revalidatePath("/insights")
  revalidatePath("/dashboard")
  return { success: true }
}
