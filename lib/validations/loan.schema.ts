import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>

export const loanSchema = z.object({
  type: z.enum(["lent", "borrowed"]),
  contactId: z.string().optional(), // Can be empty initially if creating on the fly
  personName: z.string().min(1, "Name is required").max(100, "Name is too long"),
  amount: z.number().int().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  interestRate: z.number().nonnegative("Interest rate cannot be negative").optional(),
  walletId: z.string().min(1, "Wallet is required"),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["active", "partially_repaid", "fully_repaid", "overdue", "cancelled"]).default("active"),
  reminderSchedule: z.array(z.number()).default([7, 3, 1, 0]),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type LoanInput = z.infer<typeof loanSchema>

export const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  amount: z.number().int().positive("Amount must be positive"),
  walletId: z.string().min(1, "Wallet is required"),
  date: z.coerce.date(),
  notes: z.string().optional(),
})

export type RepaymentInput = z.infer<typeof repaymentSchema>
