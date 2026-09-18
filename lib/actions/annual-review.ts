"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getQuarterlyReviewData, getAnnualReviewData } from "@/lib/queries/annual-review"
import { generateAiPeriodBrief } from "@/lib/calculations/annual-review"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { MonthlyReviewSummaryBrief } from "@/types"

const refreshQuarterlySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
})

const refreshAnnualSchema = z.object({
  year: z.number().int().min(2000).max(2100),
})

export async function refreshAiQuarterlyReviewAction(
  rawInput: z.infer<typeof refreshQuarterlySchema>
): Promise<{ success: boolean; brief?: MonthlyReviewSummaryBrief; error?: string }> {
  try {
    const session = await requireApprovedUser()
    const { year, quarter } = refreshQuarterlySchema.parse(rawInput)

    const data = await getQuarterlyReviewData(session.user.id, year, quarter)
    const brief = await generateAiPeriodBrief({
      metrics: data.metrics,
      topCategories: data.topCategories,
      periodLabel: data.quarterLabel,
      previousMetrics: data.previousQuarterMetrics,
      targetCurrency: data.targetCurrency,
    })

    revalidatePath("/reports")
    return { success: true, brief }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate AI quarterly review" }
  }
}

export async function refreshAiAnnualReviewAction(
  rawInput: z.infer<typeof refreshAnnualSchema>
): Promise<{ success: boolean; brief?: MonthlyReviewSummaryBrief; error?: string }> {
  try {
    const session = await requireApprovedUser()
    const { year } = refreshAnnualSchema.parse(rawInput)

    const data = await getAnnualReviewData(session.user.id, year)
    const brief = await generateAiPeriodBrief({
      metrics: data.metrics,
      topCategories: data.topCategories,
      periodLabel: data.yearLabel,
      previousMetrics: data.previousYearMetrics,
      targetCurrency: data.targetCurrency,
    })

    revalidatePath("/reports")
    return { success: true, brief }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate AI annual review" }
  }
}
