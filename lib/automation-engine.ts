import { Transaction, Wallet, AutomationRule, RuleExecutionResult, RuleConflict, RuleAction, RuleTrigger, ExecutionMode } from "@/types"

/**
 * Matches a single rule condition against a transaction's fields.
 */
export function matchCondition(
  transaction: Partial<Transaction>,
  condition: AutomationRule["conditions"][number],
  wallet?: Wallet | null
): boolean {
  const { field, operator, value } = condition

  const matchString = (val: string, target: string, op: string) => {
    const v = val.toLowerCase()
    const t = target.toLowerCase()
    if (op === "contains") return v.includes(t)
    if (op === "equals") return v === t
    if (op === "starts_with") return v.startsWith(t)
    if (op === "ends_with") return v.endsWith(t)
    if (op === "regex") {
      try {
        const regex = new RegExp(target, "i")
        return regex.test(val)
      } catch {
        return false
      }
    }
    return false
  }

  let transactionValue: any = undefined
  if (field === "description") {
    const isTextOperator = ["contains", "equals", "starts_with", "ends_with", "regex"].includes(operator)
    if (isTextOperator && transaction.splits && transaction.splits.length > 0) {
      const parentMatched = matchString(transaction.description || "", String(value), operator)
      if (parentMatched) return true
      return transaction.splits.some(split => 
        matchString(split.notes || "", String(value), operator)
      )
    }
    transactionValue = transaction.description || ""
  } else if (field === "amount") {
    transactionValue = transaction.amount
  } else if (field === "walletId") {
    transactionValue = transaction.walletId || ""
  } else if (field === "walletType") {
    transactionValue = wallet?.type || ""
  } else if (field === "currency") {
    transactionValue = transaction.currency || ""
  } else if (field === "tags") {
    transactionValue = transaction.tags || []
  }

  if (transactionValue === undefined || transactionValue === null) return false

  switch (operator) {
    case "contains":
    case "equals":
    case "starts_with":
    case "ends_with":
    case "regex":
      return matchString(String(transactionValue), String(value), operator)
    case "gt":
      return typeof transactionValue === "number" && transactionValue > Number(value)
    case "lt":
      return typeof transactionValue === "number" && transactionValue < Number(value)
    case "eq":
      return typeof transactionValue === "number" && transactionValue === Number(value)
    case "gte":
      return typeof transactionValue === "number" && transactionValue >= Number(value)
    case "lte":
      return typeof transactionValue === "number" && transactionValue <= Number(value)
    case "contains_tag":
      if (Array.isArray(transactionValue)) {
        return transactionValue.some(t => t.toLowerCase() === String(value).toLowerCase())
      }
      if (typeof transactionValue === "string") {
        return transactionValue.toLowerCase() === String(value).toLowerCase()
      }
      return false
    default:
      return false
  }
}

/**
 * Executes a set of automation rules on a transaction.
 * Pure function: free of database writes or external side-effects.
 */
export function executeAutomationRules(
  transaction: Partial<Transaction>,
  rules: AutomationRule[],
  context: { trigger: RuleTrigger; wallet?: Wallet | null; mode?: ExecutionMode }
): RuleExecutionResult {
  const mode = context.mode || "all_matches"
  const originalTransaction = JSON.parse(JSON.stringify(transaction))
  const modifiedTransaction = JSON.parse(JSON.stringify(transaction))

  const appliedRules: RuleExecutionResult["appliedRules"] = []
  const skippedRules: RuleExecutionResult["skippedRules"] = []
  const conflicts: RuleConflict[] = []
  const warnings: string[] = []

  let stopProcessingTriggered = false
  let matchedRulesCount = 0

  // Filter active rules and sort by priority (descending)
  const sortedRules = [...rules]
    .filter(r => r.status === "active")
    .sort((a, b) => b.priority - a.priority)

  // Track modified fields to resolve conflicts (idempotency and priority win)
  const appliedFields: Record<string, { ruleId: string; ruleName: string; value: any }> = {}

  for (const rule of sortedRules) {
    const ruleIdStr = rule._id.toString()

    // 1. Check trigger mismatch
    if (!rule.triggers.includes(context.trigger)) {
      skippedRules.push({
        ruleId: ruleIdStr,
        ruleName: rule.name,
        reason: "trigger_mismatch"
      })
      continue
    }

    // 2. Check if a higher priority rule requested stopProcessing
    if (stopProcessingTriggered) {
      skippedRules.push({
        ruleId: ruleIdStr,
        ruleName: rule.name,
        reason: "stop_processing_triggered"
      })
      continue
    }

    // 3. Evaluate conditions
    const isMatched = rule.conditions.length > 0 && (
      rule.conditionOperator === "or"
        ? rule.conditions.some(cond => matchCondition(modifiedTransaction, cond, context.wallet))
        : rule.conditions.every(cond => matchCondition(modifiedTransaction, cond, context.wallet))
    )

    if (!isMatched) {
      skippedRules.push({
        ruleId: ruleIdStr,
        ruleName: rule.name,
        reason: "condition_mismatch"
      })
      continue
    }

    matchedRulesCount++
    const actionsApplied: RuleAction[] = []

    // 4. Apply actions with conflict resolution
    for (const action of rule.actions) {
      let fieldToModify = ""
      let valueToApply: any = undefined

      switch (action.type) {
        case "assign_category":
          if (modifiedTransaction.splits && modifiedTransaction.splits.length > 0) {
            warnings.push(`Rule '${rule.name}': skipped 'assign_category' because transaction is split.`)
            continue
          }
          fieldToModify = "categoryId"
          valueToApply = action.categoryId
          break
        case "assign_budget":
          if (modifiedTransaction.splits && modifiedTransaction.splits.length > 0) {
            warnings.push(`Rule '${rule.name}': skipped 'assign_budget' because transaction is split.`)
            continue
          }
          fieldToModify = "budgetId"
          valueToApply = action.budgetId
          break
        case "set_notes":
          fieldToModify = "notes"
          valueToApply = action.notes
          break
        case "mark_recurring":
          fieldToModify = "isRecurring"
          valueToApply = action.isRecurring
          break
        case "flag_transaction":
          fieldToModify = "flag_status"
          valueToApply = { isFlagged: action.isFlagged, needsReview: action.needsReview }
          break
        case "auto_split":
          if (originalTransaction.splits && originalTransaction.splits.length > 0) {
            warnings.push(`Rule '${rule.name}': skipped 'auto_split' because transaction was manually split.`)
            continue
          }
          fieldToModify = "splits"
          valueToApply = action.splits
          break
        case "move_to_wallet":
          fieldToModify = "walletId"
          valueToApply = action.walletId
          break
        case "assign_tags":
          fieldToModify = "tags"
          valueToApply = action.tags
          break
      }

      // Tags are appended/unionized rather than overwritten, which is naturally idempotent
      if (fieldToModify === "tags") {
        const currentTags = modifiedTransaction.tags || []
        const newTags = Array.from(new Set([...currentTags, ...valueToApply]))
        modifiedTransaction.tags = newTags
        actionsApplied.push(action)
        continue
      }

      // Check for conflict
      const existing = appliedFields[fieldToModify]
      if (existing) {
        conflicts.push({
          field: fieldToModify,
          winningRuleId: existing.ruleId,
          winningRuleName: existing.ruleName,
          losingRuleId: ruleIdStr,
          losingRuleName: rule.name,
          valueAttempted: valueToApply,
          valueApplied: existing.value
        })
      } else {
        appliedFields[fieldToModify] = {
          ruleId: ruleIdStr,
          ruleName: rule.name,
          value: valueToApply
        }

        if (fieldToModify === "categoryId") {
          modifiedTransaction.categoryId = valueToApply
        } else if (fieldToModify === "budgetId") {
          modifiedTransaction.budgetId = valueToApply
        } else if (fieldToModify === "notes") {
          modifiedTransaction.notes = valueToApply
        } else if (fieldToModify === "isRecurring") {
          modifiedTransaction.isRecurring = valueToApply
        } else if (fieldToModify === "flag_status") {
          modifiedTransaction.isFlagged = valueToApply.isFlagged
          modifiedTransaction.needsReview = valueToApply.needsReview
        } else if (fieldToModify === "splits") {
          modifiedTransaction.splits = valueToApply
        } else if (fieldToModify === "walletId") {
          modifiedTransaction.walletId = valueToApply
        }

        actionsApplied.push(action)
      }
    }

    if (actionsApplied.length > 0) {
      appliedRules.push({
        ruleId: ruleIdStr,
        ruleName: rule.name,
        actionsApplied
      })
    }

    if (rule.stopProcessing || mode === "first_match") {
      stopProcessingTriggered = true
    }
  }

  return {
    originalTransaction,
    modifiedTransaction,
    matchedRulesCount,
    appliedRules,
    skippedRules,
    conflicts,
    warnings,
    stopProcessingTriggered
  }
}
