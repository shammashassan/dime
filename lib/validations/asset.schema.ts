import { z } from "zod"

export const assetSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  kind: z.enum(["asset", "liability"]),
  category: z.enum([
    "real_estate",
    "vehicle",
    "gold",
    "crypto",
    "investment",
    "cash",
    "other",
    "mortgage",
    "student_loan",
    "auto_loan",
    "personal_loan",
    "credit_card"
  ]),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  currentValue: z.number().int("Value must be an integer (in cents/paise)"),
  valuationMethod: z.enum(["manual", "market", "calculated"]).default("manual"),
  ownershipPercentage: z.number().min(0).max(100).default(100),
  acquiredAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["active", "archived"]).default("active"),
  isArchived: z.boolean().default(false)
})

export type AssetInput = z.infer<typeof assetSchema>

export const assetValuationSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  date: z.coerce.date(),
  value: z.number().int("Value must be an integer (in cents/paise)"),
  source: z.enum(["manual", "market", "imported"]).default("manual"),
  notes: z.string().optional()
})

export type AssetValuationInput = z.infer<typeof assetValuationSchema>
