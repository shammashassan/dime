import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db/collections"
import { RecurringRule, Transaction, Wallet } from "@/types"
import { ObjectId } from "mongodb"
import { calculateNextDueDate } from "@/lib/utils"

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

    let processedRulesCount = 0
    let totalTransactionsCreated = 0

    for (const rule of rules) {
      let nextDueDate = new Date(rule.nextDueDate)
      let ruleProcessedCount = 0
      const ruleOid = rule._id

      // Loop to process any occurrences up to "now"
      while (nextDueDate <= now) {
        // Break if we exceed the endDate
        if (rule.endDate && nextDueDate > new Date(rule.endDate)) {
          break
        }

        // Insert transaction record directly
        const tx: Omit<Transaction, "_id"> = {
          userId: rule.userId,
          walletId: rule.walletId,
          categoryId: rule.categoryId,
          type: rule.type,
          amount: rule.amount,
          currency: rule.currency,
          description: rule.description,
          date: new Date(nextDueDate),
          tags: [...rule.tags, "recurring"],
          isRecurring: true,
          recurringId: ruleOid.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await transactionsColl.insertOne(tx as Transaction)

        // Increment or decrement wallet balance based on rule type
        const balanceChange = rule.type === "income" ? rule.amount : -rule.amount
        await walletsColl.updateOne(
          { _id: new ObjectId(rule.walletId), userId: rule.userId },
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
