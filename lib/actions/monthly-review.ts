"use server"

import { revalidatePath } from "next/cache"
import { requireApprovedUser } from "@/lib/auth-guard"
import { refreshAiReviewSchema, RefreshAiReviewInput } from "@/lib/validations/monthly-review.schema"
import { getMonthlyReviewData } from "@/lib/queries/monthly-review"
import { generateAiReviewBrief } from "@/lib/calculations/monthly-review"
import type { MonthlyReviewSummaryBrief } from "@/types"

export async function refreshAiMonthlyReviewAction(rawInput: RefreshAiReviewInput): Promise<{
  success: boolean
  brief?: MonthlyReviewSummaryBrief
  error?: string
}> {
  try {
    const session = await requireApprovedUser()
    const parsed = refreshAiReviewSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid month" }
    }

    const { month } = parsed.data
    const userId = session.user.id

    // Fetch month's calculated review facts
    const reviewData = await getMonthlyReviewData(userId, month)

    // Generate AI executive brief
    const brief = await generateAiReviewBrief({
      monthLabel: reviewData.monthLabel,
      metrics: reviewData.metrics,
      categoryBreakdown: reviewData.categoryBreakdown,
      budgetPerformance: reviewData.budgetPerformance,
      topExpenses: reviewData.topExpenses,
      currency: reviewData.targetCurrency,
    })

    revalidatePath("/reports")
    return { success: true, brief }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate AI review",
    }
  }
}
