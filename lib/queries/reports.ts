import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getCategories } from "./categories"
import { getActiveBudgets } from "./budgets"
import { getPreferences } from "./preferences"
import { getCurrencyConverter } from "@/lib/currency"
import { getLoans, getActiveBaseCurrency } from "./loans"
import { getAssetsAndValuationsForScope } from "./assets"
import { calculateNetWorthHistory } from "@/lib/calculations/net-worth"
import { Transaction, Category, LoanRepayment } from "@/types"
import { subDays, subMonths } from "date-fns"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { expandTransactions } from "@/lib/split-utils"


// 1. Income vs Expense Trend: Area (dual-line) - 3 / 6 / 12 months
export const getIncomeExpenseTrend = cache(async (userId: string, monthsCount: number = 6) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const now = new Date()
  
  // Start date in UTC (e.g. 1st day of the starting month)
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsCount - 1), 1, 0, 0, 0, 0))

  const transactions = await transactionsColl.find({
    ...filter,
    date: { $gte: startDate },
    type: { $in: ["income", "expense", "transfer"] },
  }).sort({ date: 1 }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  // Find maximum date to align charts (handles user's local timezone being ahead of server)
  let maxDate = now
  transactions.forEach((tx) => {
    if (tx.date > maxDate) {
      maxDate = tx.date
    }
  })

  // Initialize month maps in UTC
  const monthlyData: Record<string, { month: string; income: number; expense: number }> = {}
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  for (let i = 0; i < monthsCount; i++) {
    // Use the 15th of the month to safely avoid month-end overflows when subtracting
    const d = subMonths(new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 15)), i)
    const key = d.toISOString().slice(0, 7) // "yyyy-MM"
    const label = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear().toString().slice(-2)}`
    monthlyData[key] = { month: label, income: 0, expense: 0 }
  }

  transactions.forEach((tx) => {
    const key = tx.date.toISOString().slice(0, 7)
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
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const now = new Date()
  
  // Fetch a bit extra (95 days) to ensure we cover all timezone boundaries
  const queryStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 95, 0, 0, 0, 0))

  const transactions = await transactionsColl.find({
    ...filter,
    date: { $gte: queryStartDate },
    type: { $in: ["income", "expense", "transfer"] },
  }).sort({ date: 1 }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  // Find maximum date to align charts (handles user's local timezone being ahead of server)
  let maxDate = now
  transactions.forEach((tx) => {
    if (tx.date > maxDate) {
      maxDate = tx.date
    }
  })

  const baseDate = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), maxDate.getUTCDate()))

  // Initialize day maps for the last 90 days in UTC
  const dailyData: Record<string, { date: string; income: number; expense: number }> = {}
  for (let i = 0; i <= 90; i++) {
    const d = subDays(baseDate, i)
    const key = d.toISOString().slice(0, 10)
    dailyData[key] = { date: key, income: 0, expense: 0 }
  }

  transactions.forEach((tx) => {
    const key = tx.date.toISOString().slice(0, 10)
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
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categories = await getCategories(userId)

  const now = new Date()
  const startDate = start 
    ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0, 0)) 
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))

  const endDate = end 
    ? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999)) 
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

  const transactions = await transactionsColl.find({
    ...filter,
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

  const expandedTxs = expandTransactions(transactions)

  expandedTxs.forEach((tx) => {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const convertedAmount = convert(tx.amount, tx.currency)
      const catId = tx.categoryId || "uncategorized"
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
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const now = new Date()
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 0, 0, 0, 0))

  const transactions = await transactionsColl.find({
    ...filter,
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
      const dayIndex = tx.date.getUTCDay() // Use UTC day to align with selected date
      dayData[dayIndex].amount += convertedAmount
    }
  })

  return dayData.map((item) => ({
    day: item.day,
    amount: item.amount / 100,
  }))
})

// 4. Wallet Balance History: Multi-line - 3 / 6 / 12 months
// Upgraded to calculate true Net Worth history (Assets, Liabilities, Net Worth)
export const getWalletBalanceHistory = cache(async (userId: string, monthsCount: number = 6) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const [wallets, loans, { assets, valuations }, baseCurrency] = await Promise.all([
    getAllWalletsIncludingArchived(userId),
    getLoans(),
    getAssetsAndValuationsForScope(),
    getActiveBaseCurrency(),
  ])

  const loanIds = loans.map((l) => l._id.toString())
  const [repayments, transactions] = await Promise.all([
    loanIds.length > 0
      ? (await getCollection<LoanRepayment>("loan_repayments")).find({ loanId: { $in: loanIds } }).toArray()
      : Promise.resolve([] as LoanRepayment[]),
    (await getCollection<Transaction>("transactions")).find(filter).toArray(),
  ])

  const sourceCurrencies = Array.from(
    new Set([
      ...wallets.map((w) => w.currency),
      ...loans.map((l) => l.currency),
      ...assets.map((a) => a.currency),
    ])
  )

  const targetCurrency = baseCurrency || "USD"
  const convert = await getCurrencyConverter(targetCurrency, sourceCurrencies)

  const now = new Date()
  const dates: Date[] = []
  for (let i = 0; i < monthsCount; i++) {
    // Generate dates representing the end of each month
    const d = subMonths(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15)), i)
    const utcMonthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    dates.push(utcMonthEnd)
  }
  dates.sort((a, b) => a.getTime() - b.getTime()) // Chronological order

  const history = calculateNetWorthHistory({
    wallets,
    transactions,
    loans,
    repayments,
    assets,
    valuations,
    convert,
    dates,
  })

  return history.map((pt) => ({
    month: pt.dateStr,
    netWorth: pt.netWorth / 100,
    totalAssets: pt.totalAssets / 100,
    totalLiabilities: pt.totalLiabilities / 100,
  }))
})

// 5. Monthly Net Savings: Pos/neg bar - Last 12 months
export const getMonthlyNetSavings = cache(async (userId: string) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const now = new Date()
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1, 0, 0, 0, 0))

  const transactions = await transactionsColl.find({
    ...filter,
    date: { $gte: startDate },
    type: { $in: ["income", "expense", "transfer"] },
  }).toArray()

  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"
  const currencies = transactions.map(tx => tx.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  // Find maximum date to align charts
  let maxDate = now
  transactions.forEach((tx) => {
    if (tx.date > maxDate) maxDate = tx.date
  })

  const monthlyData: Record<string, { month: string; income: number; expense: number }> = {}
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 15)), i)
    const key = d.toISOString().slice(0, 7)
    const label = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear().toString().slice(-2)}`
    monthlyData[key] = { month: label, income: 0, expense: 0 }
  }

  transactions.forEach((tx) => {
    const key = tx.date.toISOString().slice(0, 7)
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
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
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
        ...filter,
        $or: [
          { categoryId: budget.categoryId },
          { "splits.categoryId": budget.categoryId }
        ],
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
      const expandedTxs = expandTransactions(txs)
      const convert = await getCurrencyConverter(budget.currency, expandedTxs.map(tx => tx.currency))

      const spent = expandedTxs.reduce((sum, tx) => {
        if (
          (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) &&
          tx.categoryId === budget.categoryId
        ) {
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
