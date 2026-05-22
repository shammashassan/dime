import { z } from "zod"

export const walletSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  type: z.enum(["bank", "cash", "credit_card", "savings", "investment", "lent"]),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  balance: z.number().int("Balance must be an integer (in cents/paise)"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
  isArchived: z.boolean().default(false),
})

export type WalletInput = z.infer<typeof walletSchema>
