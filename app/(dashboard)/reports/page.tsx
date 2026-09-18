import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Reports & Analytics",
  description: "Analyze your income, expenses, cash flow trends, category breakdowns, and spending heatmaps.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import {
  getIncomeExpenseTrend,
  getCategoryBreakdown,
  getSpendingByDayOfWeek,
  getWalletBalanceHistory,
  getMonthlyNetSavings,
  getBudgetPerformance,
} from "@/lib/queries/reports"
import { getSpendingHeatmapData } from "@/lib/queries/heatmaps"
import { getWallets } from "@/lib/queries/wallets"
import { getCategories } from "@/lib/queries/categories"
import { getPreferences } from "@/lib/queries/preferences"
import { formatCurrency, serializeData } from "@/lib/utils"
import { IncomeExpenseTrendChart } from "@/components/reports/income-expense-trend-chart"
import { CategoryBreakdownChart } from "@/components/reports/category-breakdown-chart"
import { SpendingDayChart } from "@/components/reports/spending-day-chart"
import { NetWorthHistoryChart } from "@/components/reports/net-worth-history-chart"
import { NetSavingsChart } from "@/components/reports/net-savings-chart"
import { BudgetPerformanceChart } from "@/components/reports/budget-performance-chart"
import { ReportFilters } from "@/components/reports/report-filters"
import { MonthlySummaryTable } from "@/components/reports/monthly-summary-table"
import { ReportsNavTabs } from "@/components/reports/reports-nav-tabs"
import { SpendingHeatmapView } from "@/components/reports/spending-heatmap-view"
import { MonthlyReviewView } from "@/components/reports/monthly-review-view"
import { MonthlyReviewFilters } from "@/components/reports/monthly-review-filters"
import { getMonthlyReviewData } from "@/lib/queries/monthly-review"
import { QuarterlyReviewView } from "@/components/reports/quarterly-review-view"
import { AnnualReviewView } from "@/components/reports/annual-review-view"
import { PeriodReviewFilters } from "@/components/reports/period-review-filters"
import { getQuarterlyReviewData, getAnnualReviewData } from "@/lib/queries/annual-review"
import { MetricCard } from "@/components/ui/metric-card"
import { unstable_rethrow } from "next/navigation"
import { BarChart3, TrendingDown, Wallet, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react"

import { ReportsSkeleton } from "./loading"

async function ReportsContent({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    month?: string
    year?: string
    quarter?: string
    monthsCount?: string
    categoryFrom?: string
    categoryTo?: string
    metric?: "expense" | "income" | "net" | "count"
    timeframe?: string
    walletId?: string
    categoryId?: string
  }>
}) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const params = await searchParams
  const activeTab =
    params.tab === "review"
      ? "review"
      : params.tab === "quarterly"
      ? "quarterly"
      : params.tab === "annual"
      ? "annual"
      : params.tab === "heatmap"
      ? "heatmap"
      : "overview"

  if (activeTab === "review") {
    const reviewData = await getMonthlyReviewData(userId, params.month)
    return (
      <div className="flex flex-col gap-7 w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
              <BarChart3 className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Analyze your income, expenses, category spending, and monthly financial reviews.
              </p>
            </div>
          </div>

          {/* Monthly Review Filters Component */}
          <div className="self-start lg:self-center shrink-0">
            <Suspense fallback={null}>
              <MonthlyReviewFilters
                availableMonths={reviewData.availableMonths}
                currentMonth={reviewData.monthKey}
              />
            </Suspense>
          </div>
        </div>

        <MonthlyReviewView
          data={serializeData(reviewData)}
          navTabs={
            <Suspense fallback={null}>
              <ReportsNavTabs />
            </Suspense>
          }
        />
      </div>
    )
  }

  if (activeTab === "quarterly") {
    const currentYear = new Date().getFullYear()
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4
    const year = params.year ? parseInt(params.year, 10) : currentYear
    const quarter = params.quarter ? (parseInt(params.quarter, 10) as 1 | 2 | 3 | 4) : currentQuarter

    const quarterlyData = await getQuarterlyReviewData(userId, year, quarter)
    return (
      <div className="flex flex-col gap-7 w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
              <BarChart3 className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quarterly financial retrospective, multi-month trends, and category rollups.
              </p>
            </div>
          </div>

          <div className="self-start lg:self-center shrink-0">
            <Suspense fallback={null}>
              <PeriodReviewFilters
                period="quarterly"
                currentYear={year}
                currentQuarter={quarter}
                availableQuarters={quarterlyData.availableQuarters}
              />
            </Suspense>
          </div>
        </div>

        <QuarterlyReviewView
          data={serializeData(quarterlyData)}
          navTabs={
            <Suspense fallback={null}>
              <ReportsNavTabs />
            </Suspense>
          }
        />
      </div>
    )
  }

  if (activeTab === "annual") {
    const currentYear = new Date().getFullYear()
    const year = params.year ? parseInt(params.year, 10) : currentYear

    const annualData = await getAnnualReviewData(userId, year)
    return (
      <div className="flex flex-col gap-7 w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
              <BarChart3 className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Full-year financial retrospective, annual wealth trajectory, and quarterly rollups.
              </p>
            </div>
          </div>

          <div className="self-start lg:self-center shrink-0">
            <Suspense fallback={null}>
              <PeriodReviewFilters
                period="annual"
                currentYear={year}
                availableYears={annualData.availableYears}
              />
            </Suspense>
          </div>
        </div>

        <AnnualReviewView
          data={serializeData(annualData)}
          navTabs={
            <Suspense fallback={null}>
              <ReportsNavTabs />
            </Suspense>
          }
        />
      </div>
    )
  }

  if (activeTab === "heatmap") {
    const [heatmapData, wallets, categories] = await Promise.all([
      getSpendingHeatmapData(userId, {
        metric: params.metric,
        timeframe: params.timeframe,
        walletId: params.walletId,
        categoryId: params.categoryId,
      }),
      getWallets(userId),
      getCategories(userId),
    ])

    return (
      <div className="flex flex-col gap-7 w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
              <BarChart3 className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Analyze spending patterns, habit streaks, and year-long financial activity heatmaps.
              </p>
            </div>
          </div>
        </div>

        {/* Activity Heatmap View */}
        <Suspense fallback={<ReportsSkeleton />}>
          <SpendingHeatmapView
            data={serializeData(heatmapData)}
            wallets={serializeData(wallets)}
            categories={serializeData(categories)}
            navTabs={
              <Suspense fallback={null}>
                <ReportsNavTabs />
              </Suspense>
            }
          />
        </Suspense>
      </div>
    )
  }

  // Otherwise, load standard Overview & Trends tab
  const categoryFrom = params.categoryFrom ? new Date(params.categoryFrom) : undefined
  const categoryTo = params.categoryTo ? new Date(params.categoryTo) : undefined

  let monthsCount = params.monthsCount ? parseInt(params.monthsCount, 10) : 6
  if (categoryFrom && categoryTo) {
    const diffTime = Math.abs(categoryTo.getTime() - categoryFrom.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    monthsCount = Math.max(1, Math.ceil(diffDays / 30))
  }

  let trendData: { month: string; income: number; expense: number }[] = []
  let breakdownData: { category: string; value: number; color: string; icon: string }[] = []
  let spendingDayData: { day: string; amount: number }[] = []
  let walletHistoryData: { month: string; netWorth: number; totalAssets: number; totalLiabilities: number }[] = []
  let savingsData: { month: string; savings: number }[] = []
  let budgetPerformanceData: { name: string; category: string; limit: number; spent: number }[] = []
  let currency = "USD"

  try {
    const [
      fetchedTrend,
      fetchedBreakdown,
      fetchedSpendingDay,
      fetchedWalletHistory,
      fetchedSavings,
      fetchedBudgetPerf,
      prefs,
    ] = await Promise.all([
      getIncomeExpenseTrend(userId, monthsCount),
      getCategoryBreakdown(userId, categoryFrom, categoryTo),
      getSpendingByDayOfWeek(userId),
      getWalletBalanceHistory(userId, monthsCount),
      getMonthlyNetSavings(userId),
      getBudgetPerformance(userId),
      getPreferences(userId),
    ])

    trendData = fetchedTrend
    breakdownData = fetchedBreakdown
    spendingDayData = fetchedSpendingDay
    walletHistoryData = fetchedWalletHistory
    savingsData = fetchedSavings
    budgetPerformanceData = fetchedBudgetPerf
    currency = prefs?.defaultCurrency || "USD"
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load reports data:", error)
  }

  const totalIncome = trendData.reduce((sum, item) => sum + item.income, 0)
  const totalExpense = trendData.reduce((sum, item) => sum + item.expense, 0)
  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <BarChart3 className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyze spending trends, category breakdowns, and monthly financial summaries.
            </p>
          </div>
        </div>

        {/* Global Date Filter Component */}
        <div className="self-start lg:self-center shrink-0">
          <ReportFilters />
        </div>
      </div>

      {/* MetricCards row with 3x2 balanced split */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={ArrowUpRight}
          color="#10b981"
          label="Total Income"
          value={formatCurrency(totalIncome * 100, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={ArrowDownRight}
          color="#f43f5e"
          label="Total Expenses"
          value={formatCurrency(totalExpense * 100, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={Wallet}
          color="#8b5cf6"
          label="Net Savings"
          value={formatCurrency(netSavings * 100, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={Percent}
          color="#3b82f6"
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={TrendingDown}
          color="#f59e0b"
          label="Avg Monthly Expense"
          value={formatCurrency((totalExpense / Math.max(1, monthsCount)) * 100, currency)}
        />
      </div>

      {/* Navigation Tabs — placed just below the metric cards */}
      <div className="flex items-center">
        <Suspense fallback={null}>
          <ReportsNavTabs />
        </Suspense>
      </div>

      {/* Bento grid of 6 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseTrendChart data={trendData} monthsCount={monthsCount} currency={currency} />
        <CategoryBreakdownChart data={breakdownData} currency={currency} />
        <SpendingDayChart data={spendingDayData} currency={currency} />
        <NetWorthHistoryChart data={walletHistoryData} monthsCount={monthsCount} currency={currency} />
        <NetSavingsChart data={savingsData} currency={currency} />
        <BudgetPerformanceChart data={budgetPerformanceData} currency={currency} />
      </div>

      {/* Monthly Performance Summary Table */}
      {trendData.length > 0 && (
        <MonthlySummaryTable data={trendData} currency={currency} />
      )}
    </div>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    month?: string
    year?: string
    quarter?: string
    monthsCount?: string
    categoryFrom?: string
    categoryTo?: string
    metric?: "expense" | "income" | "net" | "count"
    timeframe?: string
    walletId?: string
    categoryId?: string
  }>
}) {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  )
}
