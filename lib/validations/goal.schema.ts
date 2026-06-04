import { z } from "zod"

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().int().positive("Target amount must be greater than 0"),
  currentAmount: z.number().int().nonnegative("Current amount cannot be negative").default(0),
  currency: z.string().length(3, "Currency code must be exactly 3 characters"),
  targetDate: z.coerce.date(),
  walletId: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").default("#8b5cf6"),
  icon: z.string().min(1).default("Target"),
})

export type GoalInput = z.infer<typeof goalSchema>
