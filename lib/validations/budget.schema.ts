import { z } from "zod"

export const budgetSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
    categoryId: z.string().min(1, "Category is required"),
    walletId: z.string().optional().nullable(),
    amount: z.number().int().positive("Budget limit must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    period: z.enum(["daily", "weekly", "monthly", "yearly"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    alertThreshold: z.number().min(0).max(100).default(80),
    isActive: z.boolean().default(true),
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

export type BudgetInput = z.infer<typeof budgetSchema>
