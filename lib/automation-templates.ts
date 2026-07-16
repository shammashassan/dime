import { RuleTrigger, RuleCondition, RuleAction } from "@/types"

export interface RuleTemplateAction {
  type: 
    | "assign_category"
    | "assign_tags"
    | "assign_budget"
    | "set_notes"
    | "mark_recurring"
    | "flag_transaction"
    | "move_to_wallet"
  categoryName?: string // Used to resolve categoryId dynamically on install
  tags?: string[]
  budgetId?: string
  notes?: string
  isRecurring?: boolean
  isFlagged?: boolean
  needsReview?: boolean
  walletId?: string
}

export interface RuleTemplate {
  key: string
  name: string
  description: string
  priority: number
  stopProcessing: boolean
  triggers: RuleTrigger[]
  conditionOperator: "and" | "or"
  conditions: Omit<RuleCondition, "_id">[]
  actions: RuleTemplateAction[]
}

export const AUTOMATION_TEMPLATES: RuleTemplate[] = [
  {
    key: "uber_lyft_transport",
    name: "Auto-categorize Rideshares",
    description: "Automatically tags Uber and Lyft charges as Transport.",
    priority: 10,
    stopProcessing: true,
    triggers: ["manual", "receipt", "csv_import", "recurring"],
    conditionOperator: "or",
    conditions: [
      { field: "description", operator: "contains", value: "uber" },
      { field: "description", operator: "contains", value: "lyft" }
    ],
    actions: [
      { type: "assign_category", categoryName: "Transport" },
      { type: "assign_tags", tags: ["rideshare", "commute"] }
    ]
  },
  {
    key: "amazon_shopping",
    name: "Amazon Shopping Categorizer",
    description: "Automatically maps Amazon charges to Shopping and flags high amounts.",
    priority: 5,
    stopProcessing: false,
    triggers: ["manual", "receipt", "csv_import"],
    conditionOperator: "and",
    conditions: [
      { field: "description", operator: "contains", value: "amazon" }
    ],
    actions: [
      { type: "assign_category", categoryName: "Shopping" },
      { type: "assign_tags", tags: ["amazon"] }
    ]
  },
  {
    key: "netflix_spotify_subs",
    name: "Identify Subscriptions",
    description: "Flags streaming charges like Netflix, Spotify, or Youtube as Subscriptions.",
    priority: 15,
    stopProcessing: true,
    triggers: ["manual", "receipt", "csv_import", "recurring"],
    conditionOperator: "or",
    conditions: [
      { field: "description", operator: "contains", value: "netflix" },
      { field: "description", operator: "contains", value: "spotify" },
      { field: "description", operator: "contains", value: "youtube premium" }
    ],
    actions: [
      { type: "assign_category", categoryName: "Subscriptions" },
      { type: "mark_recurring", isRecurring: true },
      { type: "assign_tags", tags: ["entertainment", "subscription"] }
    ]
  },
  {
    key: "housing_rent",
    name: "Housing Rent Classifier",
    description: "Classifies rent charges to Housing, sets a recurring flag and notes.",
    priority: 20,
    stopProcessing: true,
    triggers: ["manual", "csv_import", "recurring"],
    conditionOperator: "or",
    conditions: [
      { field: "description", operator: "contains", value: "rent" },
      { field: "description", operator: "contains", value: "landlord" }
    ],
    actions: [
      { type: "assign_category", categoryName: "Housing" },
      { type: "mark_recurring", isRecurring: true },
      { type: "set_notes", notes: "Monthly rental payment" }
    ]
  },
  {
    key: "grocery_stores",
    name: "Grocery Categorizer",
    description: "Automatically classifies Walmart, Costco, or Kroger purchases as Food & Dining.",
    priority: 8,
    stopProcessing: false,
    triggers: ["manual", "receipt", "csv_import"],
    conditionOperator: "or",
    conditions: [
      { field: "description", operator: "contains", value: "walmart" },
      { field: "description", operator: "contains", value: "costco" },
      { field: "description", operator: "contains", value: "kroger" }
    ],
    actions: [
      { type: "assign_category", categoryName: "Food & Dining" },
      { type: "assign_tags", tags: ["groceries"] }
    ]
  },
  {
    key: "salary_income",
    name: "Salary Income Router",
    description: "Matches salary credit descriptions, sets category to Salary, and tags as income.",
    priority: 25,
    stopProcessing: true,
    triggers: ["manual", "csv_import", "recurring"],
    conditionOperator: "or",
    conditions: [
      { field: "description", operator: "contains", value: "salary" },
      { field: "description", operator: "contains", value: "payroll" },
      { field: "description", operator: "contains", value: "direct dep" }
    ],
    actions: [
      { type: "assign_category", categoryName: "Salary" },
      { type: "assign_tags", tags: ["income", "payroll"] }
    ]
  },
  {
    key: "high_value_review",
    name: "High Value Flag for Review",
    description: "Flags any expense transaction greater than 10,000 cents/paise (100) for review.",
    priority: 30,
    stopProcessing: false,
    triggers: ["manual", "receipt", "csv_import"],
    conditionOperator: "and",
    conditions: [
      { field: "amount", operator: "gt", value: 10000 }
    ],
    actions: [
      { type: "flag_transaction", isFlagged: true, needsReview: true },
      { type: "assign_tags", tags: ["high-value-alert"] }
    ]
  }
]
export function getTemplateByKey(key: string): RuleTemplate | undefined {
  return AUTOMATION_TEMPLATES.find(t => t.key === key)
}
