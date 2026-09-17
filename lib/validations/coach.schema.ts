import { z } from "zod"

export const askCoachSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Question must be at least 2 characters")
    .max(1000, "Question is too long (max 1,000 characters)"),
})

export type AskCoachInput = z.infer<typeof askCoachSchema>

export const simulateCoachScenarioSchema = z.object({
  extraDebtPayoffCents: z.number().min(0).default(0),
  extraEmergencySavingsCents: z.number().min(0).default(0),
  discretionaryTrimPercent: z.number().min(0).max(100).default(0),
})

export type SimulateCoachScenarioInput = z.infer<typeof simulateCoachScenarioSchema>
