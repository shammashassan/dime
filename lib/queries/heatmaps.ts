import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getPreferences } from "./preferences"
import { getCategories } from "./categories"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getCurrencyConverter } from "@/lib/currency"
import { expandTransactions } from "@/lib/split-utils"
import { Transaction, Category, Wallet } from "@/types"
import {
  assignQuantileLevelsToDays,
  calculateHeatmapHabits,
  type HeatmapDaySummary,
  type HeatmapHabitStats,
  type HeatmapMetric,
  type HeatmapTransactionPreview,
} from "@/lib/calculations/heatmaps"
import {
  subDays,
  formatISO,
  parseISO,
  eachDayOfInterval,
  getYear,
} from "date-fns"

export interface HeatmapFilterOptions {
  timeframe?: string // "trailing-12" | "2026" | "2025" | ...
  metric?: HeatmapMetric // "expense" | "income" | "net" | "count"
  walletId?: string
  categoryId?: string
}

export interface HeatmapViewModel {
  days: HeatmapDaySummary[]
  habits: HeatmapHabitStats
  currency: string
  metric: HeatmapMetric
  timeframe: string
  availableYears: number[]
}

export const getSpendingHeatmapData = cache(
  async (
    userId: string,
    options: HeatmapFilterOptions = {}
  ): Promise<HeatmapViewModel> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const transactionsColl = await getCollection<Transaction>("transactions")

    const metric: HeatmapMetric = options.metric || "expense"
    const timeframe = options.timeframe || "trailing-12"

    const now = new Date()
    const currentYear = now.getUTCFullYear()

    let startDate: Date
    let endDate: Date

    if (timeframe !== "trailing-12" && /^\d{4}$/.test(timeframe)) {
      const year = parseInt(timeframe, 10)
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
      // If selected year is current year, end at today to avoid empty future blocks
      if (year === currentYear) {
        endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
      } else {
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      }
    } else {
      // Trailing 12 months (52 full weeks = 364 days + today)
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 364, 0, 0, 0, 0))
    }

    // Build Mongo query
    const mongoQuery: Record<string, any> = {
      ...filter,
      date: { $gte: startDate, $lte: endDate },
      type: { $in: ["income", "expense", "transfer"] },
    }

    if (options.walletId && options.walletId !== "all") {
      mongoQuery.walletId = options.walletId
    }

    const [rawTransactions, categories, wallets, prefs] = await Promise.all([
      transactionsColl.find(mongoQuery).sort({ date: 1 }).toArray(),
      getCategories(userId),
      getAllWalletsIncludingArchived(userId),
      getPreferences(userId),
    ])

    const targetCurrency = prefs?.defaultCurrency || "USD"
    const currencies = rawTransactions.map((tx) => tx.currency)
    const convert = await getCurrencyConverter(targetCurrency, currencies)

    // Category and Wallet Maps for fast lookup
    const catMap = new Map<string, Category>()
    categories.forEach((cat) => catMap.set(cat._id.toString(), cat))

    const walletMap = new Map<string, Wallet>()
    wallets.forEach((w) => walletMap.set(w._id.toString(), w))

    // Expand split transactions
    const expandedTxs = expandTransactions(rawTransactions)

    // Optional category filter
    const filteredTxs =
      options.categoryId && options.categoryId !== "all"
        ? expandedTxs.filter((tx) => tx.categoryId === options.categoryId)
        : expandedTxs

    // Initialize all dates in the interval
    const intervalDates = eachDayOfInterval({ start: startDate, end: endDate })
    const dayRecords: Record<string, HeatmapDaySummary> = {}

    for (const d of intervalDates) {
      const dateStr = formatISO(d, { representation: "date" })
      dayRecords[dateStr] = {
        date: dateStr,
        expense: 0,
        income: 0,
        net: 0,
        count: 0,
        level: 0,
        transactions: [],
      }
    }

    // Populate day records with transaction data
    for (const tx of filteredTxs) {
      const txDateStr = formatISO(tx.date, { representation: "date" })
      const day = dayRecords[txDateStr]
      if (!day) continue

      const convertedAmount = convert(tx.amount, tx.currency)
      const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined
      const wallet = walletMap.get(tx.walletId)

      const isExpense = tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")
      const isIncome = tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")

      if (isExpense) {
        day.expense += convertedAmount
      } else if (isIncome) {
        day.income += convertedAmount
      }

      day.count++

      const preview: HeatmapTransactionPreview = {
        id: tx._id ? tx._id.toString() : Math.random().toString(),
        description: tx.description || (isExpense ? "Expense" : "Income"),
        amount: convertedAmount,
        currency: targetCurrency,
        type: tx.type,
        categoryName: cat?.name || "Uncategorized",
        categoryColor: cat?.color || "#71717a",
        categoryIcon: cat?.icon || "HelpCircle",
        walletName: wallet?.name || "Wallet",
      }

      day.transactions.push(preview)
    }

    // Finalize net amounts and sort transaction previews descending by amount
    const daysList = Object.values(dayRecords).map((day) => {
      day.net = day.income - day.expense
      day.transactions.sort((a, b) => b.amount - a.amount)
      return day
    })

    // Assign dynamic quantile levels (0..4)
    const daysWithLevels = assignQuantileLevelsToDays(daysList, metric)

    // Calculate habit statistics
    const todayStr = formatISO(now, { representation: "date" })
    const habits = calculateHeatmapHabits(daysWithLevels, todayStr)

    // Discover available years from user's earliest transaction
    const earliestTx = await transactionsColl.findOne(
      { ...filter },
      { sort: { date: 1 }, projection: { date: 1 } }
    )
    const earliestYear = earliestTx ? getYear(earliestTx.date) : currentYear
    const availableYears: number[] = []
    for (let y = currentYear; y >= Math.min(earliestYear, currentYear - 3); y--) {
      availableYears.push(y)
    }

    return {
      days: daysWithLevels,
      habits,
      currency: targetCurrency,
      metric,
      timeframe,
      availableYears,
    }
  }
)
