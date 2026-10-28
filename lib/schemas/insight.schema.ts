import { z } from "zod"

export const updateInsightStateSchema = z.object({
  insightKey: z.string().min(1, "Insight key is required"),
  status: z.enum(["active", "dismissed", "bookmarked"]),
})

export type UpdateInsightStateInput = z.infer<typeof updateInsightStateSchema>
