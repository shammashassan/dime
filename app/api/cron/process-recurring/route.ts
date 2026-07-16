import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db/collections"
import { RecurringRule, Transaction, Wallet, AutomationRule } from "@/types"
import { ObjectId } from "mongodb"
import { calculateNextDueDate } from "@/lib/utils"
import { executeAutomationRules } from "@/lib/automation-engine"
import { convertCurrency } from "@/lib/currency"
import { generateSplitId } from "@/lib/split-utils"

export async function POST(request: Request) {
  // 1. Verify cron secret
  const authHeader = request.headers.get("Authorization")
  const xCronSecret = request.headers.get("x-cron-secret")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron secret is not configured on the server" },
      { status: 500 }
    )
  }

  const token = authHeader ? authHeader.replace("Bearer ", "") : ""
  const isAuthorized = token === cronSecret || xCronSecret === cronSecret

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const recurringColl = await getCollection<RecurringRule>("recurring_rules")
    const transactionsColl = await getCollection<Transaction>("transactions")
    const walletsColl = await getCollection<Wallet>("wallets")

    const now = new Date()

    // 2. Fetch all active rules that are due
    const rules = await recurringColl
      .find({
        isActive: true,
        nextDueDate: { $lte: now },
      })
      .toArray()

    const automationRulesColl = await getCollection<AutomationRule>("automation_rules")
    const activeRules = await automationRulesColl.find({ status: "active" }).toArray()

    let processedRulesCount = 0
    let totalTransactionsCreated = 0

    for (const rule of rules) {
      let nextDueDate = new Date(rule.nextDueDate)
      let ruleProcessedCount = 0
      const ruleOid = rule._id

      // Load wallet and filter rules for this user/org scope
      const wallet = await walletsColl.findOne({ _id: new ObjectId(rule.walletId) })
      const userRules = activeRules.filter(ar => 
        rule.organizationId 
          ? ar.organizationId === rule.organizationId
          : ar.userId === rule.userId && !ar.organizationId
      )

      // Loop to process any occurrences up to "now"
      while (nextDueDate <= now) {
        // Break if we exceed the endDate
        if (rule.endDate && nextDueDate > new Date(rule.endDate)) {
          break
        }

        // Run automation rules
        const engineResult = executeAutomationRules(
          {
            walletId: rule.walletId,
            categoryId: rule.categoryId,
            type: rule.type,
            amount: rule.amount,
            currency: rule.currency,
            description: rule.description,
            tags: rule.tags || [],
          },
          userRules,
          { trigger: "recurring", wallet }
        )

        const modTx = engineResult.modifiedTransaction

        // Resolve wallet swaps
        let finalWalletId = modTx.walletId || rule.walletId
        let finalAmount = modTx.amount || rule.amount
        let finalCurrency = modTx.currency || rule.currency

        if (finalWalletId !== rule.walletId && wallet) {
          const targetWallet = await walletsColl.findOne({ _id: new ObjectId(finalWalletId) })
          if (targetWallet) {
            finalCurrency = targetWallet.currency
            finalAmount = await convertCurrency(rule.amount, wallet.currency, targetWallet.currency)
          } else {
            finalWalletId = rule.walletId
          }
        }

        const hasSplits = modTx.splits && modTx.splits.length > 0
        const processedSplits = modTx.splits?.map(split => ({
          id: split.id || generateSplitId(),
          categoryId: split.categoryId,
          amount: split.amount,
          percentage: split.percentage,
          notes: split.notes,
        }))

        // Insert transaction record directly
        const tx: Omit<Transaction, "_id"> = {
          userId: rule.userId,
          organizationId: rule.organizationId || null,
          ownerUserId: rule.userId,
          createdBy: rule.userId,
          updatedBy: rule.userId,
          walletId: finalWalletId,
          categoryId: hasSplits ? null : (modTx.categoryId || rule.categoryId),
          type: modTx.type as any || rule.type,
          amount: finalAmount,
          currency: finalCurrency,
          description: modTx.description || rule.description,
          date: new Date(nextDueDate),
          tags: [...(modTx.tags || rule.tags), "recurring"],
          isRecurring: true,
          recurringId: ruleOid.toString(),
          budgetId: modTx.budgetId || undefined,
          isFlagged: modTx.isFlagged || false,
          needsReview: modTx.needsReview || false,
          splitMode: hasSplits ? "amount" : undefined,
          splits: processedSplits,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await transactionsColl.insertOne(tx as Transaction)

        // Increment rule execution statistics in DB
        if (engineResult.matchedRulesCount > 0) {
          const rulesToUpdate = engineResult.appliedRules.map(ar => new ObjectId(ar.ruleId))
          if (rulesToUpdate.length > 0) {
            await automationRulesColl.updateMany(
              { _id: { $in: rulesToUpdate } },
              {
                $inc: { executionCount: 1 },
                $set: { lastExecutedAt: new Date(), lastMatchedAt: new Date() }
              }
            )
          }
        }

        // Increment or decrement wallet balance based on rule type
        const balanceChange = tx.type === "income" ? tx.amount : -tx.amount
        await walletsColl.updateOne(
          { _id: new ObjectId(finalWalletId), userId: rule.userId },
          { $inc: { balance: balanceChange }, $set: { updatedAt: new Date() } }
        )

        // Advance nextDueDate
        nextDueDate = calculateNextDueDate(nextDueDate, rule.frequency)
        ruleProcessedCount++
        totalTransactionsCreated++

        // Safety limit to prevent infinite loops on misconfiguration
        if (ruleProcessedCount > 50) {
          break
        }
      }

      if (ruleProcessedCount > 0) {
        processedRulesCount++
        await recurringColl.updateOne(
          { _id: ruleOid },
          {
            $set: {
              nextDueDate,
              lastProcessedDate: new Date(),
              updatedAt: new Date(),
            },
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      processedRules: processedRulesCount,
      transactionsCreated: totalTransactionsCreated,
    })
  } catch (error: any) {
    console.error("Cron recurring processing failed:", error)
    return NextResponse.json(
      { error: "Internal server error during rule processing", details: error.message },
      { status: 500 }
    )
  }
}

// Support GET for testing, but still enforce security
export async function GET(request: Request) {
  return POST(request)
}
