import { z } from "zod"

export const conditionFieldSchema = z.enum(["description", "amount", "walletId", "walletType", "currency", "tags"])
export const conditionOperatorSchema = z.enum([
  "contains", "equals", "starts_with", "ends_with", "regex",
  "gt", "lt", "eq", "gte", "lte",
  "contains_tag"
])

export const ruleConditionSchema = z.object({
  field: conditionFieldSchema,
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
})

const assignCategoryActionSchema = z.object({
  type: z.literal("assign_category"),
  categoryId: z.string().min(1, "Category is required"),
})

const assignTagsActionSchema = z.object({
  type: z.literal("assign_tags"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
})

const assignBudgetActionSchema = z.object({
  type: z.literal("assign_budget"),
  budgetId: z.string().min(1, "Budget is required"),
})

const setNotesActionSchema = z.object({
  type: z.literal("set_notes"),
  notes: z.string().max(500, "Notes are too long"),
})

const markRecurringActionSchema = z.object({
  type: z.literal("mark_recurring"),
  isRecurring: z.boolean(),
})

const flagTransactionActionSchema = z.object({
  type: z.literal("flag_transaction"),
  isFlagged: z.boolean(),
  needsReview: z.boolean(),
})

const autoSplitActionSchema = z.object({
  type: z.literal("auto_split"),
  splits: z.array(
    z.object({
      categoryId: z.string().min(1, "Category is required"),
      amount: z.number().int().positive("Split amount must be positive"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one split is required"),
})

const moveToWalletActionSchema = z.object({
  type: z.literal("move_to_wallet"),
  walletId: z.string().min(1, "Wallet is required"),
})

export const ruleActionSchema = z.discriminatedUnion("type", [
  assignCategoryActionSchema,
  assignTagsActionSchema,
  assignBudgetActionSchema,
  setNotesActionSchema,
  markRecurringActionSchema,
  flagTransactionActionSchema,
  autoSplitActionSchema,
  moveToWalletActionSchema,
])

export const automationRuleSchema = z
  .object({
    name: z.string().min(1, "Rule name is required").max(100, "Name must be 100 characters or less"),
    description: z.string().max(500, "Description must be 500 characters or less").optional(),
    status: z.enum(["draft", "active", "disabled"]).default("active"),
    priority: z.number().int().min(0, "Priority must be at least 0").max(1000, "Priority cannot exceed 1000").default(0),
    stopProcessing: z.boolean().default(false),
    triggers: z.array(z.enum(["manual", "receipt", "csv_import", "recurring", "api"])).min(1, "At least one trigger is required"),
    conditionOperator: z.enum(["and", "or"]).default("and"),
    conditions: z.array(ruleConditionSchema).min(1, "At least one condition is required"),
    actions: z.array(ruleActionSchema).min(1, "At least one action is required"),
  })
  .superRefine((data, ctx) => {
    data.conditions.forEach((cond, idx) => {
      const { field, operator, value } = cond

      if (field === "amount") {
        if (!["gt", "lt", "eq", "gte", "lte"].includes(operator)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Amount field does not support operator '${operator}'. Use gt, lt, eq, gte, or lte.`,
            path: ["conditions", idx, "operator"]
          })
        }
        if (typeof value !== "number") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Amount condition value must be a number.`,
            path: ["conditions", idx, "value"]
          })
        }
      } else if (field === "tags") {
        if (operator !== "contains_tag") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Tags field only supports 'contains_tag' operator.`,
            path: ["conditions", idx, "operator"]
          })
        }
      } else {
        // String fields: description, walletId, walletType, currency
        if (!["contains", "equals", "starts_with", "ends_with", "regex"].includes(operator)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field '${field}' does not support operator '${operator}'. Use contains, equals, starts_with, ends_with, or regex.`,
            path: ["conditions", idx, "operator"]
          })
        }
        if (typeof value !== "string") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Value for field '${field}' must be a string.`,
            path: ["conditions", idx, "value"]
          })
        }
      }
    })
  })

export type AutomationRuleInput = z.infer<typeof automationRuleSchema>
