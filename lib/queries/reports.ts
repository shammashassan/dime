import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getWallets } from "./wallets"
import { getCategories } from "./categories"
import { getActiveBudgets } from "./budgets"
import { getPreferences } from "./preferences"
import { getCurrencyConverter } from "@/lib/currency"
import { Transaction, Budget, Category, Wallet } from "@/types"
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns"


// 1. Income vs Expense Trend: Area (dual-line) - 3 / 6 / 12 months
export const getIncomeExpenseTrend = cache(async (userId: string, monthsCount: number = 6) => {
  const transactionsColl = await getCollection<Transaction>("transactions")
  const startDate = startOfMonth(subMonths(new Date(), monthsCount - 1))

  const transactions = await transactionsColl.find({
    userId,
    date: { $gte: startDate },
    type: { $in: ["income", "expense", "transfer"] },
  }).sort({ date: 1 }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  // Initialize month maps
  const monthlyData: Record<string, { month: string; income: number; expense: number }> = {}
  for (let i = 0; i < monthsCount; i++) {
    const d = subMonths(new Date(), i)
    const key = format(d, "yyyy-MM")
    const label = format(d, "MMM yy")
    monthlyData[key] = { month: label, income: 0, expense: 0 }
  }

  transactions.forEach((tx) => {
    const key = format(tx.date, "yyyy-MM")
    if (monthlyData[key]) {
      const convertedAmount = convert(tx.amount, tx.currency)
      if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
        monthlyData[key].income += convertedAmount
      } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
        monthlyData[key].expense += convertedAmount
      }
    }
  })

  // Return in chronological order
  return Object.keys(monthlyData)
    .sort()
    .map((key) => ({
      month: monthlyData[key].month,
      income: monthlyData[key].income / 100, // Convert cents to standard units
      expense: monthlyData[key].expense / 100,
    }))
})

// 1b. Daily Income vs Expense Trend for Dashboard (last 90 days)
export const getDailyIncomeExpenseTrend = cache(async (userId: string) => {
  const transactionsColl = await getCollection<Transaction>("transactions")
  const startDate = startOfDay(subDays(new Date(), 90))

  const transactions = await transactionsColl.find({
    userId,
    date: { $gte: startDate },
    type: { $in: ["income", "expense", "transfer"] },
  }).sort({ date: 1 }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  // Initialize day maps for the last 90 days
  const dailyData: Record<string, { date: string; income: number; expense: number }> = {}
  for (let i = 0; i <= 90; i++) {
    const d = subDays(new Date(), i)
    const key = format(d, "yyyy-MM-dd")
    dailyData[key] = { date: key, income: 0, expense: 0 }
  }

  transactions.forEach((tx) => {
    const key = format(tx.date, "yyyy-MM-dd")
    if (dailyData[key]) {
      const convertedAmount = convert(tx.amount, tx.currency)
      if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
        dailyData[key].income += convertedAmount
      } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
        dailyData[key].expense += convertedAmount
      }
    }
  })

  // Return in chronological order
  return Object.keys(dailyData)
    .sort()
    .map((key) => ({
      date: dailyData[key].date,
      income: dailyData[key].income / 100, // Convert cents to standard units
      expense: dailyData[key].expense / 100,
    }))
})

// 2. Category Breakdown: Pie - Current month / custom range
export const getCategoryBreakdown = cache(async (userId: string, start?: Date, end?: Date) => {
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categories = await getCategories(userId)

  const startDate = start || startOfMonth(new Date())
  const endDate = end || endOfMonth(new Date())

  const transactions = await transactionsColl.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
    type: { $in: ["expense", "transfer"] },
  }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  const categoryMap = new Map<string, Category>()
  categories.forEach((cat) => categoryMap.set(cat._id.toString(), cat))

  const breakdown: Record<string, { category: string; value: number; color: string; icon: string }> = {}

  transactions.forEach((tx) => {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const convertedAmount = convert(tx.amount, tx.currency)
      const catId = tx.categoryId
      const cat = categoryMap.get(catId)
      const catName = cat ? cat.name : "Uncategorized"
      const catColor = cat ? cat.color : "#94a3b8"
      const catIcon = cat ? cat.icon : "HelpCircle"

      if (!breakdown[catName]) {
        breakdown[catName] = { category: catName, value: 0, color: catColor, icon: catIcon }
      }
      breakdown[catName].value += convertedAmount
    }
  })

  return Object.values(breakdown).map((item) => ({
    ...item,
    value: item.value / 100, // Convert cents to standard units
  }))
})

// 3. Spending by Day of Week: Bar - Last 30 days
export const getSpendingByDayOfWeek = cache(async (userId: string) => {
  const transactionsColl = await getCollection<Transaction>("transactions")
  const startDate = subDays(new Date(), 30)

  const transactions = await transactionsColl.find({
    userId,
    date: { $gte: startDate },
    type: { $in: ["expense", "transfer"] },
  }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayData = days.map((day) => ({ day, amount: 0 }))

  transactions.forEach((tx) => {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const convertedAmount = convert(tx.amount, tx.currency)
      const dayIndex = tx.date.getDay() // 0 = Sunday, 1 = Monday, etc.
      dayData[dayIndex].amount += convertedAmount
    }
  })

  return dayData.map((item) => ({
    day: item.day,
    amount: item.amount / 100,
  }))
})

// 4. Wallet Balance History: Multi-line - 3 / 6 / 12 months
export const getWalletBalanceHistory = cache(async (userId: string, monthsCount: number = 6) => {
  const wallets = await getWallets(userId)
  const transactionsColl = await getCollection<Transaction>("transactions")

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const walletCurrencies = wallets.map(w => w.currency)
  const convert = await getCurrencyConverter(targetCurrency, walletCurrencies)

  // We want to reconstruct end-of-month balances for the last N months
  // We'll generate the month end dates
  const months: Date[] = []
  for (let i = 0; i < monthsCount; i++) {
    months.push(endOfMonth(subMonths(new Date(), i)))
  }
  months.sort((a, b) => a.getTime() - b.getTime()) // Chronological order

  // Fetch all transactions after the oldest month's start, to backtrack
  const oldestStartDate = startOfMonth(subMonths(new Date(), monthsCount - 1))
  const transactions = await transactionsColl.find({
    userId,
    date: { $gte: oldestStartDate },
  }).sort({ date: -1 }).toArray() // Descending order for backtracking

  // Create current balance states
  const currentBalances: Record<string, number> = {}
  wallets.forEach((w) => {
    currentBalances[w._id.toString()] = w.balance
  })

  // Copy current balances
  const balances = { ...currentBalances }
  let txIndex = 0

  // We backtrack month-by-month (from latest month to oldest)
  // Wait, let's backtrack from latest to oldest, recording balances along the way.
  // Actually, we can backtrack chronological-reverse:
  // e.g. End of Month 3 (May), End of Month 2 (April), End of Month 1 (March).
  // Current time is past the end of May.
  // First, we backtrack from "now" to end of May: undo all transactions after end of May.
  // Then we record May's balance.
  // Then we backtrack from end of May to end of April: undo transactions between end of April and end of May.
  // Then we record April's balance.
  // And so on.

  const reverseMonths = [...months].reverse() // [May 31, Apr 30, Mar 31]
  const recordedBalances: Record<string, Record<string, number>> = {}

  reverseMonths.forEach((monthEnd) => {
    // Undo transactions that happened AFTER monthEnd
    while (txIndex < transactions.length && transactions[txIndex].date > monthEnd) {
      const tx = transactions[txIndex]
      const wId = tx.walletId
      
      if (balances[wId] !== undefined) {
        if (tx.type === "expense") {
          balances[wId] += tx.amount // Undo expense by adding it back
        } else if (tx.type === "income") {
          balances[wId] -= tx.amount // Undo income by subtracting it
        } else if (tx.type === "transfer") {
          if (tx.transferType === "debit") {
            balances[wId] += tx.amount // Undo debit by adding it back
          } else if (tx.transferType === "credit") {
            balances[wId] -= tx.amount // Undo credit by subtracting it
          }
        }
      }
      txIndex++
    }

    // Record the balance at this monthEnd
    recordedBalances[monthEnd.getTime().toString()] = { ...balances }
  })

  // Format into final history array (chronological order)
  return months.map((monthEnd) => {
    const data: Record<string, string | number> = {
      month: format(monthEnd, "MMM yy"),
    }
    const monthBalances = recordedBalances[monthEnd.getTime().toString()] || {}
    wallets.forEach((w) => {
      const originalBalance = monthBalances[w._id.toString()] || 0
      const convertedBalance = convert(originalBalance, w.currency)
      data[w.name] = convertedBalance / 100
    })
    return data
  })
})

// 5. Monthly Net Savings: Pos/neg bar - Last 12 months
export const getMonthlyNetSavings = cache(async (userId: string) => {
  const transactionsColl = await getCollection<Transaction>("transactions")
  const startDate = startOfMonth(subMonths(new Date(), 11))

  const transactions = await transactionsColl.find({
    userId,
    date: { $gte: startDate },
    type: { $in: ["income", "expense", "transfer"] },
  }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  const monthlyData: Record<string, { month: string; income: number; expense: number }> = {}
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i)
    const key = format(d, "yyyy-MM")
    const label = format(d, "MMM yy")
    monthlyData[key] = { month: label, income: 0, expense: 0 }
  }

  transactions.forEach((tx) => {
    const key = format(tx.date, "yyyy-MM")
    if (monthlyData[key]) {
      const convertedAmount = convert(tx.amount, tx.currency)
      if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
        monthlyData[key].income += convertedAmount
      } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
        monthlyData[key].expense += convertedAmount
      }
    }
  })

  return Object.keys(monthlyData)
    .sort()
    .map((key) => {
      const savings = (monthlyData[key].income - monthlyData[key].expense) / 100
      return {
        month: monthlyData[key].month,
        savings,
      }
    })
})

// 6. Budget Performance: Grouped bar - Current period
export const getBudgetPerformance = cache(async (userId: string) => {
  const activeBudgets = await getActiveBudgets(userId)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categories = await getCategories(userId)

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"

  const categoryMap = new Map<string, Category>()
  categories.forEach((cat) => categoryMap.set(cat._id.toString(), cat))

  // For each budget, compute actual spending in its current period
  const performanceData = await Promise.all(
    activeBudgets.map(async (budget) => {
      const cat = categoryMap.get(budget.categoryId)
      const catName = cat ? cat.name : "Category"

      // Budget period dates
      const start = budget.startDate

      // Find transactions in the category under the budget's duration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {
        userId,
        categoryId: budget.categoryId,
        type: { $in: ["expense", "transfer"] },
        date: { $gte: start },
      }
      if (budget.endDate) {
        query.date.$lte = budget.endDate
      }
      if (budget.walletId) {
        query.walletId = budget.walletId
      }

      const txs = await transactionsColl.find(query).toArray()
      const convert = await getCurrencyConverter(budget.currency, txs.map(tx => tx.currency))

      const spent = txs.reduce((sum, tx) => {
        if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
          const convertedAmount = convert(tx.amount, tx.currency)
          return sum + convertedAmount
        }
        return sum
      }, 0)

      // Convert both limit and spent from budget.currency to targetCurrency
      const convertToTarget = await getCurrencyConverter(targetCurrency, [budget.currency])
      const targetLimit = convertToTarget(budget.amount, budget.currency)
      const targetSpent = convertToTarget(spent, budget.currency)

      return {
        name: budget.name,
        category: catName,
        limit: targetLimit / 100,
        spent: targetSpent / 100,
      }
    })
  )

  return performanceData
})
