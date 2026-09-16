import { z } from "zod"

export const templateAllocationSchema = z.object({
  categoryName: z.string().min(1, "Category name is required").max(50, "Category name must be 50 characters or less"),
  categoryId: z.string().optional(),
  group: z.enum(["Needs", "Wants", "Savings", "Custom"]),
  percentage: z.number().min(0, "Percentage must be at least 0").max(100, "Percentage cannot exceed 100"),
  fixedAmount: z.number().int().nonnegative().optional(),
  suggestedColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  suggestedIcon: z.string().min(1, "Icon is required"),
  alertThreshold: z.number().min(0).max(100).default(80),
  description: z.string().max(200).optional(),
})

export type TemplateAllocationInput = z.infer<typeof templateAllocationSchema>

export const applyTemplateInputSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  totalMonthlyIncome: z.number().int().positive("Total budget amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().default("monthly"),
  strategy: z.enum(["smart_merge", "fresh_start"]).default("smart_merge"),
  customAllocations: z.array(templateAllocationSchema).optional(),
  categoryMappings: z
    .record(
      z.string(),
      z.object({
        categoryId: z.string().optional(),
        createNew: z.boolean().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .optional(),
})

export type ApplyTemplateInput = z.infer<typeof applyTemplateInputSchema>

export const saveCurrentBudgetsSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  tagline: z.string().max(80).optional(),
  description: z.string().max(250).optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
})

export type SaveCurrentBudgetsInput = z.infer<typeof saveCurrentBudgetsSchema>

export const createCustomTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  tagline: z.string().min(1, "Tagline is required").max(80, "Tagline must be 80 characters or less"),
  description: z.string().min(1, "Description is required").max(300, "Description must be 300 characters or less"),
  category: z.enum(["framework", "lifestyle", "goals", "custom"]).default("custom"),
  methodology: z.enum(["percentage", "fixed"]).default("percentage"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  tags: z.array(z.string()).default([]),
  allocations: z.array(templateAllocationSchema).min(1, "At least one category allocation is required"),
  rulesSummary: z.array(z.string()).default([]),
})

export type CreateCustomTemplateInput = z.infer<typeof createCustomTemplateSchema>
