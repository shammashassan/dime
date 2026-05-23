import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Wallet, Transaction } from "@/types"

export const getWallets = cache(async (userId: string): Promise<Wallet[]> => {
  const walletsColl = await getCollection<Wallet>("wallets")
  return walletsColl.find({ userId, isArchived: false }).sort({ name: 1 }).toArray()
})

export const getAllWalletsIncludingArchived = cache(async (userId: string): Promise<Wallet[]> => {
  const walletsColl = await getCollection<Wallet>("wallets")
  return walletsColl.find({ userId }).sort({ isArchived: 1, name: 1 }).toArray()
})

export const getWalletById = cache(async (userId: string, walletId: string): Promise<Wallet | null> => {
  try {
    const walletsColl = await getCollection<Wallet>("wallets")
    return walletsColl.findOne({ _id: new ObjectId(walletId), userId })
  } catch (err) {
    return null
  }
})

export const getSingleWalletBalanceHistory = cache(async (userId: string, walletId: string, monthsCount: number = 6) => {
  const walletsColl = await getCollection<Wallet>("wallets")
  const wallet = await walletsColl.findOne({ _id: new ObjectId(walletId), userId })
  if (!wallet) return []

  const transactionsColl = await getCollection<Transaction>("transactions")
  const { endOfMonth, subMonths, startOfMonth, format } = require("date-fns")

  // Generate month end dates
  const months: Date[] = []
  for (let i = 0; i < monthsCount; i++) {
    months.push(endOfMonth(subMonths(new Date(), i)))
  }
  months.sort((a, b) => a.getTime() - b.getTime())

  const oldestStartDate = startOfMonth(subMonths(new Date(), monthsCount - 1))
  const transactions = await transactionsColl.find({
    userId,
    walletId,
    date: { $gte: oldestStartDate },
  }).sort({ date: -1 }).toArray()

  let currentBalance = wallet.balance
  const recordedBalances: Record<string, number> = {}
  let txIndex = 0

  const reverseMonths = [...months].reverse()

  reverseMonths.forEach((monthEnd: Date) => {
    while (txIndex < transactions.length && transactions[txIndex].date > monthEnd) {
      const tx = transactions[txIndex]
      if (tx.type === "expense") {
        currentBalance += tx.amount
      } else if (tx.type === "income") {
        currentBalance -= tx.amount
      } else if (tx.type === "transfer") {
        if (tx.transferType === "debit") {
          currentBalance += tx.amount
        } else if (tx.transferType === "credit") {
          currentBalance -= tx.amount
        }
      }
      txIndex++
    }
    recordedBalances[monthEnd.getTime().toString()] = currentBalance
  })

  return months.map((monthEnd) => ({
    month: format(monthEnd, "MMM yy"),
    balance: (recordedBalances[monthEnd.getTime().toString()] || 0) / 100,
  }))
})

export const getSingleWalletBalanceDailyHistory = cache(async (userId: string, walletId: string, daysCount: number = 90) => {
  const walletsColl = await getCollection<Wallet>("wallets")
  const wallet = await walletsColl.findOne({ _id: new ObjectId(walletId), userId })
  if (!wallet) return []

  const transactionsColl = await getCollection<Transaction>("transactions")
  const { endOfDay, subDays, startOfDay, format } = require("date-fns")

  // Generate day end dates
  const days: Date[] = []
  for (let i = 0; i < daysCount; i++) {
    days.push(endOfDay(subDays(new Date(), i)))
  }
  days.sort((a, b) => a.getTime() - b.getTime())

  const oldestStartDate = startOfDay(subDays(new Date(), daysCount - 1))
  const transactions = await transactionsColl.find({
    userId,
    walletId,
    date: { $gte: oldestStartDate },
  }).sort({ date: -1 }).toArray()

  let currentBalance = wallet.balance
  const recordedBalances: Record<string, number> = {}
  let txIndex = 0

  const reverseDays = [...days].reverse()

  reverseDays.forEach((dayEnd: Date) => {
    while (txIndex < transactions.length && transactions[txIndex].date > dayEnd) {
      const tx = transactions[txIndex]
      if (tx.type === "expense") {
        currentBalance += tx.amount
      } else if (tx.type === "income") {
        currentBalance -= tx.amount
      } else if (tx.type === "transfer") {
        if (tx.transferType === "debit") {
          currentBalance += tx.amount
        } else if (tx.transferType === "credit") {
          currentBalance -= tx.amount
        }
      }
      txIndex++
    }
    recordedBalances[dayEnd.getTime().toString()] = currentBalance
  })

  return days.map((dayEnd) => ({
    date: format(dayEnd, "yyyy-MM-dd"),
    balance: (recordedBalances[dayEnd.getTime().toString()] || 0) / 100,
  }))
})

