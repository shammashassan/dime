import { z } from "zod"

export const createCalendarPlanSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  amount: z.number().int().positive("Amount must be greater than zero"),
  currency: z.string().length(3).default("USD"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  flow: z.enum(["inflow", "outflow"]),
  walletId: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const updateCalendarPlanSchema = createCalendarPlanSchema.partial().extend({
  id: z.string().min(1, "Plan ID is required"),
  isCompleted: z.boolean().optional(),
})

export type CreateCalendarPlanInput = z.infer<typeof createCalendarPlanSchema>
export type UpdateCalendarPlanInput = z.infer<typeof updateCalendarPlanSchema>
