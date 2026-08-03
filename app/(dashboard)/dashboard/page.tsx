import { Suspense } from "react"
import { LayoutDashboard } from "lucide-react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { SpendingTrendChart } from "@/components/dashboard/spending-trend-chart"
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown"
import { BudgetProgressList } from "@/components/dashboard/budget-progress-list"
import { UpcomingRecurring } from "@/components/dashboard/upcoming-recurring"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { getDailyIncomeExpenseTrend, getCategoryBreakdown } from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { Skeleton } from "@/components/ui/skeleton"
import { AIInsights } from "@/components/dashboard/ai-insights"


function MetricsRowSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-[380px] w-full rounded-xl" />
}

export default async function DashboardPage() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  // Parallel fetching for the client chart components (prefetch 90 days daily trend for client-side filtering)
  const [trendData, breakdownData, prefs] = await Promise.all([
    getDailyIncomeExpenseTrend(userId),
    getCategoryBreakdown(userId),
    getPreferences(userId),
  ])

  const targetCurrency = prefs?.defaultCurrency || "USD"

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back, {session.user.name}. Here is a summary of your financial status.
            </p>
          </div>
        </div>
      </div>

      {/* Top row: Metrics */}
      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<MetricsRowSkeleton />}>
          <DashboardMetrics userId={userId} />
        </Suspense>
      </div>

      {/* AI Insights and Category Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <AIInsights userId={userId} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<ChartSkeleton />}>
            <CategoryBreakdown data={breakdownData} currency={targetCurrency} />
          </Suspense>
        </div>
      </div>

      {/* Cash flow trend chart row */}
      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <SpendingTrendChart initialData={trendData} currency={targetCurrency} />
        </Suspense>
      </div>

      {/* Lists row: Budgets and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <BudgetProgressList userId={userId} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <UpcomingRecurring userId={userId} />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <RecentTransactions userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
