import { z } from "zod"

export const investmentTransactionSchema = z.object({
  walletId: z.string().min(1, "Brokerage account is required"),
  symbol: z.string().min(1, "Ticker is required").toUpperCase(),
  name: z.string().min(1, "Name is required"),
  assetType: z.enum(["stock", "etf", "crypto", "mutual_fund", "bond", "commodity", "other"]),
  type: z.enum([
    "buy",
    "sell",
    "cash_dividend",
    "reinvested_dividend",
    "stock_split",
    "reverse_split",
    "interest",
    "fee",
    "transfer_in",
    "transfer_out",
    "adjustment"
  ]),
  quantity: z.number().nonnegative().default(0),
  price: z.number().nonnegative().default(0),
  fees: z.number().nonnegative().default(0),
  dividendAmount: z.number().nonnegative().optional(),
  date: z.coerce.date(),
  notes: z.string().optional(),
  exchange: z.string().optional(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export type InvestmentTransactionInput = z.infer<typeof investmentTransactionSchema>
