"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { transactionSchema, TransactionInput } from "@/lib/validations/transaction.schema"
import { Wallet, Transaction, Category, AutomationRule, BillInstance } from "@/types"
import { executeAutomationRules } from "@/lib/automation-engine"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { convertCurrency } from "@/lib/currency"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { FinancialScope } from "@/types/scope"
import { db } from "@/lib/db/client"
import { canCreateTransactions, canEditTransactions, canDeleteTransactions, Role } from "@/lib/permissions"
import { generateSplitId } from "@/lib/split-utils"

// Helper to update a wallet's balance
async function updateWalletBalance(scope: FinancialScope, walletId: string, amountChange: number) {
  const walletsColl = await getCollection<Wallet>("wallets")
  await walletsColl.updateOne(
    { _id: new ObjectId(walletId), ...getScopeFilter(scope) },
    {
      $inc: { balance: amountChange, version: 1 },
      $set: { updatedAt: new Date(), updatedBy: scope.userId }
    }
  )
}

export async function createTransaction(input: TransactionInput) {
  try {
    await requireApprovedUser()
    const validationResult = transactionSchema.safeParse(input)
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message }
    }
    const validated = validationResult.data

    const scope = await getFinancialScope()
    if (scope.isOrganization) {
      const member = await db.collection("member").findOne({
        userId: scope.userId,
        organizationId: scope.organizationId,
      })
      const role = (member?.role as Role) || "member"
      if (!canCreateTransactions(role)) {
        return { success: false, error: "Unauthorized" }
      }
    }

  const walletsColl = await getCollection<Wallet>("wallets")
  const transactionsColl = await getCollection<Transaction>("transactions")

  // Verify wallet exists
  const wallet = await walletsColl.findOne({ _id: new ObjectId(validated.walletId), ...getScopeFilter(scope) })
  if (!wallet) throw new Error("Source wallet not found")

  if (validated.type !== "transfer") {
    // Normal Transaction
    // 1. Fetch active automation rules
    const rulesColl = await getCollection<AutomationRule>("automation_rules")
    const activeRules = await rulesColl.find({ ...getScopeFilter(scope), status: "active" }).toArray()

    // 2. Execute rules
    const engineResult = executeAutomationRules(
      {
        walletId: validated.walletId,
        categoryId: validated.categoryId,
        type: validated.type,
        amount: validated.amount,
        currency: validated.currency,
        description: validated.description,
        notes: validated.notes || undefined,
        tags: validated.tags || [],
        isRecurring: validated.isRecurring || false,
        recurringId: validated.recurringId || undefined,
        splits: validated.splits
          ? validated.splits.map((s) => ({
              id: s.id || generateSplitId(),
              categoryId: s.categoryId,
              amount: s.amount,
              percentage: s.percentage,
              notes: s.notes,
            }))
          : undefined,
      },
      activeRules,
      { trigger: "manual", wallet }
    )

    const modTx = engineResult.modifiedTransaction

    // 3. Resolve wallet changes and currency conversions if needed
    let finalWalletId = modTx.walletId || validated.walletId
    let finalAmount = modTx.amount || validated.amount
    let finalCurrency = modTx.currency || validated.currency

    if (finalWalletId !== validated.walletId) {
      const targetWallet = await walletsColl.findOne({ _id: new ObjectId(finalWalletId), ...getScopeFilter(scope) })
      if (targetWallet) {
        finalCurrency = targetWallet.currency
        finalAmount = await convertCurrency(validated.amount, wallet.currency, targetWallet.currency)
      } else {
        finalWalletId = validated.walletId
      }
    }

    const hasSplits = (validated.splits && validated.splits.length > 0) || (modTx.splits && modTx.splits.length > 0)
    const finalSplits = validated.splits && validated.splits.length > 0 ? validated.splits : (modTx.splits || undefined)
    const finalSplitMode = validated.splits && validated.splits.length > 0 ? (validated.splitMode || "amount") : (hasSplits ? "amount" : undefined)

    const processedSplits = finalSplits?.map(split => ({
      id: split.id || generateSplitId(),
      categoryId: split.categoryId,
      amount: split.amount,
      percentage: split.percentage,
      notes: split.notes,
    }))

    const tx: Omit<Transaction, "_id"> = {
      userId: scope.userId,
      organizationId: scope.organizationId,
      ownerUserId: scope.userId,
      createdBy: scope.userId,
      updatedBy: scope.userId,
      walletId: finalWalletId,
      categoryId: hasSplits ? null : (modTx.categoryId || validated.categoryId),
      type: modTx.type || validated.type,
      amount: finalAmount,
      currency: finalCurrency,
      description: modTx.description || validated.description,
      notes: modTx.notes || undefined,
      date: validated.date,
      tags: modTx.tags || [],
      isRecurring: modTx.isRecurring || false,
      recurringId: modTx.recurringId || undefined,
      budgetId: modTx.budgetId || undefined,
      isFlagged: modTx.isFlagged !== undefined ? modTx.isFlagged : (validated.isFlagged || false),
      needsReview: modTx.needsReview !== undefined ? modTx.needsReview : (validated.needsReview || false),
      splitMode: finalSplitMode,
      splits: processedSplits,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    }

    const result = await transactionsColl.insertOne(tx as Transaction)

    // 4. Update stats for applied rules in database (outside pure engine)
    if (engineResult.matchedRulesCount > 0) {
      const rulesToUpdate = engineResult.appliedRules.map(ar => new ObjectId(ar.ruleId))
      if (rulesToUpdate.length > 0) {
        await rulesColl.updateMany(
          { _id: { $in: rulesToUpdate } },
          {
            $inc: { executionCount: 1 },
            $set: { lastExecutedAt: new Date(), lastMatchedAt: new Date() }
          }
        )
      }
    }

    // Update balance
    const balanceChange = tx.type === "income" ? tx.amount : -tx.amount
    await updateWalletBalance(scope, finalWalletId, balanceChange)

    updateTag("transactions")
    updateTag("wallets")
    updateTag("automation-rules")
    revalidatePath("/transactions")
    revalidatePath(`/wallets/${finalWalletId}`)
    revalidatePath("/", "layout")
    return { success: true, id: result.insertedId.toString() }
  } else {
    // Transfer Transaction
    // Needs targetWalletId
    if (!validated.targetWalletId) throw new Error("Target wallet is required for transfers")

    const targetWallet = await walletsColl.findOne({ _id: new ObjectId(validated.targetWalletId), ...getScopeFilter(scope) })
    if (!targetWallet) throw new Error("Target wallet not found")

    // Convert amount to target wallet currency if different
    const targetAmount = await convertCurrency(validated.amount, wallet.currency, targetWallet.currency)

    const debitOid = new ObjectId()
    const creditOid = new ObjectId()

    // 1. Debit Transaction (from Source Wallet)
    const debitTx: Transaction = {
      _id: debitOid,
      userId: scope.userId,
      organizationId: scope.organizationId,
      ownerUserId: scope.userId,
      createdBy: scope.userId,
      updatedBy: scope.userId,
      walletId: validated.walletId,
      categoryId: validated.categoryId,
      type: "transfer",
      transferType: "debit",
      amount: validated.amount,
      currency: wallet.currency,
      description: validated.description || `Transfer to ${targetWallet.name}`,
      notes: validated.notes || undefined,
      date: validated.date,
      tags: validated.tags || [],
      isRecurring: validated.isRecurring || false,
      recurringId: validated.recurringId || undefined,
      linkedTransactionId: creditOid.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    }

    // 2. Credit Transaction (to Target Wallet)
    const creditTx: Transaction = {
      _id: creditOid,
      userId: scope.userId,
      organizationId: scope.organizationId,
      ownerUserId: scope.userId,
      createdBy: scope.userId,
      updatedBy: scope.userId,
      walletId: validated.targetWalletId,
      categoryId: validated.categoryId,
      type: "transfer",
      transferType: "credit",
      amount: targetAmount,
      currency: targetWallet.currency,
      description: validated.description || `Transfer from ${wallet.name}`,
      notes: validated.notes || undefined,
      date: validated.date,
      tags: validated.tags || [],
      isRecurring: validated.isRecurring || false,
      recurringId: validated.recurringId || undefined,
      linkedTransactionId: debitOid.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    }

    await transactionsColl.insertMany([debitTx, creditTx])

    // Update balances
    await updateWalletBalance(scope, validated.walletId, -validated.amount)
    await updateWalletBalance(scope, validated.targetWalletId, targetAmount)

    updateTag("transactions")
    updateTag("wallets")
    revalidatePath("/transactions")
    revalidatePath(`/wallets/${validated.walletId}`)
    revalidatePath(`/wallets/${validated.targetWalletId}`)
    revalidatePath("/", "layout")
    return { success: true, id: debitOid.toString() }
  }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create transaction." }
  }
}

export async function deleteTransaction(id: string) {
  await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canDeleteTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const transactionsColl = await getCollection<Transaction>("transactions")

  const tx = await transactionsColl.findOne({ _id: new ObjectId(id), ...getScopeFilter(scope) })
  if (!tx) throw new Error("Transaction not found")

  // Check if linked to a bill instance
  try {
    const billColl = await getCollection<BillInstance>("bill_instances")
    const bill = await billColl.findOne({ transactionId: tx._id.toString() })
    if (bill) {
      await billColl.deleteOne({ _id: bill._id })
    }
  } catch (err) {
    console.error("Failed to process bill deletion side effects:", err)
  }

  // Revert balance change
  if (tx.type !== "transfer") {
    const balanceRevert = tx.type === "income" ? -tx.amount : tx.amount
    await updateWalletBalance(scope, tx.walletId, balanceRevert)

    // Revert goal balance if linked to a goal
    if (tx.goalId) {
      try {
        const goalsColl = await getCollection<any>("goals")
        await goalsColl.updateOne(
          { _id: new ObjectId(tx.goalId), ...getScopeFilter(scope) },
          {
            $inc: { currentAmount: -tx.amount, version: 1 },
            $set: { updatedAt: new Date(), updatedBy: scope.userId }
          }
        )
        updateTag("goals")
        revalidatePath("/goals")
      } catch (err) {
        console.error("Failed to revert goal balance:", err)
      }
    }

    await transactionsColl.deleteOne({ _id: tx._id, ...getScopeFilter(scope) })
  } else {
    // Revert debit wallet
    if (tx.transferType === "debit") {
      await updateWalletBalance(scope, tx.walletId, tx.amount)
      
      // Delete linked credit transaction and revert target balance
      if (tx.linkedTransactionId) {
        const linkedOid = new ObjectId(tx.linkedTransactionId)
        const linkedTx = await transactionsColl.findOne({ _id: linkedOid, ...getScopeFilter(scope) })
        if (linkedTx) {
          await updateWalletBalance(scope, linkedTx.walletId, -linkedTx.amount)
          await transactionsColl.deleteOne({ _id: linkedOid, ...getScopeFilter(scope) })
        }
      }
      await transactionsColl.deleteOne({ _id: tx._id, ...getScopeFilter(scope) })
    } else {
      // Revert credit wallet
      await updateWalletBalance(scope, tx.walletId, -tx.amount)

      // Delete linked debit transaction and revert source balance
      if (tx.linkedTransactionId) {
        const linkedOid = new ObjectId(tx.linkedTransactionId)
        const linkedTx = await transactionsColl.findOne({ _id: linkedOid, ...getScopeFilter(scope) })
        if (linkedTx) {
          await updateWalletBalance(scope, linkedTx.walletId, linkedTx.amount)
          await transactionsColl.deleteOne({ _id: linkedOid, ...getScopeFilter(scope) })
        }
      }
      await transactionsColl.deleteOne({ _id: tx._id, ...getScopeFilter(scope) })
    }
  }

  // Call loan hook
  try {
    const { handleTransactionDeletedHook } = await import("@/lib/actions/loans")
    await handleTransactionDeletedHook(id, scope)
  } catch (err) {
    console.error("Failed to run loan delete hook:", err)
  }

  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${tx.walletId}`)
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateTransaction(id: string, input: TransactionInput) {
  try {
    await requireApprovedUser()
    const validationResult = transactionSchema.safeParse(input)
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message }
    }
    const validated = validationResult.data

    const scope = await getFinancialScope()
    if (scope.isOrganization) {
      const member = await db.collection("member").findOne({
        userId: scope.userId,
        organizationId: scope.organizationId,
      })
      const role = (member?.role as Role) || "member"
      if (!canEditTransactions(role)) {
        return { success: false, error: "Unauthorized" }
      }
    }

  const walletsColl = await getCollection<Wallet>("wallets")
  const transactionsColl = await getCollection<Transaction>("transactions")
  const txOid = new ObjectId(id)

  // 1. Verify existence and retrieve details of the old transaction
  const tx = await transactionsColl.findOne({ _id: txOid, ...getScopeFilter(scope) })
  if (!tx) throw new Error("Transaction not found")

  // Verify that the new source wallet exists and belongs to the active scope
  const sourceWallet = await walletsColl.findOne({ _id: new ObjectId(validated.walletId), ...getScopeFilter(scope) })
  if (!sourceWallet) throw new Error("Source wallet not found")

  // 2. Revert the balance impact of the old transaction
  if (tx.type !== "transfer") {
    const balanceRevert = tx.type === "income" ? -tx.amount : tx.amount
    await updateWalletBalance(scope, tx.walletId, balanceRevert)
  } else {
    // Transfer: revert both wallets
    if (tx.transferType === "debit") {
      await updateWalletBalance(scope, tx.walletId, tx.amount)
      if (tx.linkedTransactionId) {
        const linkedOid = new ObjectId(tx.linkedTransactionId)
        const linkedTx = await transactionsColl.findOne({ _id: linkedOid, ...getScopeFilter(scope) })
        if (linkedTx) {
          await updateWalletBalance(scope, linkedTx.walletId, -linkedTx.amount)
        }
      }
    } else {
      await updateWalletBalance(scope, tx.walletId, -tx.amount)
      if (tx.linkedTransactionId) {
        const linkedOid = new ObjectId(tx.linkedTransactionId)
        const linkedTx = await transactionsColl.findOne({ _id: linkedOid, ...getScopeFilter(scope) })
        if (linkedTx) {
          await updateWalletBalance(scope, linkedTx.walletId, linkedTx.amount)
        }
      }
    }
  }

  // 3. Apply updates in-place based on the new transaction type
  if (validated.type !== "transfer") {
    // If it was a transfer before, clean up the linked transaction
    if (tx.type === "transfer" && tx.linkedTransactionId) {
      const linkedOid = new ObjectId(tx.linkedTransactionId)
      await transactionsColl.deleteOne({ _id: linkedOid, ...getScopeFilter(scope) })
    }

    const hasSplits = validated.splits && validated.splits.length > 0
    const processedSplits = validated.splits?.map(split => ({
      id: split.id || generateSplitId(),
      categoryId: split.categoryId,
      amount: split.amount,
      percentage: split.percentage,
      notes: split.notes,
    }))

    // Update the main transaction document
    await transactionsColl.updateOne(
      { _id: txOid },
      {
        $set: {
          walletId: validated.walletId,
          categoryId: hasSplits ? null : (validated.categoryId || null),
          type: validated.type,
          amount: validated.amount,
          currency: sourceWallet.currency, // Force currency to match the source wallet
          description: validated.description,
          notes: validated.notes || undefined,
          date: validated.date,
          tags: validated.tags || [],
          isRecurring: validated.isRecurring || false,
          isFlagged: validated.isFlagged || false,
          needsReview: validated.needsReview || false,
          ...(hasSplits ? { splitMode: validated.splitMode || "amount", splits: processedSplits } : {}),
          updatedAt: new Date(),
          updatedBy: scope.userId,
        },
        $unset: {
          linkedTransactionId: "",
          transferType: "",
          ...(!hasSplits ? { splitMode: "", splits: "" } : {}),
        },
        $inc: { version: 1 }
      }
    )

    // Apply the new balance impact
    const balanceChange = validated.type === "income" ? validated.amount : -validated.amount
    await updateWalletBalance(scope, validated.walletId, balanceChange)
  } else {
    // It is a transfer
    if (!validated.targetWalletId) throw new Error("Target wallet is required for transfers")

    // Determine target amount and target currency
    const targetWallet = await walletsColl.findOne({ _id: new ObjectId(validated.targetWalletId), ...getScopeFilter(scope) })
    if (!targetWallet) throw new Error("Target wallet not found")
    const targetAmount = await convertCurrency(validated.amount, sourceWallet.currency, targetWallet.currency)

    // Resolve the linked transaction ID (reuse if existing, otherwise generate a new one)
    const linkedOid = tx.linkedTransactionId ? new ObjectId(tx.linkedTransactionId) : new ObjectId()
    const linkedTx = tx.linkedTransactionId
      ? await transactionsColl.findOne({ _id: linkedOid, ...getScopeFilter(scope) })
      : null

    // Upsert the linked credit transaction
    const creditTx: Transaction = {
      _id: linkedOid,
      userId: linkedTx?.userId || tx.userId || scope.userId,
      organizationId: scope.organizationId,
      ownerUserId: linkedTx?.ownerUserId || tx.ownerUserId || scope.userId,
      createdBy: linkedTx?.createdBy || tx.createdBy || scope.userId,
      updatedBy: scope.userId,
      walletId: validated.targetWalletId,
      categoryId: validated.categoryId,
      type: "transfer",
      transferType: "credit",
      amount: targetAmount,
      currency: targetWallet.currency,
      description: validated.description,
      notes: validated.notes || undefined,
      date: validated.date,
      tags: validated.tags || [],
      isRecurring: validated.isRecurring || false,
      isFlagged: validated.isFlagged || false,
      needsReview: validated.needsReview || false,
      linkedTransactionId: txOid.toString(),
      createdAt: linkedTx?.createdAt || tx.createdAt || new Date(),
      updatedAt: new Date(),
      version: linkedTx?.version ? linkedTx.version + 1 : 1,
    }
    await transactionsColl.replaceOne({ _id: linkedOid }, creditTx, { upsert: true })

    // Update the main debit transaction
    await transactionsColl.updateOne(
      { _id: txOid },
      {
        $set: {
          walletId: validated.walletId,
          categoryId: validated.categoryId,
          type: "transfer",
          transferType: "debit",
          amount: validated.amount,
          currency: sourceWallet.currency, // Force currency to match the source wallet
          description: validated.description,
          notes: validated.notes || undefined,
          date: validated.date,
          tags: validated.tags || [],
          isRecurring: validated.isRecurring || false,
          isFlagged: validated.isFlagged || false,
          needsReview: validated.needsReview || false,
          linkedTransactionId: linkedOid.toString(),
          updatedAt: new Date(),
          updatedBy: scope.userId,
        },
        $inc: { version: 1 }
      }
    )

    // Apply the new balance impact to both wallets
    await updateWalletBalance(scope, validated.walletId, -validated.amount)
    await updateWalletBalance(scope, validated.targetWalletId, targetAmount)
  }

  // Call loan hook
  try {
    const { handleTransactionUpdatedHook } = await import("@/lib/actions/loans")
    await handleTransactionUpdatedHook(id, validated.amount, validated.walletId, validated.date, scope)
  } catch (err) {
    console.error("Failed to run loan update hook:", err)
  }

  updateTag("transactions")
  updateTag("wallets")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${tx.walletId}`)
  if (validated.walletId !== tx.walletId) {
    revalidatePath(`/wallets/${validated.walletId}`)
  }
  revalidatePath("/", "layout")

  return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update transaction." }
  }
}

export async function getTransactionWalletId(id: string): Promise<string | null> {
  await requireApprovedUser()
  const scope = await getFinancialScope()
  const transactionsColl = await getCollection<Transaction>("transactions")
  const tx = await transactionsColl.findOne({ _id: new ObjectId(id), ...getScopeFilter(scope) })
  return tx ? tx.walletId : null
}

// Helper to apply automation rules to scanned receipt data
async function applyRulesToScannedData(data: {
  merchant: string
  amount: number
  date: Date
  categoryName: string
  currency: string
  description: string
}, scope: FinancialScope) {
  try {
    const rulesColl = await getCollection<AutomationRule>("automation_rules")
    const activeRules = await rulesColl.find({ ...getScopeFilter(scope), status: "active" }).toArray()
    if (activeRules.length === 0) return data

    const categoriesColl = await getCollection<Category>("categories")
    const categories = await categoriesColl.find({
      $or: [getScopeFilter(scope), { userId: null }]
    }).toArray()

    const currentCategory = categories.find(c => c.name.toLowerCase() === data.categoryName.toLowerCase())
    const currentCategoryId = currentCategory ? currentCategory._id.toString() : categories[0]._id.toString()

    const result = executeAutomationRules(
      {
        description: data.merchant || data.description,
        amount: data.amount,
        currency: data.currency,
        categoryId: currentCategoryId,
        date: data.date
      },
      activeRules,
      { trigger: "receipt" }
    )

    const mod = result.modifiedTransaction

    let finalCategoryName = data.categoryName
    if (mod.categoryId !== currentCategoryId && mod.categoryId) {
      const newCategory = categories.find(c => c._id.toString() === mod.categoryId)
      if (newCategory) {
        finalCategoryName = newCategory.name
      }
    }

    return {
      ...data,
      merchant: mod.description || data.merchant,
      amount: mod.amount || data.amount,
      categoryName: finalCategoryName,
      currency: mod.currency || data.currency,
      description: mod.description || data.description
    }
  } catch (err) {
    console.error("Error applying rules to scanned receipt data:", err)
    return data
  }
}

export async function scanReceiptAction(base64Image: string, filename: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  // Delay helper to simulate network/processing time
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const lowerName = filename.toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawData: any = null

  // Case 1: Check for Gemini API key
  if (process.env.GEMINI_API_KEY) {
    try {
      // Clean base64 header if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Analyze this receipt image and return a JSON object. The JSON must contain these exact fields: merchant (string), amount (integer in cents, e.g. 10.50 is 1050), date (ISO date string YYYY-MM-DD), categoryName (string matching one of: Food & Dining, Transport, Housing, Utilities, Healthcare, Entertainment, Shopping, Education, Travel, Personal Care, Subscriptions, Other), currency (3-letter ISO code e.g. USD, EUR, INR), and description (string). Return ONLY raw JSON, do not wrap in markdown code blocks.",
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const result = await response.json()
      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (textResponse) {
        const parsed = JSON.parse(textResponse.trim())
        rawData = {
          merchant: parsed.merchant || "Unknown Merchant",
          amount: typeof parsed.amount === "number" ? parsed.amount : 0,
          date: parsed.date ? new Date(parsed.date) : new Date(),
          categoryName: parsed.categoryName || "Other",
          currency: parsed.currency || "USD",
          description: parsed.description || "AI Scanned Receipt",
        }
      }
    } catch (err) {
      console.error("AI Receipt Scan error, falling back to simulation:", err)
    }
  }

  // Case 2: Simulation fallback (highly interactive and deterministic for testing)
  if (!rawData) {
    await delay(1800) // Simulate processing time

    if (lowerName.includes("coffee") || lowerName.includes("starbucks")) {
      rawData = {
        merchant: "Starbucks Coffee",
        amount: 1450, // $14.50
        date: new Date(),
        categoryName: "Food & Dining",
        currency: "USD",
        description: "Caramel Macchiato & Croissant",
      }
    } else if (lowerName.includes("grocery") || lowerName.includes("walmart") || lowerName.includes("food")) {
      rawData = {
        merchant: "Walmart Supercenter",
        amount: 8420, // $84.20
        date: new Date(),
        categoryName: "Food & Dining",
        currency: "USD",
        description: "Weekly Household Groceries",
      }
    } else if (lowerName.includes("flight") || lowerName.includes("delta") || lowerName.includes("travel")) {
      rawData = {
        merchant: "Delta Air Lines",
        amount: 35000, // $350.00
        date: new Date(),
        categoryName: "Travel",
        currency: "USD",
        description: "Flight Ticket NYC to LAX",
      }
    } else if (lowerName.includes("netflix") || lowerName.includes("subscription")) {
      rawData = {
        merchant: "Netflix Inc.",
        amount: 1549, // $15.49
        date: new Date(),
        categoryName: "Subscriptions",
        currency: "USD",
        description: "Premium Streaming Subscription",
      }
    } else {
      // Random generic fallback
      const randomAmount = Math.round((Math.random() * 45 + 5) * 100)
      rawData = {
        merchant: "Local Retailer Store",
        amount: randomAmount,
        date: new Date(),
        categoryName: "Shopping",
        currency: "USD",
        description: "Miscellaneous retail purchase",
      }
    }
  }

  if (rawData) {
    const finalData = await applyRulesToScannedData(rawData, scope)
    return { success: true, data: finalData }
  }

  return { success: false, error: "Failed to parse receipt data" }
}

export interface ImportedTransactionInput {
  categoryId?: string
  categoryName?: string
  type: "income" | "expense"
  amount: number
  description?: string
  notes?: string
  date?: string | Date
  tags?: string[]
}

export async function importTransactionsAction(walletId: string, transactionsList: ImportedTransactionInput[]) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canCreateTransactions(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const walletsColl = await getCollection<Wallet>("wallets")
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categoriesColl = await getCollection<Category>("categories")
  const rulesColl = await getCollection<AutomationRule>("automation_rules")

  // Verify wallet exists
  const wallet = await walletsColl.findOne({ _id: new ObjectId(walletId), ...getScopeFilter(scope) })
  if (!wallet) throw new Error("Wallet not found")

  // Get all user and default categories to match against
  const categories = await categoriesColl.find({
    $or: [getScopeFilter(scope), { userId: null }]
  }).toArray()

  const defaultCategory = categories.find(c => c.name === "Other") || categories[0]
  const defaultCategoryId = defaultCategory ? defaultCategory._id.toString() : new ObjectId().toString()

  // Load active automation rules
  const activeRules = await rulesColl.find({ ...getScopeFilter(scope), status: "active" }).toArray()

  const documentsToInsert: Transaction[] = []
  const walletBalanceAdjustments: Record<string, number> = {}

  // Track rule stats to update in bulk
  const ruleMatchedCounts: Record<string, number> = {}

  for (const item of transactionsList) {
    let resolvedCategoryId = item.categoryId

    // Try to resolve category by name if ID not provided
    if (!resolvedCategoryId && item.categoryName) {
      const categoryNameLower = item.categoryName.toLowerCase()
      const match = categories.find(
        c => c.name.toLowerCase() === categoryNameLower
      )
      resolvedCategoryId = match ? match._id.toString() : defaultCategoryId
    } else if (!resolvedCategoryId) {
      resolvedCategoryId = defaultCategoryId
    }

    const type = item.type === "income" ? "income" : "expense"
    const amount = Math.abs(Math.round(item.amount))

    // Run rules engine
    const engineResult = executeAutomationRules(
      {
        walletId,
        categoryId: resolvedCategoryId,
        type,
        amount,
        currency: wallet.currency,
        description: item.description || "Imported Transaction",
        notes: item.notes || "Imported via CSV Wizard",
        tags: item.tags || ["imported"],
      },
      activeRules,
      { trigger: "csv_import", wallet }
    )

    const modTx = engineResult.modifiedTransaction

    // Record stats
    if (engineResult.matchedRulesCount > 0) {
      for (const ar of engineResult.appliedRules) {
        ruleMatchedCounts[ar.ruleId] = (ruleMatchedCounts[ar.ruleId] || 0) + 1
      }
    }

    // Resolve wallet swaps
    let finalWalletId = modTx.walletId || walletId
    let finalAmount = modTx.amount || amount
    let finalCurrency = modTx.currency || wallet.currency

    if (finalWalletId !== walletId) {
      const targetWallet = await walletsColl.findOne({ _id: new ObjectId(finalWalletId), ...getScopeFilter(scope) })
      if (targetWallet) {
        finalCurrency = targetWallet.currency
        finalAmount = await convertCurrency(amount, wallet.currency, targetWallet.currency)
      } else {
        finalWalletId = walletId
      }
    }

    // Accumulate wallet balance changes
    const change = modTx.type === "income" ? finalAmount : -finalAmount
    walletBalanceAdjustments[finalWalletId] = (walletBalanceAdjustments[finalWalletId] || 0) + change

    const hasSplits = modTx.splits && modTx.splits.length > 0
    const processedSplits = modTx.splits?.map(split => ({
      id: split.id || generateSplitId(),
      categoryId: split.categoryId,
      amount: split.amount,
      percentage: split.percentage,
      notes: split.notes,
    }))

    const tx: Transaction = {
      _id: new ObjectId(),
      userId: scope.userId,
      organizationId: scope.organizationId,
      ownerUserId: scope.userId,
      createdBy: scope.userId,
      updatedBy: scope.userId,
      walletId: finalWalletId,
      categoryId: hasSplits ? null : (modTx.categoryId || resolvedCategoryId),
      type: modTx.type as "income" | "expense",
      amount: finalAmount,
      currency: finalCurrency,
      description: modTx.description || item.description || "Imported Transaction",
      notes: modTx.notes || item.notes || "Imported via CSV Wizard",
      date: item.date ? new Date(item.date) : new Date(),
      tags: modTx.tags || ["imported"],
      isRecurring: modTx.isRecurring || false,
      budgetId: modTx.budgetId || undefined,
      isFlagged: modTx.isFlagged || false,
      needsReview: modTx.needsReview || false,
      splitMode: hasSplits ? "amount" : undefined,
      splits: processedSplits,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    }

    documentsToInsert.push(tx)
  }

  if (documentsToInsert.length > 0) {
    // 1. Insert all transactions
    await transactionsColl.insertMany(documentsToInsert)

    // 2. Perform bulk wallet balance updates
    const walletBulkOps = Object.entries(walletBalanceAdjustments).map(([wId, change]) => ({
      updateOne: {
        filter: { _id: new ObjectId(wId), ...getScopeFilter(scope) },
        update: {
          $inc: { balance: change, version: 1 },
          $set: { updatedAt: new Date(), updatedBy: scope.userId }
        }
      }
    }))
    if (walletBulkOps.length > 0) {
      await walletsColl.bulkWrite(walletBulkOps)
    }

    // 3. Batch stats updates in bulk
    if (Object.keys(ruleMatchedCounts).length > 0) {
      const ruleBulkOps = Object.entries(ruleMatchedCounts).map(([ruleId, count]) => ({
        updateOne: {
          filter: { _id: new ObjectId(ruleId) },
          update: {
            $inc: { executionCount: count },
            $set: { lastExecutedAt: new Date(), lastMatchedAt: new Date() }
          }
        }
      }))
      await rulesColl.bulkWrite(ruleBulkOps)
    }
  }

  updateTag("transactions")
  updateTag("wallets")
  updateTag("automation-rules")
  revalidatePath("/transactions")
  revalidatePath(`/wallets/${walletId}`)
  revalidatePath("/", "layout")

  return { success: true, count: documentsToInsert.length }
}

