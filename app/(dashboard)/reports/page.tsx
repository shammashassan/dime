import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import {
  getIncomeExpenseTrend,
  getCategoryBreakdown,
  getSpendingByDayOfWeek,
  getWalletBalanceHistory,
  getMonthlyNetSavings,
  getBudgetPerformance,
} from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { formatCurrency } from "@/lib/utils"
import { IncomeExpenseTrendChart } from "@/components/reports/income-expense-trend-chart"
import { CategoryBreakdownChart } from "@/components/reports/category-breakdown-chart"
import { SpendingDayChart } from "@/components/reports/spending-day-chart"
import { NetWorthHistoryChart } from "@/components/reports/net-worth-history-chart"
import { NetSavingsChart } from "@/components/reports/net-savings-chart"
import { BudgetPerformanceChart } from "@/components/reports/budget-performance-chart"
import { ReportFilters } from "@/components/reports/report-filters"
import { MonthlySummaryTable } from "@/components/reports/monthly-summary-table"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/ui/metric-card"
import { unstable_rethrow } from "next/navigation"
import { BarChart3, TrendingDown, Wallet, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react"

// Loading skeleton for reports content
function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* MetricCards Skeleton */}
      <div className="flex flex-wrap gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[380px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

async function ReportsContent({
  searchParams,
}: {
  searchParams: Promise<{
    monthsCount?: string
    categoryFrom?: string
    categoryTo?: string
  }>
}) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const params = await searchParams

  const categoryFrom = params.categoryFrom ? new Date(params.categoryFrom) : undefined
  const categoryTo = params.categoryTo ? new Date(params.categoryTo) : undefined

  // Dynamically calculate monthsCount based on custom date range if selected
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

  // Calculate metrics based on the active trendData
  const totalIncome = trendData.reduce((sum, item) => sum + item.income, 0)
  const totalExpense = trendData.reduce((sum, item) => sum + item.expense, 0)
  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Analytics & Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gain deeper insights into your spending habits, net worth progression, and budgets.
            </p>
          </div>
        </div>

        {/* Global Filter Component */}
        <div className="self-start lg:self-center">
          <ReportFilters />
        </div>
      </div>

      {/* MetricCards row */}
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

      {/* Bento grid of 6 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Cash flow Area chart */}
        <IncomeExpenseTrendChart data={trendData} monthsCount={monthsCount} currency={currency} />

        {/* 2. Category Breakdown Pie chart */}
        <CategoryBreakdownChart data={breakdownData} currency={currency} />

        {/* 3. Spending day Bar chart */}
        <SpendingDayChart data={spendingDayData} currency={currency} />

        {/* 4. Net Worth History line/area chart */}
        <NetWorthHistoryChart data={walletHistoryData} monthsCount={monthsCount} currency={currency} />

        {/* 5. Net Savings positive/negative bar chart */}
        <NetSavingsChart data={savingsData} currency={currency} />

        {/* 6. Budget Performance grouped bar chart */}
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
    monthsCount?: string
    categoryFrom?: string
    categoryTo?: string
  }>
}) {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  )
}
