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
    
    // Subscription / Bill specific fields
    kind: z.enum(["recurring", "subscription", "bill"]).default("recurring").optional(),
    providerName: z.string().max(100).optional().nullable(),
    providerUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
    cancellationUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
    trialEndDate: z.coerce.date().optional().nullable(),
    reminderDaysBefore: z.coerce.number().int().min(0).max(60).optional().nullable(),
    nextRenewalDate: z.coerce.date().optional().nullable(),
    lastRenewalDate: z.coerce.date().optional().nullable(),
    renewalPrice: z.coerce.number().positive().optional().nullable(),
    cancelledAt: z.coerce.date().optional().nullable(),
    cancelReason: z.string().max(500).optional().nullable(),
    status: z.enum(["active", "trial", "paused", "cancelled", "expired"]).optional().nullable(),
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
