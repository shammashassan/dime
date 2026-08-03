import { z } from "zod"

export const participantSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  participantType: z.enum(["user", "contact"]),
  name: z.string().min(1, "Participant name is required"),
  email: z.string().email().optional().or(z.literal("")),
  amountPaid: z.number().min(0, "Amount paid cannot be negative"),
  amountOwed: z.number().min(0, "Amount owed cannot be negative"),
  percentage: z.number().min(0).max(100).optional(),
})

export const createSharedExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title is too long"),
  totalAmount: z.number().positive("Total amount must be greater than zero"), // in cents/paise
  currency: z.string().min(3).max(3),
  paidByParticipantId: z.string().min(1, "Payer participant is required"),
  paidByParticipantType: z.enum(["user", "contact"]),
  splitMode: z.enum(["equal", "percentage", "custom"]),
  participants: z.array(participantSchema).min(2, "At least two participants are required"),
  date: z.coerce.date(),
  notes: z.string().max(500).optional(),
  organizationId: z.string().nullable().optional(),
  transactionId: z.string().optional(),
  walletId: z.string().optional(),
})

export type CreateSharedExpenseInput = z.infer<typeof createSharedExpenseSchema>

export const recordSettlementSchema = z.object({
  expenseId: z.string().optional(),
  fromParticipantId: z.string().min(1, "Payer participant is required"),
  fromParticipantType: z.enum(["user", "contact"]),
  toParticipantId: z.string().min(1, "Receiver participant is required"),
  toParticipantType: z.enum(["user", "contact"]),
  amount: z.number().positive("Settlement amount must be greater than zero"), // in cents/paise
  currency: z.string().min(3).max(3),
  paymentMethod: z.string().optional(),
  walletId: z.string().optional(), // If specified, also logs a wallet transaction
  settledAt: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional(),
  organizationId: z.string().nullable().optional(),
})

export type RecordSettlementInput = z.infer<typeof recordSettlementSchema>
