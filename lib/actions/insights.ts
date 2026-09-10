"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { userInsightStatesCollection } from "@/lib/db/collections"
import { updateInsightStateSchema } from "@/lib/validations/insight.schema"
import { getFinancialScope } from "@/lib/scope"
import { revalidatePath } from "next/cache"

export async function dismissInsightAction(insightKey: string) {
  try {
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
  } catch (err) {
    console.error("Failed to dismiss insight:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to dismiss insight" }
  }
}

export async function undoDismissInsightAction(insightKey: string) {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id

    const validated = updateInsightStateSchema.parse({ insightKey, status: "active" })

    await userInsightStatesCollection.updateOne(
      { userId, insightKey: validated.insightKey },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
        },
        $unset: {
          dismissedAt: "",
        },
      },
      { upsert: true }
    )

    revalidatePath("/insights")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("Failed to undo dismiss insight:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to undo dismiss insight" }
  }
}

export async function toggleBookmarkInsightAction(insightKey: string, currentlyBookmarked: boolean) {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id
    const scope = await getFinancialScope()

    const nextStatus = currentlyBookmarked ? "active" : "bookmarked"
    const validated = updateInsightStateSchema.parse({ insightKey, status: nextStatus })

    const updateDoc: Record<string, unknown> = {
      userId,
      organizationId: scope.organizationId || null,
      insightKey: validated.insightKey,
      status: validated.status,
      updatedAt: new Date(),
    }
    if (nextStatus === "bookmarked") {
      updateDoc.bookmarkedAt = new Date()
    }

    await userInsightStatesCollection.updateOne(
      { userId, insightKey: validated.insightKey },
      nextStatus === "bookmarked"
        ? { $set: updateDoc }
        : { $set: updateDoc, $unset: { bookmarkedAt: "" } },
      { upsert: true }
    )

    revalidatePath("/insights")
    return { success: true, isBookmarked: !currentlyBookmarked }
  } catch (err) {
    console.error("Failed to toggle bookmark insight:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to toggle bookmark" }
  }
}

export async function restoreAllDismissedInsightsAction() {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id

    await userInsightStatesCollection.deleteMany({
      userId,
      status: "dismissed",
    })

    revalidatePath("/insights")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("Failed to restore all dismissed insights:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to restore insights" }
  }
}
