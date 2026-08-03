"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { db } from "@/lib/db/client"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

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
  await db.collection("user").deleteMany({ $or: [{ id: userId }, { _id: userId as any }] })

  return { success: true }
}

export async function getUserExportData() {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const transactions = await db.collection("transactions").find(filter).toArray()
  const wallets = await db.collection("wallets").find(filter).toArray()
  const budgets = await db.collection("budgets").find(filter).toArray()
  const categories = await db.collection("categories").find({ $or: [filter, { userId: null }] }).toArray()

  return {
    transactions: transactions.map(t => ({
      ...t,
      _id: t._id ? t._id.toString() : "",
      date: t.date instanceof Date ? t.date.toISOString() : (t.date ? new Date(t.date).toISOString() : new Date().toISOString()),
      walletId: t.walletId ? t.walletId.toString() : "",
      categoryId: t.categoryId ? t.categoryId.toString() : null,
      transferWalletId: (t as any).transferWalletId ? (t as any).transferWalletId.toString() : null,
    })),
    wallets: wallets.map(w => ({
      ...w,
      _id: w._id ? w._id.toString() : "",
    })),
    budgets: budgets.map(b => ({
      ...b,
      _id: b._id ? b._id.toString() : "",
      categoryIds: (b as any).categoryIds
        ? (b as any).categoryIds.map((cId: any) => (cId ? cId.toString() : ""))
        : b.categoryId
        ? [b.categoryId.toString()]
        : [],
    })),
    categories: categories.map(c => ({
      ...c,
      _id: c._id ? c._id.toString() : "",
    })),
  }
}

export async function lookupUserByUsername(username: string) {
  const session = await requireApprovedUser()
  if (!session) throw new Error("Unauthorized")

  if (!username || username.trim().length < 2) return null

  const user = await db.collection("user").findOne({
    username: { $regex: new RegExp(`^${username.trim()}$`, "i") }
  })

  if (!user) return null

  return {
    id: (user.id || user._id?.toString() || "") as string,
    name: user.name as string,
    email: user.email as string,
    username: user.username as string,
    image: (user.image || null) as string | null,
  }
}
