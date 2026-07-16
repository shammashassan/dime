import { z } from "zod"
import { validateSplits } from "../split-utils"

export const transactionSchema = z
  .object({
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().optional().nullable(),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.number().int().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    description: z.string().min(1, "Description is required").max(100, "Description must be 100 characters or less"),
    notes: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    targetWalletId: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurringId: z.string().optional(),
    budgetId: z.string().optional().nullable(),
    isFlagged: z.boolean().optional(),
    needsReview: z.boolean().optional(),
    splitMode: z.enum(["amount", "percentage", "equal"]).optional(),
    splits: z.array(
      z.object({
        id: z.string().optional(),
        categoryId: z.string().min(1, "Category is required"),
        amount: z.number().int().positive("Split amount must be positive"),
        percentage: z.number().optional(),
        notes: z.string().optional(),
      })
    ).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.targetWalletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target wallet is required for transfers",
          path: ["targetWalletId"],
        })
      } else if (data.walletId === data.targetWalletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Source and target wallets must be different",
          path: ["targetWalletId"],
        })
      }
    } else if (data.splits && data.splits.length > 0) {
      const errorMsg = validateSplits(data.amount, data.splits)
      if (errorMsg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMsg,
          path: ["splits"],
        })
      }
    }
  })

export type TransactionInput = z.infer<typeof transactionSchema>
