import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db/collections"
import { RecurringRule, Transaction, Wallet, AutomationRule, BillInstance } from "@/types"
import { ObjectId } from "mongodb"
import { calculateNextDueDate } from "@/lib/utils"
import { executeAutomationRules } from "@/lib/automation-engine"
import { convertCurrency } from "@/lib/currency"
import { generateSplitId } from "@/lib/split-utils"
import { createNotification } from "@/lib/actions/notifications"

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
    // Use the type for BillInstance
    const billInstancesColl = await getCollection<Omit<BillInstance, "_id">>("bill_instances")

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

        if (rule.kind === "bill") {
          const existingBill = await billInstancesColl.findOne({
            ruleId: ruleOid.toString(),
            dueDate: new Date(nextDueDate),
          })
          if (!existingBill) {
            // CREATE A BILL INSTANCE INSTEAD OF A TRANSACTION
            const billInstance = {
              userId: rule.userId,
              organizationId: rule.organizationId || null,
              ruleId: ruleOid.toString(),
              description: rule.description,
              expectedAmount: rule.amount,
              currency: rule.currency,
              dueDate: new Date(nextDueDate),
              status: "pending" as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 1,
            }
            await billInstancesColl.insertOne(billInstance)

            // Send notification that bill is due
            await createNotification({
              userId: rule.userId,
              title: "Bill is Due",
              message: `Your bill for ${rule.description} is now due.`,
              type: "system",
              link: "/recurring"
            })
          }
        } else {
          // Check if transaction already exists
          const existingTx = await transactionsColl.findOne({
            recurringId: ruleOid.toString(),
            date: new Date(nextDueDate),
          })
          if (!existingTx) {
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
              type: (modTx.type as "income" | "expense") || rule.type,
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
          }
        }

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

    // 3. Process Reminders & Trial Expirations for Subscriptions & Bills
    let notificationsSent = 0
    const activeRemindables = await recurringColl.find({
      kind: { $in: ["subscription", "bill"] },
      isActive: true,
      $or: [
        { status: { $in: ["active", "trial"] } },
        { status: { $exists: false } }
      ]
    }).toArray()

    for (const item of activeRemindables) {
      let needsUpdate = false
      const updateData: Partial<RecurringRule> = {}
      
      const typeName = item.kind === "bill" ? "bill" : "subscription"
      
      // Check trial expiration
      if (item.status === "trial" && item.trialEndDate) {
        const trialEnd = new Date(item.trialEndDate)
        if (trialEnd <= now) {
          updateData.status = "active"
          needsUpdate = true
          await createNotification({
            userId: item.userId,
            title: "Free Trial Expired",
            message: `Your free trial for ${item.description} has ended. You will now be charged according to the schedule.`,
            type: "system",
            link: "/recurring"
          })
          notificationsSent++
        }
      }

      // Check upcoming renewals
      if (item.reminderDaysBefore && item.reminderDaysBefore > 0) {
        const nextDate = new Date(item.nextDueDate)
        const daysUntilRenewal = (nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
        
        // If within reminder window and hasn't been reminded for this cycle
        if (daysUntilRenewal > 0 && daysUntilRenewal <= item.reminderDaysBefore) {
          const lastReminder = item.lastReminderSentAt ? new Date(item.lastReminderSentAt) : null
          
          // Only send if we haven't sent a reminder in the last `reminderDaysBefore` days to prevent spam
          const hasSentRecently = lastReminder && (now.getTime() - lastReminder.getTime()) / (1000 * 3600 * 24) <= item.reminderDaysBefore
          
          if (!hasSentRecently) {
            const actionWord = item.kind === "bill" ? "is due in" : "will renew in"
            const title = item.kind === "bill" ? "Upcoming Bill Due" : "Upcoming Subscription Renewal"
            
            await createNotification({
              userId: item.userId,
              title,
              message: `Your ${typeName} to ${item.description} ${actionWord} ${Math.ceil(daysUntilRenewal)} day(s).`,
              type: "system",
              link: "/recurring"
            })
            notificationsSent++
            updateData.lastReminderSentAt = now
            needsUpdate = true
          }
        }
      }

      if (needsUpdate) {
        await recurringColl.updateOne({ _id: item._id }, { $set: updateData })
      }
    }

    return NextResponse.json({
      success: true,
      processedRules: processedRulesCount,
      transactionsCreated: totalTransactionsCreated,
      notificationsSent,
    })
  } catch (error: unknown) {
    console.error("Cron recurring processing failed:", error)
    return NextResponse.json(
      { error: "Internal server error during rule processing", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Support GET for testing, but still enforce security
export async function GET(request: Request) {
  return POST(request)
}
