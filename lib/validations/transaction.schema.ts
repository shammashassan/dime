import { z } from "zod"

export const transactionSchema = z
  .object({
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().min(1, "Category is required"),
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
  })
  .refine(
    (data) => {
      if (data.type === "transfer" && !data.targetWalletId) {
        return false
      }
      return true
    },
    {
      message: "Target wallet is required for transfers",
      path: ["targetWalletId"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "transfer" && data.walletId === data.targetWalletId) {
        return false
      }
      return true
    },
    {
      message: "Source and target wallets must be different",
      path: ["targetWalletId"],
    }
  )

export type TransactionInput = z.infer<typeof transactionSchema>
