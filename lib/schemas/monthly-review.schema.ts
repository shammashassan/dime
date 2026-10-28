import { z } from "zod"

export const monthlyReviewQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format. Expected YYYY-MM")
    .optional(),
})

export const refreshAiReviewSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format. Expected YYYY-MM"),
})

export type MonthlyReviewQueryInput = z.infer<typeof monthlyReviewQuerySchema>
export type RefreshAiReviewInput = z.infer<typeof refreshAiReviewSchema>
