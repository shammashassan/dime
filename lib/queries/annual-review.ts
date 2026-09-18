import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getCategories } from "./categories"
import { getLoans } from "./loans"
import { getAssetsAndValuationsForScope } from "./assets"
import {
  getWalletBalanceAt,
  getLoanBalanceAt,
  getAssetValueAt,
} from "@/lib/calculations/net-worth"
import { convertAmount } from "@/lib/calculations/monthly-review"
import {
  getQuarterMonths,
  getQuarterDateRange,
  getAnnualDateRange,
  getPreviousQuarter,
  aggregatePeriodMetrics,
  aggregateCategoryBreakdown,
  buildMonthlyBreakdown,
  buildQuarterlyBreakdown,
  generateDeterministicPeriodBrief,
} from "@/lib/calculations/annual-review"
import { extractTopTransactions } from "@/lib/calculations/monthly-review"
import type {
  Transaction,
  LoanRepayment,
  QuarterlyReviewData,
  AnnualReviewData,
} from "@/types"

export const getAvailableYears = cache(async (_userId: string): Promise<number[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const transactionsColl = await getCollection<Transaction>("transactions")

  const distinctYears = await transactionsColl
    .aggregate<{ _id: number }>([
      { $match: filter },
      {
        $group: {
          _id: { $year: "$date" },
        },
      },
      { $sort: { _id: -1 } },
    ])
    .toArray()

  const currentYear = new Date().getFullYear()
  const yearsSet = new Set<number>(distinctYears.map((d) => d._id).filter(Boolean))
  yearsSet.add(currentYear)
  yearsSet.add(currentYear - 1)

  return Array.from(yearsSet).sort((a, b) => b - a)
})

export const getAvailableQuarters = cache(
  async (_userId: string): Promise<{ year: number; quarter: 1 | 2 | 3 | 4; label: string }[]> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const transactionsColl = await getCollection<Transaction>("transactions")

    const distinctPeriods = await transactionsColl
      .aggregate<{ _id: { year: number; month: number } }>([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
          },
        },
      ])
      .toArray()

    const quartersSet = new Set<string>()
    for (const item of distinctPeriods) {
      if (item._id?.year && item._id?.month) {
        const q = Math.ceil(item._id.month / 3)
        quartersSet.add(`${item._id.year}-${q}`)
      }
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
    quartersSet.add(`${currentYear}-${currentQuarter}`)

    const sortedQuarters = Array.from(quartersSet).sort((a, b) => b.localeCompare(a))

    return sortedQuarters.map((key) => {
      const [yStr, qStr] = key.split("-")
      const year = parseInt(yStr, 10)
      const quarter = parseInt(qStr, 10) as 1 | 2 | 3 | 4
      return {
        year,
        quarter,
        label: `Q${quarter} ${year}`,
      }
    })
  }
)

export const getQuarterlyReviewData = cache(
  async (userId: string, year: number, quarter: 1 | 2 | 3 | 4): Promise<QuarterlyReviewData> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const { start: currentStart, end: currentEnd } = getQuarterDateRange(year, quarter)
    const prevQ = getPreviousQuarter(year, quarter)
    const { start: prevStart, end: prevEnd } = getQuarterDateRange(prevQ.year, prevQ.quarter)

    const [
      wallets,
      categories,
      loans,
      assetsData,
      exchangeRates,
      availableQuarters,
    ] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getCategories(userId),
      getLoans(),
      getAssetsAndValuationsForScope(),
      getExchangeRates(targetCurrency),
      getAvailableQuarters(userId),
    ])

    const transactionsColl = await getCollection<Transaction>("transactions")
    const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")

    const [currentTransactions, prevTransactions, allTransactionsForBacktrack, repayments] =
      await Promise.all([
        transactionsColl
          .find({
            ...filter,
            date: { $gte: currentStart, $lte: currentEnd },
          })
          .sort({ date: -1 })
          .toArray(),
        transactionsColl
          .find({
            ...filter,
            date: { $gte: prevStart, $lte: prevEnd },
          })
          .sort({ date: -1 })
          .toArray(),
        transactionsColl
          .find({
            ...filter,
            date: { $gte: prevStart },
          })
          .toArray(),
        repaymentsColl.find(filter).toArray(),
      ])

    const computeNetWorthAt = (date: Date): number => {
      let totalAssetsCents = 0
      let totalLiabilitiesCents = 0

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

      for (const a of assetsData.assets) {
        if (a.isArchived) continue
        const valAt = getAssetValueAt(assetsData.valuations, a, date)
        const converted = convertAmount(valAt, a.currency || "USD", targetCurrency, exchangeRates)
        totalAssetsCents += converted
      }

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

    const openingNetWorthCents = computeNetWorthAt(currentStart)
    const closingNetWorthCents = computeNetWorthAt(currentEnd)
    const prevOpeningNetWorthCents = computeNetWorthAt(prevStart)
    const prevClosingNetWorthCents = computeNetWorthAt(prevEnd)

    const metrics = aggregatePeriodMetrics({
      transactions: currentTransactions,
      targetCurrency,
      exchangeRates,
      openingNetWorthCents,
      closingNetWorthCents,
    })

    const previousQuarterMetrics = aggregatePeriodMetrics({
      transactions: prevTransactions,
      targetCurrency,
      exchangeRates,
      openingNetWorthCents: prevOpeningNetWorthCents,
      closingNetWorthCents: prevClosingNetWorthCents,
    })

    const topCategories = aggregateCategoryBreakdown({
      currentTransactions,
      previousTransactions: prevTransactions,
      categories,
      targetCurrency,
      exchangeRates,
    })

    const quarterMonths = getQuarterMonths(year, quarter)
    const monthlyBreakdown = buildMonthlyBreakdown({
      transactions: currentTransactions,
      months: quarterMonths,
      targetCurrency,
      exchangeRates,
    })

    const quarterLabel = `Q${quarter} ${year}`
    const executiveBrief = generateDeterministicPeriodBrief({
      metrics,
      topCategories,
      periodLabel: quarterLabel,
      previousMetrics: previousQuarterMetrics,
      targetCurrency,
    })

    const topTransactions = extractTopTransactions({
      targetTransactions: currentTransactions,
      categories,
      wallets,
      targetCurrency,
      exchangeRates,
    })

    return {
      period: "quarterly",
      year,
      quarter,
      quarterLabel,
      targetCurrency,
      metrics,
      previousQuarterMetrics,
      monthlyBreakdown,
      topCategories,
      topExpenses: topTransactions.topExpenses,
      topIncomes: topTransactions.topIncomes,
      executiveBrief,
      availableQuarters,
    }
  }
)

export const getAnnualReviewData = cache(
  async (userId: string, year: number): Promise<AnnualReviewData> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const { start: currentStart, end: currentEnd } = getAnnualDateRange(year)
    const { start: prevStart, end: prevEnd } = getAnnualDateRange(year - 1)

    const [
      wallets,
      categories,
      loans,
      assetsData,
      exchangeRates,
      availableYears,
    ] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getCategories(userId),
      getLoans(),
      getAssetsAndValuationsForScope(),
      getExchangeRates(targetCurrency),
      getAvailableYears(userId),
    ])

    const transactionsColl = await getCollection<Transaction>("transactions")
    const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")

    const [currentTransactions, prevTransactions, allTransactionsForBacktrack, repayments] =
      await Promise.all([
        transactionsColl
          .find({
            ...filter,
            date: { $gte: currentStart, $lte: currentEnd },
          })
          .sort({ date: -1 })
          .toArray(),
        transactionsColl
          .find({
            ...filter,
            date: { $gte: prevStart, $lte: prevEnd },
          })
          .sort({ date: -1 })
          .toArray(),
        transactionsColl
          .find({
            ...filter,
            date: { $gte: prevStart },
          })
          .toArray(),
        repaymentsColl.find(filter).toArray(),
      ])

    const computeNetWorthAt = (date: Date): number => {
      let totalAssetsCents = 0
      let totalLiabilitiesCents = 0

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

      for (const a of assetsData.assets) {
        if (a.isArchived) continue
        const valAt = getAssetValueAt(assetsData.valuations, a, date)
        const converted = convertAmount(valAt, a.currency || "USD", targetCurrency, exchangeRates)
        totalAssetsCents += converted
      }

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

    const openingNetWorthCents = computeNetWorthAt(currentStart)
    const closingNetWorthCents = computeNetWorthAt(currentEnd)
    const prevOpeningNetWorthCents = computeNetWorthAt(prevStart)
    const prevClosingNetWorthCents = computeNetWorthAt(prevEnd)

    const metrics = aggregatePeriodMetrics({
      transactions: currentTransactions,
      targetCurrency,
      exchangeRates,
      openingNetWorthCents,
      closingNetWorthCents,
    })

    const previousYearMetrics = aggregatePeriodMetrics({
      transactions: prevTransactions,
      targetCurrency,
      exchangeRates,
      openingNetWorthCents: prevOpeningNetWorthCents,
      closingNetWorthCents: prevClosingNetWorthCents,
    })

    const topCategories = aggregateCategoryBreakdown({
      currentTransactions,
      previousTransactions: prevTransactions,
      categories,
      targetCurrency,
      exchangeRates,
    })

    const yearMonths = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`)
    const monthlyBreakdown = buildMonthlyBreakdown({
      transactions: currentTransactions,
      months: yearMonths,
      targetCurrency,
      exchangeRates,
    })

    const quarterlyBreakdown = buildQuarterlyBreakdown(monthlyBreakdown)

    const yearLabel = String(year)
    const executiveBrief = generateDeterministicPeriodBrief({
      metrics,
      topCategories,
      periodLabel: yearLabel,
      previousMetrics: previousYearMetrics,
      targetCurrency,
    })

    const topTransactions = extractTopTransactions({
      targetTransactions: currentTransactions,
      categories,
      wallets,
      targetCurrency,
      exchangeRates,
    })

    return {
      period: "annual",
      year,
      yearLabel,
      targetCurrency,
      metrics,
      previousYearMetrics,
      monthlyBreakdown,
      topCategories,
      topExpenses: topTransactions.topExpenses,
      topIncomes: topTransactions.topIncomes,
      quarterlyBreakdown,
      executiveBrief,
      availableYears,
    }
  }
)
