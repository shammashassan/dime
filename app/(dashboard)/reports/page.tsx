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
import { getWallets } from "@/lib/queries/wallets"
import { getPreferences } from "@/lib/queries/preferences"
import { serializeData, formatCurrency, cn } from "@/lib/utils"
import { IncomeExpenseTrendChart } from "@/components/reports/income-expense-trend-chart"
import { CategoryBreakdownChart } from "@/components/reports/category-breakdown-chart"
import { SpendingDayChart } from "@/components/reports/spending-day-chart"
import { WalletHistoryChart } from "@/components/reports/wallet-history-chart"
import { NetSavingsChart } from "@/components/reports/net-savings-chart"
import { BudgetPerformanceChart } from "@/components/reports/budget-performance-chart"
import { ReportFilters } from "@/components/reports/report-filters"
import { MonthlySummaryTable } from "@/components/reports/monthly-summary-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { unstable_rethrow } from "next/navigation"
import { BarChart3, TrendingUp, TrendingDown, Wallet, Percent, ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react"

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

      {/* Bento Grid Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/40 shadow-xs">
            <CardHeader className="pb-0">
              <Skeleton className="h-4 w-24" />
              <CardAction>
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
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

  let trendData: any[] = []
  let breakdownData: any[] = []
  let spendingDayData: any[] = []
  let walletHistoryData: any[] = []
  let savingsData: any[] = []
  let budgetPerformanceData: any[] = []
  let wallets: any[] = []
  let currency = "USD"

  try {
    const [
      fetchedTrend,
      fetchedBreakdown,
      fetchedSpendingDay,
      fetchedWalletHistory,
      fetchedSavings,
      fetchedBudgetPerf,
      fetchedWallets,
      prefs,
    ] = await Promise.all([
      getIncomeExpenseTrend(userId, monthsCount),
      getCategoryBreakdown(userId, categoryFrom, categoryTo),
      getSpendingByDayOfWeek(userId),
      getWalletBalanceHistory(userId, monthsCount),
      getMonthlyNetSavings(userId),
      getBudgetPerformance(userId),
      getWallets(userId),
      getPreferences(userId),
    ])

    trendData = fetchedTrend
    breakdownData = fetchedBreakdown
    spendingDayData = fetchedSpendingDay
    walletHistoryData = fetchedWalletHistory
    savingsData = fetchedSavings
    budgetPerformanceData = fetchedBudgetPerf
    wallets = serializeData(fetchedWallets)
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

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <Card className="relative overflow-hidden bg-linear-to-t from-primary/5 to-card dark:bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Income</CardTitle>
            <CardAction>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground truncate">
              {formatCurrency(totalIncome * 100, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across the last {monthsCount} months
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="relative overflow-hidden bg-linear-to-t from-primary/5 to-card dark:bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Expenses</CardTitle>
            <CardAction>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground truncate">
              {formatCurrency(totalExpense * 100, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tracked expense transactions
            </p>
          </CardContent>
        </Card>

        {/* Net Savings */}
        <Card className="relative overflow-hidden bg-linear-to-t from-primary/5 to-card dark:bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Net Savings</CardTitle>
            <CardAction>
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Wallet className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground truncate">
              {formatCurrency(netSavings * 100, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Income minus expenses
            </p>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="relative overflow-hidden bg-linear-to-t from-primary/5 to-card dark:bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Savings Rate</CardTitle>
            <CardAction>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Percent className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground truncate">
              {savingsRate.toFixed(1)}%
            </div>
            {/* Visual indicator using shadcn Progress component */}
            <Progress
              value={Math.min(100, Math.max(0, savingsRate))}
              className="h-1.5 mt-3"
              indicatorClassName={cn(
                savingsRate >= 20 ? "bg-emerald-500" : savingsRate > 0 ? "bg-amber-500" : "bg-rose-500"
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bento grid of 6 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Cash flow Area chart */}
        <IncomeExpenseTrendChart data={trendData} monthsCount={monthsCount} currency={currency} />

        {/* 2. Category Breakdown Pie chart */}
        <CategoryBreakdownChart data={breakdownData} currency={currency} />

        {/* 3. Spending day Bar chart */}
        <SpendingDayChart data={spendingDayData} currency={currency} />

        {/* 4. Wallet History line chart */}
        <WalletHistoryChart data={walletHistoryData} wallets={wallets} currency={currency} />

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
