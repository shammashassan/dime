import { z } from "zod"

export const createWatchlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
})

export const addWatchlistItemSchema = z.object({
  watchlistId: z.string().min(1, "Watchlist ID is required"),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(20, "Symbol cannot exceed 20 characters")
    .toUpperCase(),
  name: z.string().min(1, "Name is required").max(200, "Name cannot exceed 200 characters"),
  assetType: z.enum([
    "stock",
    "etf",
    "crypto",
    "mutual_fund",
    "bond",
    "commodity",
    "other",
  ]),
  targetPrice: z.coerce.number().positive().optional(),
  notes: z.string().max(500).optional(),
})

export const updateWatchlistItemSchema = addWatchlistItemSchema
  .omit({ watchlistId: true })
  .partial()

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>
export type AddWatchlistItemInput = z.infer<typeof addWatchlistItemSchema>
export type UpdateWatchlistItemInput = z.infer<typeof updateWatchlistItemSchema>
