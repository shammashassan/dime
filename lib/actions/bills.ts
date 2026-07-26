"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { BillInstance, RecurringRule } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { createTransaction } from "./transactions"

export async function markBillAsPaid(billId: string, actualAmount: number, walletId: string, paidDate: Date) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  const billColl = await getCollection<BillInstance>("bill_instances")
  const ruleColl = await getCollection<RecurringRule>("recurring_rules")

  const bill = await billColl.findOne({ _id: new ObjectId(billId), ...getScopeFilter(scope) })
  if (!bill) throw new Error("Bill instance not found")
  if (bill.status === "paid") throw new Error("Bill is already paid")

  const rule = await ruleColl.findOne({ _id: new ObjectId(bill.ruleId) })
  if (!rule) throw new Error("Parent bill rule not found")

  // Create the actual transaction
  const amountInCents = Math.round(actualAmount * 100)
  const transactionRes = await createTransaction({
    walletId,
    categoryId: rule.categoryId,
    type: rule.type,
    amount: amountInCents,
    currency: rule.currency,
    description: bill.description,
    date: paidDate,
    tags: [...rule.tags, "bill-payment"],
    isRecurring: true,
    recurringId: rule._id.toString()
  })

  if (!transactionRes.success || !transactionRes.id) {
    throw new Error(transactionRes.error || "Failed to create payment transaction")
  }

  // Update BillInstance status
  await billColl.updateOne(
    { _id: new ObjectId(billId) },
    {
      $set: {
        status: "paid",
        actualAmount: amountInCents,
        paidDate: paidDate,
        transactionId: transactionRes.id,
        updatedAt: new Date()
      }
    }
  )

  updateTag("recurring")
  updateTag("transactions")
  revalidatePath("/recurring")
  revalidatePath(`/recurring/${bill.ruleId}`)
  revalidatePath("/transactions")
  revalidatePath("/", "layout")

  return { success: true }
}

export async function deleteBillInstance(billId: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  const billColl = await getCollection<BillInstance>("bill_instances")

  const bill = await billColl.findOne({ _id: new ObjectId(billId), ...getScopeFilter(scope) })
  if (!bill) throw new Error("Bill instance not found")

  // If paid, delete the associated transaction to revert the balance
  if (bill.status === "paid" && bill.transactionId) {
    try {
      const { deleteTransaction } = await import("./transactions")
      await deleteTransaction(bill.transactionId)
    } catch (err) {
      console.error("Failed to delete associated transaction:", err)
    }
  }

  await billColl.deleteOne({ _id: new ObjectId(billId) })

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath(`/recurring/${bill.ruleId}`)
  revalidatePath("/", "layout")

  return { success: true }
}

export async function skipBillInstance(billId: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  const billColl = await getCollection<BillInstance>("bill_instances")

  const bill = await billColl.findOne({ _id: new ObjectId(billId), ...getScopeFilter(scope) })
  if (!bill) throw new Error("Bill instance not found")

  await billColl.updateOne(
    { _id: new ObjectId(billId) },
    {
      $set: {
        status: "skipped",
        updatedAt: new Date()
      }
    }
  )

  updateTag("recurring")
  revalidatePath("/recurring")
  revalidatePath(`/recurring/${bill.ruleId}`)
  revalidatePath("/", "layout")

  return { success: true }
}