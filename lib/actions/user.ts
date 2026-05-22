"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { db } from "@/lib/db/client"

export async function deleteUserAccount() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  // 1. Delete application data
  await db.collection("transactions").deleteMany({ userId })
  await db.collection("wallets").deleteMany({ userId })
  await db.collection("budgets").deleteMany({ userId })
  await db.collection("recurring_rules").deleteMany({ userId })
  await db.collection("categories").deleteMany({ userId })
  await db.collection("preferences").deleteMany({ userId })

  // 2. Delete auth data
  await db.collection("twoFactor").deleteMany({ userId })
  await db.collection("passkey").deleteMany({ userId })
  await db.collection("session").deleteMany({ userId })
  await db.collection("account").deleteMany({ userId })
  await db.collection("user").deleteOne({ id: userId })

  return { success: true }
}

export async function getUserExportData() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const transactions = await db.collection("transactions").find({ userId }).toArray()
  const wallets = await db.collection("wallets").find({ userId }).toArray()
  const budgets = await db.collection("budgets").find({ userId }).toArray()
  const categories = await db.collection("categories").find({ $or: [{ userId }, { userId: null }] }).toArray()

  return {
    transactions: transactions.map(t => ({
      ...t,
      _id: t._id.toString(),
      date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString(),
      walletId: t.walletId.toString(),
      categoryId: t.categoryId?.toString() || null,
      transferWalletId: t.transferWalletId?.toString() || null,
    })),
    wallets: wallets.map(w => ({
      ...w,
      _id: w._id.toString(),
    })),
    budgets: budgets.map(b => ({
      ...b,
      _id: b._id.toString(),
      categoryIds: b.categoryIds.map((cId: any) => cId.toString()),
    })),
    categories: categories.map(c => ({
      ...c,
      _id: c._id.toString(),
    })),
  }
}
