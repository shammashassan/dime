import { z } from "zod"

export const recurringRuleSchema = z
  .object({
    description: z.string().min(1, "Description is required").max(100, "Description must be 100 characters or less"),
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().min(1, "Category is required"),
    type: z.enum(["income", "expense"]),
    amount: z.number().int().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
    tags: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        return false
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )

export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>
