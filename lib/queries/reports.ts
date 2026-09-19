import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getCategories } from "./categories"
import { getActiveBudgets } from "./budgets"
import { getPreferences } from "./preferences"
import { getCurrencyConverter } from "@/lib/currency"
import { getLoans, getActiveBaseCurrency } from "./loans"
import { getAssetsAndValuationsForScope } from "./assets"
import { getActiveRecurringRules } from "./recurring"
import { calculateNetWorthHistory } from "@/lib/calculations/net-worth"
import { Transaction, Category, LoanRepayment, Goal, Loan } from "@/types"
import { subDays, subMonths, eachDayOfInterval, startOfMonth, startOfDay } from "date-fns"
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
export const getDailyIncomeExpenseTrend = cache(async (
  userId: string,
  daysCount: number = 90,
  startDateParam?: Date,
  endDateParam?: Date
) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const now = new Date()
  
  let queryStartDate: Date
  let daysDifference = daysCount

  if (startDateParam && endDateParam) {
    queryStartDate = new Date(Date.UTC(startDateParam.getUTCFullYear(), startDateParam.getUTCMonth(), startDateParam.getUTCDate() - 2, 0, 0, 0, 0))
    const diffMs = Math.abs(endDateParam.getTime() - startDateParam.getTime())
    daysDifference = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  } else {
    queryStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (daysCount + 5), 0, 0, 0, 0))
  }

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
  let maxDate = endDateParam || now
  transactions.forEach((tx) => {
    if (tx.date > maxDate) {
      maxDate = tx.date
    }
  })

  const baseDate = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), maxDate.getUTCDate()))

  // Initialize day maps for the interval in UTC
  const dailyData: Record<string, { date: string; income: number; expense: number }> = {}
  for (let i = 0; i <= daysDifference; i++) {
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
  const historyStart = startOfMonth(subMonths(now, Math.max(1, monthsCount) - 1))
  const dates: Date[] = eachDayOfInterval({
    start: historyStart,
    end: startOfDay(now),
  })

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
    date: pt.date instanceof Date ? pt.date.toISOString() : new Date(pt.date).toISOString(),
    month: pt.dateStr,
    netWorth: pt.netWorth / 100,
    totalAssets: pt.totalAssets / 100,
    totalLiabilities: pt.totalLiabilities / 100,
  }))
})

// 5. Monthly Net Savings: Pos/neg bar - Configurable monthsCount
export const getMonthlyNetSavings = cache(async (userId: string, monthsCount: number = 6) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")
  const now = new Date()
  const count = Math.max(1, monthsCount)
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1, 0, 0, 0, 0))

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
  for (let i = 0; i < count; i++) {
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
        id: budget._id.toString(),
        name: budget.name,
        category: catName,
        limit: targetLimit / 100,
        spent: targetSpent / 100,
      }
    })
  )

  return performanceData
})

// 7. Commitment Burden: Fixed (Recurring) vs Discretionary Expenses
export const getCommitmentBurden = cache(async (
  userId: string,
  monthsCount: number = 6,
  startDateParam?: Date,
  endDateParam?: Date
) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const [recurringRules, transactionsColl, prefs] = await Promise.all([
    getActiveRecurringRules(userId),
    getCollection<Transaction>("transactions"),
    getPreferences(userId),
  ])

  const targetCurrency = prefs?.defaultCurrency || "USD"
  const now = new Date()
  const count = Math.max(1, monthsCount)
  const startDate = startDateParam || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1, 0, 0, 0, 0))
  const endDate = endDateParam || now

  // Calculate monthly committed amount from active recurring expense rules
  const currencies = recurringRules.map(r => r.currency)
  const convert = await getCurrencyConverter(targetCurrency, currencies)

  let monthlyRecurringCents = 0
  for (const rule of recurringRules) {
    if (rule.type !== "expense") continue
    const converted = convert(rule.amount, rule.currency)
    switch (rule.frequency) {
      case "daily":
        monthlyRecurringCents += converted * 30
        break
      case "weekly":
        monthlyRecurringCents += converted * 4.33
        break
      case "biweekly":
        monthlyRecurringCents += converted * 2.16
        break
      case "monthly":
        monthlyRecurringCents += converted
        break
      case "quarterly":
        monthlyRecurringCents += converted / 3
        break
      case "yearly":
        monthlyRecurringCents += converted / 12
        break
      default:
        monthlyRecurringCents += converted
    }
  }

  // Get total actual expenses in this timeframe
  const expenses = await transactionsColl.find({
    ...filter,
    date: { $gte: startDate, $lte: endDate },
    type: "expense",
  }).toArray()

  const txCurrencies = expenses.map(tx => tx.currency)
  const convertTx = await getCurrencyConverter(targetCurrency, txCurrencies)
  const totalExpenseCents = expenses.reduce((sum, tx) => sum + convertTx(tx.amount, tx.currency), 0)

  const effectiveMonths = Math.max(1, count)
  const avgMonthlyExpenseCents = totalExpenseCents / effectiveMonths

  // Fixed portion is min of monthly recurring and avg monthly expense
  const fixedMonthlyCents = Math.min(avgMonthlyExpenseCents, monthlyRecurringCents)
  const discretionaryMonthlyCents = Math.max(0, avgMonthlyExpenseCents - fixedMonthlyCents)
  const fixedPercentage = avgMonthlyExpenseCents > 0
    ? Math.min(100, Math.round((fixedMonthlyCents / avgMonthlyExpenseCents) * 100))
    : (monthlyRecurringCents > 0 ? 100 : 0)

  const recurringItems: { name: string; value: number; color: string }[] = []
  for (const rule of recurringRules) {
    if (rule.type !== "expense") continue
    const converted = convert(rule.amount, rule.currency)
    let monthlyAmount = 0
    switch (rule.frequency) {
      case "daily": monthlyAmount = converted * 30; break
      case "weekly": monthlyAmount = converted * 4.33; break
      case "biweekly": monthlyAmount = converted * 2.16; break
      case "monthly": monthlyAmount = converted; break
      case "quarterly": monthlyAmount = converted / 3; break
      case "yearly": monthlyAmount = converted / 12; break
      default: monthlyAmount = converted
    }
    recurringItems.push({
      name: rule.description || "Recurring Commitment",
      value: Math.round(monthlyAmount) / 100,
      color: "var(--chart-1)",
    })
  }
  recurringItems.sort((a, b) => b.value - a.value)

  return {
    fixed: Math.round(fixedMonthlyCents) / 100,
    discretionary: Math.round(discretionaryMonthlyCents) / 100,
    total: Math.round(avgMonthlyExpenseCents) / 100,
    fixedPercentage,
    activeRulesCount: recurringRules.filter(r => r.type === "expense").length,
    recurringItems,
  }
})

// 8. Capital Allocation: Goals Contributions & Debt Payoffs
export const getCapitalAllocation = cache(async (
  userId: string,
  monthsCount: number = 6,
  startDateParam?: Date,
  endDateParam?: Date
) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const [goalsColl, loansColl, repaymentsColl, transactionsColl, prefs] = await Promise.all([
    getCollection<Goal>("goals"),
    getCollection<Loan>("loans"),
    getCollection<LoanRepayment>("loan_repayments"),
    getCollection<Transaction>("transactions"),
    getPreferences(userId),
  ])

  const targetCurrency = prefs?.defaultCurrency || "USD"
  const now = new Date()
  const count = Math.max(1, monthsCount)
  const startDate = startDateParam || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1, 0, 0, 0, 0))
  const endDate = endDateParam || now

  // 1. Goal Contributions in this timeframe (transactions with goalId)
  const goalTransactions = await transactionsColl.find({
    ...filter,
    date: { $gte: startDate, $lte: endDate },
    goalId: { $exists: true, $ne: "" },
  }).toArray()

  const goals = await goalsColl.find(filter).toArray()
  const goalMap = new Map(goals.map(g => [g._id.toString(), g.name]))

  // 2. Loan Repayments in this timeframe
  const loans = await loansColl.find(filter).toArray()
  const loanIds = loans.map(l => l._id.toString())
  const loanMap = new Map(loans.map(l => [l._id.toString(), l.personName || "Loan"]))
  const loanCurrencyMap = new Map(loans.map(l => [l._id.toString(), l.currency]))

  const repayments = loanIds.length > 0
    ? await repaymentsColl.find({
        loanId: { $in: loanIds },
        date: { $gte: startDate, $lte: endDate },
      }).toArray()
    : []

  // Convert and aggregate
  const allCurrencies = [
    ...goalTransactions.map(tx => tx.currency),
    ...repayments.map(r => loanCurrencyMap.get(r.loanId) || "USD"),
  ]
  const convert = await getCurrencyConverter(targetCurrency, allCurrencies)

  const items: { name: string; type: "goal" | "debt"; amount: number; color: string }[] = []

  // Group goal contributions by goal
  const goalTotals: Record<string, number> = {}
  for (const tx of goalTransactions) {
    if (!tx.goalId) continue
    const converted = convert(tx.amount, tx.currency)
    goalTotals[tx.goalId] = (goalTotals[tx.goalId] || 0) + converted
  }

  for (const [gId, amount] of Object.entries(goalTotals)) {
    items.push({
      name: goalMap.get(gId) || "Goal",
      type: "goal",
      amount: amount / 100,
      color: "var(--chart-1)",
    })
  }

  // Group repayments by loan
  const loanTotals: Record<string, number> = {}
  for (const rep of repayments) {
    const loanCurrency = loanCurrencyMap.get(rep.loanId) || "USD"
    const converted = convert(rep.amount, loanCurrency)
    loanTotals[rep.loanId] = (loanTotals[rep.loanId] || 0) + converted
  }

  for (const [lId, amount] of Object.entries(loanTotals)) {
    items.push({
      name: loanMap.get(lId) || "Debt Payoff",
      type: "debt",
      amount: amount / 100,
      color: "var(--chart-2)",
    })
  }

  // Sort items descending by amount
  items.sort((a, b) => b.amount - a.amount)

  const totalGoals = Object.values(goalTotals).reduce((sum, a) => sum + a, 0) / 100
  const totalDebt = Object.values(loanTotals).reduce((sum, a) => sum + a, 0) / 100

  return {
    items: items.slice(0, 6),
    totalGoals,
    totalDebt,
    totalAllocated: totalGoals + totalDebt,
  }
})
