import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getCategories } from "./categories"
import { getActiveBudgets } from "./budgets"
import { getActiveRecurringRules } from "./recurring"
import { getLoans } from "./loans"
import { getGoals } from "./goals"
import { getAssetsAndValuationsForScope } from "./assets"
import {
  getWalletBalanceAt,
  getLoanBalanceAt,
  getAssetValueAt,
} from "@/lib/calculations/net-worth"
import {
  formatMonthLabel,
  calculateMonthlyMetrics,
  calculateCategorySpendBreakdown,
  calculateBudgetPerformance,
  extractTopTransactions,
  calculateGoalAndLoanProgress,
  generateDeterministicReviewBrief,
  convertAmount,
} from "@/lib/calculations/monthly-review"
import type {
  Transaction,
  LoanRepayment,
  MonthlyReviewData,
  LatestCompletedMonthSummary,
} from "@/types"

export const getMonthlyReviewData = cache(
  async (userId: string, requestedMonth?: string): Promise<MonthlyReviewData> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    // 1. Determine target month (default to most recently completed calendar month)
    const now = new Date()
    let targetMonthKey = requestedMonth

    if (!targetMonthKey || !/^\d{4}-\d{2}$/.test(targetMonthKey)) {
      // Default: previous calendar month
      const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
      const y = prevDate.getUTCFullYear()
      const m = String(prevDate.getUTCMonth() + 1).padStart(2, "0")
      targetMonthKey = `${y}-${m}`
    }

    const [yearStr, monthStr] = targetMonthKey.split("-")
    const targetYear = parseInt(yearStr, 10)
    const targetMonthIdx = parseInt(monthStr, 10) - 1

    const targetMonthStart = new Date(Date.UTC(targetYear, targetMonthIdx, 1, 0, 0, 0, 0))
    const targetMonthEnd = new Date(Date.UTC(targetYear, targetMonthIdx + 1, 0, 23, 59, 59, 999))

    // Preceding baseline month
    const baselineMonthStart = new Date(Date.UTC(targetYear, targetMonthIdx - 1, 1, 0, 0, 0, 0))
    const baselineMonthEnd = new Date(Date.UTC(targetYear, targetMonthIdx, 0, 23, 59, 59, 999))

    // Parallel fetch of reference data
    const [
      wallets,
      categories,
      budgets,
      recurringRules,
      loans,
      goals,
      assetsData,
      exchangeRates,
    ] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getCategories(userId),
      getActiveBudgets(userId),
      getActiveRecurringRules(userId),
      getLoans(),
      getGoals(userId),
      getAssetsAndValuationsForScope(),
      getExchangeRates(targetCurrency),
    ])

    const transactionsColl = await getCollection<Transaction>("transactions")
    const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")

    // Fetch transactions spanning baseline month start to target month end
    const [monthTransactions, allTransactionsForBacktrack, repayments, distinctMonthsRaw] =
      await Promise.all([
        transactionsColl
          .find({
            ...filter,
            date: { $gte: baselineMonthStart, $lte: targetMonthEnd },
          })
          .sort({ date: -1 })
          .toArray(),
        transactionsColl
          .find({
            ...filter,
            date: { $gte: baselineMonthStart },
          })
          .toArray(),
        repaymentsColl.find(filter).toArray(),
        transactionsColl
          .aggregate<{ _id: string }>([
            { $match: filter },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m", date: "$date" },
                },
              },
            },
            { $sort: { _id: -1 } },
          ])
          .toArray(),
      ])

    // Available months list for switcher
    const monthKeysSet = new Set(distinctMonthsRaw.map((d) => d._id).filter(Boolean))
    monthKeysSet.add(targetMonthKey)
    const availableMonths = Array.from(monthKeysSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        monthKey: key,
        label: formatMonthLabel(key),
      }))

    // Separate target month vs baseline month transactions
    const targetTransactions: Transaction[] = []
    const baselineTransactions: Transaction[] = []

    for (const tx of monthTransactions) {
      const txDate = new Date(tx.date)
      if (txDate >= targetMonthStart && txDate <= targetMonthEnd) {
        targetTransactions.push(tx)
      } else if (txDate >= baselineMonthStart && txDate <= baselineMonthEnd) {
        baselineTransactions.push(tx)
      }
    }

    // Backtrack opening and closing Net Worth
    const computeNetWorthAt = (date: Date): number => {
      let totalAssetsCents = 0
      let totalLiabilitiesCents = 0

      // Liquid & bank wallets
      for (const w of wallets) {
        if (w.isArchived) continue
        const balanceAt = getWalletBalanceAt(allTransactionsForBacktrack, w, date)
        const converted = convertAmount(balanceAt, w.currency || "USD", targetCurrency, exchangeRates)
        if (converted >= 0) {
          totalAssetsCents += converted
        } else {
          totalLiabilitiesCents += Math.abs(converted)
        }
      }

      // Assets
      for (const a of assetsData.assets) {
        if (a.isArchived) continue
        const valAt = getAssetValueAt(assetsData.valuations, a, date)
        const converted = convertAmount(valAt, a.currency || "USD", targetCurrency, exchangeRates)
        totalAssetsCents += converted
      }

      // Loans
      for (const l of loans) {
        if (l.type === "borrowed") {
          const balAt = getLoanBalanceAt(l, repayments, date)
          const converted = convertAmount(balAt, l.currency || "USD", targetCurrency, exchangeRates)
          totalLiabilitiesCents += converted
        } else if (l.type === "lent") {
          const balAt = getLoanBalanceAt(l, repayments, date)
          const converted = convertAmount(balAt, l.currency || "USD", targetCurrency, exchangeRates)
          totalAssetsCents += converted
        }
      }

      return totalAssetsCents - totalLiabilitiesCents
    }

    const openingNetWorthCents = computeNetWorthAt(targetMonthStart)
    const closingNetWorthCents = computeNetWorthAt(targetMonthEnd)

    // Execute calculation engines
    const metrics = calculateMonthlyMetrics({
      targetTransactions,
      baselineTransactions,
      targetCurrency,
      exchangeRates,
      openingNetWorthCents,
      closingNetWorthCents,
    })

    const categoryBreakdown = calculateCategorySpendBreakdown({
      targetTransactions,
      baselineTransactions,
      categories,
      targetCurrency,
      exchangeRates,
    })

    const budgetPerformance = calculateBudgetPerformance({
      budgets,
      categorySpendList: categoryBreakdown,
      targetCurrency,
      exchangeRates,
    })

    const topTransactions = extractTopTransactions({
      targetTransactions,
      categories,
      wallets,
      targetCurrency,
      exchangeRates,
    })

    const { goalContributions, loanPaydowns } = calculateGoalAndLoanProgress({
      goals,
      loans,
      repayments,
      targetMonthStart,
      targetMonthEnd,
      targetCurrency,
      exchangeRates,
    })

    // Subscriptions cost
    let subscriptionCostCents = 0
    let activeSubCount = 0
    for (const r of recurringRules) {
      const isSub = r.kind === "subscription" || r.tags?.includes("subscription")
      const isActive = r.isActive ?? (r.status === "active")
      if (isSub && isActive) {
        activeSubCount++
        subscriptionCostCents += convertAmount(
          r.amount,
          r.currency || "USD",
          targetCurrency,
          exchangeRates
        )
      }
    }

    const monthLabel = formatMonthLabel(targetMonthKey)

    const executiveBrief = generateDeterministicReviewBrief({
      monthLabel,
      metrics,
      categoryBreakdown,
      budgetPerformance,
      topExpenses: topTransactions.topExpenses,
      currency: targetCurrency,
    })

    return {
      monthKey: targetMonthKey,
      monthLabel,
      targetCurrency,
      metrics,
      categoryBreakdown,
      budgetPerformance,
      topExpenses: topTransactions.topExpenses,
      topIncomes: topTransactions.topIncomes,
      goalContributions,
      loanPaydowns,
      subscriptionChanges: {
        activeCount: activeSubCount,
        totalMonthlyCostCents: subscriptionCostCents,
      },
      executiveBrief,
      availableMonths,
    }
  }
)

export const getLatestCompletedMonthSummary = cache(
  async (userId: string): Promise<LatestCompletedMonthSummary> => {
    const now = new Date()
    const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const y = prevDate.getUTCFullYear()
    const m = String(prevDate.getUTCMonth() + 1).padStart(2, "0")
    const prevMonthKey = `${y}-${m}`

    try {
      const review = await getMonthlyReviewData(userId, prevMonthKey)
      const hasTransactions =
        review.metrics.totalIncomeCents > 0 || review.metrics.totalExpenseCents > 0
      const underBudgetCount = review.budgetPerformance.filter((b) => !b.isOverBudget).length

      return {
        monthKey: prevMonthKey,
        monthLabel: review.monthLabel,
        savingsRatePercentage: review.metrics.savingsRatePercentage,
        netSavingsCents: review.metrics.netSavingsCents,
        targetCurrency: review.targetCurrency,
        underBudgetCategoryCount: underBudgetCount,
        hasTransactions,
      }
    } catch {
      return {
        monthKey: prevMonthKey,
        monthLabel: formatMonthLabel(prevMonthKey),
        savingsRatePercentage: 0,
        netSavingsCents: 0,
        targetCurrency: "USD",
        underBudgetCategoryCount: 0,
        hasTransactions: false,
      }
    }
  }
)
