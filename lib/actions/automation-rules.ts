"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { AutomationRule, AutomationJob, Transaction, Wallet, Category } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { automationRuleSchema } from "@/lib/validations/automation-rule.schema"
import { db } from "@/lib/db/client"
import { Role, canManageSpaceSettings } from "@/lib/permissions"
import { executeAutomationRules } from "@/lib/automation-engine"
import { AUTOMATION_TEMPLATES } from "@/lib/automation-templates"
import { convertCurrency } from "@/lib/currency"
import { serializeData } from "@/lib/utils"

// Helper to check user permission to edit automation settings
async function verifyRuleManagementPermission() {
  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageSpaceSettings(role)) {
      throw new Error("Unauthorized: You do not have permission to manage automation rules.")
    }
  }
  return scope
}

export async function createAutomationRuleAction(input: any) {
  const scope = await verifyRuleManagementPermission()
  const validated = automationRuleSchema.parse(input)

  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const rule: Omit<AutomationRule, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    name: validated.name,
    description: validated.description,
    status: validated.status || "active",
    priority: validated.priority || 0,
    stopProcessing: validated.stopProcessing || false,
    triggers: validated.triggers,
    conditions: validated.conditions,
    conditionOperator: validated.conditionOperator || "and",
    actions: validated.actions as any,
    executionCount: 0,
    lastExecutedAt: null,
    lastMatchedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: scope.userId,
    updatedBy: scope.userId,
  }

  const result = await rulesColl.insertOne(rule as AutomationRule)
  
  updateTag("automation-rules")
  revalidatePath("/settings")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateAutomationRuleAction(id: string, input: any) {
  const scope = await verifyRuleManagementPermission()
  const validated = automationRuleSchema.partial().parse(input)

  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const ruleOid = new ObjectId(id)

  // Verify ownership
  const existing = await rulesColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Automation rule not found.")

  const updateDoc: Partial<AutomationRule> = {
    ...validated,
    updatedAt: new Date(),
    updatedBy: scope.userId,
  }
  if (existing.version !== undefined) {
    updateDoc.version = existing.version + 1
  }

  await rulesColl.updateOne(
    { _id: ruleOid, ...getScopeFilter(scope) },
    { $set: updateDoc }
  )

  updateTag("automation-rules")
  revalidatePath("/settings")
  return { success: true }
}

export async function deleteAutomationRuleAction(id: string) {
  const scope = await verifyRuleManagementPermission()
  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const ruleOid = new ObjectId(id)

  const existing = await rulesColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Automation rule not found.")

  await rulesColl.deleteOne({ _id: ruleOid, ...getScopeFilter(scope) })

  updateTag("automation-rules")
  revalidatePath("/settings")
  return { success: true }
}

export async function toggleAutomationRuleAction(id: string, status: "draft" | "active" | "disabled") {
  const scope = await verifyRuleManagementPermission()
  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const ruleOid = new ObjectId(id)

  const existing = await rulesColl.findOne({ _id: ruleOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Automation rule not found.")

  await rulesColl.updateOne(
    { _id: ruleOid, ...getScopeFilter(scope) },
    {
      $set: {
        status,
        updatedAt: new Date(),
        updatedBy: scope.userId,
      },
      $inc: { version: 1 }
    }
  )

  updateTag("automation-rules")
  revalidatePath("/settings")
  return { success: true }
}

export async function installTemplateAction(templateKey: string) {
  const scope = await verifyRuleManagementPermission()
  const template = AUTOMATION_TEMPLATES.find(t => t.key === templateKey)
  if (!template) throw new Error("Template not found.")

  const categoriesColl = await getCollection<Category>("categories")
  const rulesColl = await getCollection<AutomationRule>("automation_rules")

  // Resolve categories by name in current scope
  const categories = await categoriesColl.find({
    $or: [getScopeFilter(scope), { userId: null }]
  }).toArray()

  // Map template actions to actions with resolved IDs
  const resolvedActions = template.actions.map(action => {
    if (action.type === "assign_category" && action.categoryName) {
      const match = categories.find(c => c.name.toLowerCase() === action.categoryName!.toLowerCase())
      if (!match) {
        // Fallback to "Other" or first category
        const fallback = categories.find(c => c.name === "Other") || categories[0]
        return { type: "assign_category", categoryId: fallback._id.toString() }
      }
      return { type: "assign_category", categoryId: match._id.toString() }
    }
    return action
  }) as any

  const rule: Omit<AutomationRule, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    name: template.name,
    description: template.description,
    status: "active",
    priority: template.priority,
    stopProcessing: template.stopProcessing,
    triggers: template.triggers,
    conditions: template.conditions as any,
    conditionOperator: template.conditionOperator,
    actions: resolvedActions,
    executionCount: 0,
    lastExecutedAt: null,
    lastMatchedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: scope.userId,
    updatedBy: scope.userId,
  }

  const result = await rulesColl.insertOne(rule as AutomationRule)

  updateTag("automation-rules")
  revalidatePath("/settings")
  return { success: true, id: result.insertedId.toString() }
}

export async function previewRetroactiveRulesAction(ruleId: string | null, tempRuleConfig?: any) {
  const scope = await verifyRuleManagementPermission()

  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const txColl = await getCollection<Transaction>("transactions")
  const walletsColl = await getCollection<Wallet>("wallets")
  const categoriesColl = await getCollection<Category>("categories")

  // Load all user categories & wallets to show friendly names in diff
  const [wallets, categories] = await Promise.all([
    walletsColl.find(getScopeFilter(scope)).toArray(),
    categoriesColl.find({ $or: [getScopeFilter(scope), { userId: null }] }).toArray()
  ])

  const walletMap = new Map(wallets.map(w => [w._id.toString(), w.name]))
  const categoryMap = new Map(categories.map(c => [c._id.toString(), c.name]))

  // Resolve the rule we are running preview for
  let targetRule: AutomationRule | null = null
  if (ruleId) {
    targetRule = await rulesColl.findOne({ _id: new ObjectId(ruleId), ...getScopeFilter(scope) })
  } else if (tempRuleConfig) {
    targetRule = {
      _id: new ObjectId(),
      userId: scope.userId,
      organizationId: scope.organizationId,
      name: tempRuleConfig.name || "Preview Rule",
      status: "active",
      priority: tempRuleConfig.priority || 0,
      stopProcessing: tempRuleConfig.stopProcessing || false,
      triggers: tempRuleConfig.triggers || ["manual"],
      conditions: tempRuleConfig.conditions || [],
      conditionOperator: tempRuleConfig.conditionOperator || "and",
      actions: tempRuleConfig.actions || [],
      executionCount: 0,
      lastExecutedAt: null,
      lastMatchedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: scope.userId,
      updatedBy: scope.userId
    }
  }

  if (!targetRule) throw new Error("No rule configuration provided for preview.")

  // Fetch all transactions in current scope
  const transactions = await txColl.find(getScopeFilter(scope)).sort({ date: -1 }).toArray()
  
  const matches: {
    transactionId: string
    description: string
    date: Date
    amount: number
    currency: string
    changes: { field: string; from: any; to: any }[]
  }[] = []

  for (const tx of transactions) {
    if (tx.type === "transfer") continue // Skip transfer transactions

    const txWallet = wallets.find(w => w._id.toString() === tx.walletId) || null

    // Execute only this specific rule for preview
    const result = executeAutomationRules(tx, [targetRule], {
      trigger: "manual", // Retroactive run maps to manual trigger contexts
      wallet: txWallet
    })

    if (result.matchedRulesCount > 0) {
      const changes: { field: string; from: any; to: any }[] = []
      const orig = result.originalTransaction
      const mod = result.modifiedTransaction

      if (orig.categoryId !== mod.categoryId) {
        changes.push({
          field: "Category",
          from: categoryMap.get(orig.categoryId || "") || "Unknown",
          to: categoryMap.get(mod.categoryId || "") || "Unknown"
        })
      }
      if (orig.walletId !== mod.walletId) {
        changes.push({
          field: "Wallet",
          from: walletMap.get(orig.walletId || "") || "Unknown",
          to: walletMap.get(mod.walletId || "") || "Unknown"
        })
      }
      if (JSON.stringify(orig.tags || []) !== JSON.stringify(mod.tags || [])) {
        changes.push({
          field: "Tags",
          from: (orig.tags || []).join(", ") || "(none)",
          to: (mod.tags || []).join(", ") || "(none)"
        })
      }
      if (orig.notes !== mod.notes) {
        changes.push({
          field: "Notes",
          from: orig.notes || "(none)",
          to: mod.notes || "(none)"
        })
      }
      if (orig.isRecurring !== mod.isRecurring) {
        changes.push({
          field: "Is Recurring",
          from: orig.isRecurring ? "Yes" : "No",
          to: mod.isRecurring ? "Yes" : "No"
        })
      }
      if (orig.isFlagged !== mod.isFlagged || orig.needsReview !== mod.needsReview) {
        changes.push({
          field: "Flags",
          from: `Flagged: ${!!orig.isFlagged}, Review: ${!!orig.needsReview}`,
          to: `Flagged: ${!!mod.isFlagged}, Review: ${!!mod.needsReview}`
        })
      }
      if (JSON.stringify(orig.splits || []) !== JSON.stringify(mod.splits || [])) {
        changes.push({
          field: "Splits",
          from: orig.splits ? `${orig.splits.length} splits` : "none",
          to: mod.splits ? `${mod.splits.length} splits` : "none"
        })
      }

      if (changes.length > 0) {
        matches.push({
          transactionId: tx._id.toString(),
          description: tx.description,
          date: tx.date,
          amount: tx.amount,
          currency: tx.currency,
          changes
        })
      }
    }
  }

  return { success: true, count: matches.length, matches }
}

export async function startRetroactiveJobAction(ruleId: string) {
  const scope = await verifyRuleManagementPermission()

  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const jobsColl = await getCollection<AutomationJob>("automation_jobs")
  const txColl = await getCollection<Transaction>("transactions")

  const rule = await rulesColl.findOne({ _id: new ObjectId(ruleId), ...getScopeFilter(scope) })
  if (!rule) throw new Error("Automation rule not found.")

  const totalTransactions = await txColl.countDocuments(getScopeFilter(scope))

  const jobDoc: Omit<AutomationJob, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ruleId,
    status: "pending",
    totalTransactions,
    processedTransactions: 0,
    matchedTransactions: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await jobsColl.insertOne(jobDoc as AutomationJob)
  const jobId = result.insertedId

  // Kick off background execution process
  // Note: we run it asynchronously and don't await the process in the response
  runRetroactiveJobBackground(jobId.toString(), ruleId, scope).catch(err => {
    console.error("Background retroactive job execution failed:", err)
  })

  return { success: true, jobId: jobId.toString() }
}

export async function getJobStatusAction(jobId: string) {
  const scope = await verifyRuleManagementPermission()
  const jobsColl = await getCollection<AutomationJob>("automation_jobs")
  const job = await jobsColl.findOne({ _id: new ObjectId(jobId), ...getScopeFilter(scope) })
  if (!job) throw new Error("Job not found.")
  return {
    success: true,
    status: job.status,
    total: job.totalTransactions,
    processed: job.processedTransactions,
    matched: job.matchedTransactions,
    error: job.error,
  }
}

// Background processing worker
async function runRetroactiveJobBackground(jobId: string, ruleId: string, scope: any) {
  const jobsColl = await getCollection<AutomationJob>("automation_jobs")
  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const txColl = await getCollection<Transaction>("transactions")
  const walletsColl = await getCollection<Wallet>("wallets")

  const jobOid = new ObjectId(jobId)

  try {
    await jobsColl.updateOne({ _id: jobOid }, { $set: { status: "processing", updatedAt: new Date() } })

    const rule = await rulesColl.findOne({ _id: new ObjectId(ruleId), ...getScopeFilter(scope) })
    if (!rule) throw new Error("Rule not found during execution.")

    const wallets = await walletsColl.find(getScopeFilter(scope)).toArray()

    // Query all transactions for processing in batches of 100
    const limit = 100
    let skip = 0
    let processedCount = 0
    let matchedCount = 0

    let hasMore = true

    while (hasMore) {
      const transactions = await txColl
        .find(getScopeFilter(scope))
        .skip(skip)
        .limit(limit)
        .toArray()

      if (transactions.length === 0) {
        hasMore = false
        break
      }

      const txBulkOps: any[] = []
      const walletBalanceAdjustments: Record<string, number> = {}

      for (const tx of transactions) {
        if (tx.type === "transfer") continue // Skip transfers

        const txWallet = wallets.find(w => w._id.toString() === tx.walletId) || null

        // Execute rule matching
        const result = executeAutomationRules(tx, [rule], {
          trigger: "manual",
          wallet: txWallet
        })

        if (result.matchedRulesCount > 0) {
          matchedCount++
          const mod = result.modifiedTransaction

          // Determine if wallet changed
          if (tx.walletId !== mod.walletId && mod.walletId) {
            // Find wallets
            const oldWallet = wallets.find(w => w._id.toString() === tx.walletId)
            const newWallet = wallets.find(w => w._id.toString() === mod.walletId)

            if (oldWallet && newWallet) {
              // Convert amount if currency changes
              let targetAmount = mod.amount || tx.amount
              if (oldWallet.currency !== newWallet.currency) {
                targetAmount = await convertCurrency(tx.amount, oldWallet.currency, newWallet.currency)
              }

              // old wallet balance: restore old transaction amount (add if expense, subtract if income)
              const restoreChange = tx.type === "income" ? -tx.amount : tx.amount
              walletBalanceAdjustments[tx.walletId] = (walletBalanceAdjustments[tx.walletId] || 0) + restoreChange

              // new wallet balance: deduct new transaction amount (subtract if expense, add if income)
              const applyChange = tx.type === "income" ? targetAmount : -targetAmount
              walletBalanceAdjustments[mod.walletId] = (walletBalanceAdjustments[mod.walletId] || 0) + applyChange

              mod.amount = targetAmount
              mod.currency = newWallet.currency
            }
          }

          // Build transaction bulk operation
          txBulkOps.push({
            updateOne: {
              filter: { _id: tx._id },
              update: {
                $set: {
                  categoryId: mod.categoryId,
                  walletId: mod.walletId,
                  tags: mod.tags,
                  notes: mod.notes,
                  isRecurring: mod.isRecurring,
                  isFlagged: mod.isFlagged,
                  needsReview: mod.needsReview,
                  splits: mod.splits,
                  amount: mod.amount,
                  currency: mod.currency,
                  updatedAt: new Date(),
                  updatedBy: scope.userId
                },
                $inc: { version: 1 }
              }
            }
          })
        }
      }

      // Execute bulk transaction updates if there are changes
      if (txBulkOps.length > 0) {
        await txColl.bulkWrite(txBulkOps)
      }

      // Execute wallet updates if needed
      const walletBulkOps: any[] = []
      for (const [wId, change] of Object.entries(walletBalanceAdjustments)) {
        walletBulkOps.push({
          updateOne: {
            filter: { _id: new ObjectId(wId) },
            update: {
              $inc: { balance: change, version: 1 },
              $set: { updatedAt: new Date(), updatedBy: scope.userId }
            }
          }
        })
      }
      if (walletBulkOps.length > 0) {
        await walletsColl.bulkWrite(walletBulkOps)
      }

      processedCount += transactions.length
      skip += limit

      // Update job progress in DB
      await jobsColl.updateOne(
        { _id: jobOid },
        {
          $set: {
            processedTransactions: processedCount,
            matchedTransactions: matchedCount,
            updatedAt: new Date()
          }
        }
      )
    }

    // Mark job completed and update rule execution count (purely in server action)
    await jobsColl.updateOne(
      { _id: jobOid },
      { $set: { status: "completed", updatedAt: new Date() } }
    )

    // Increment execution count for this rule
    await rulesColl.updateOne(
      { _id: new ObjectId(ruleId) },
      {
        $inc: { executionCount: matchedCount },
        $set: { lastExecutedAt: new Date(), lastMatchedAt: matchedCount > 0 ? new Date() : null }
      }
    )

    updateTag("transactions")
    updateTag("wallets")
    updateTag("automation-rules")
  } catch (err: any) {
    console.error("Error running retroactive job:", err)
    await jobsColl.updateOne(
      { _id: jobOid },
      { $set: { status: "failed", error: err.message || "Internal execution error", updatedAt: new Date() } }
    )
  }
}

export async function getAutomationRulesAction() {
  const scope = await getFinancialScope()
  const rulesColl = await getCollection<AutomationRule>("automation_rules")
  const rules = await rulesColl.find(getScopeFilter(scope)).sort({ priority: -1 }).toArray()
  return { success: true, rules: serializeData(rules) }
}
