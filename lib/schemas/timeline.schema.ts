import { z } from "zod"

export const timelineCategoryEnum = z.enum([
  "all",
  "milestones",
  "transactions",
  "bills_subscriptions",
  "investments",
  "loans",
  "shared",
])

export const timelineFilterSchema = z.object({
  category: timelineCategoryEnum.default("all"),
  search: z.string().trim().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format").optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
})

export type TimelineFilterInput = z.infer<typeof timelineFilterSchema>
