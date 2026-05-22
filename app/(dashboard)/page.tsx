import { Suspense } from "react"
import { LayoutDashboard } from "lucide-react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { NetWorthCard } from "@/components/dashboard/net-worth-card"
import { MonthlySummary } from "@/components/dashboard/monthly-summary"
import { SpendingTrendChart } from "@/components/dashboard/spending-trend-chart"
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown"
import { BudgetProgressList } from "@/components/dashboard/budget-progress-list"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { getDailyIncomeExpenseTrend, getCategoryBreakdown } from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { Skeleton } from "@/components/ui/skeleton"


function CardSkeleton() {
  return <Skeleton className="h-40 w-full rounded-xl" />
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
      <div className="flex items-center gap-3.5">
        <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
          <LayoutDashboard className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {session.user.name}. Here is a summary of your financial status.
          </p>
        </div>
      </div>

      {/* Top row: Net worth and Monthly stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Suspense fallback={<CardSkeleton />}>
            <NetWorthCard userId={userId} className="h-full" />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton />}>
            <MonthlySummary userId={userId} className="h-full" />
          </Suspense>
        </div>
      </div>

      {/* Charts row: Cash flow and Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <SpendingTrendChart initialData={trendData} currency={targetCurrency} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<ChartSkeleton />}>
            <CategoryBreakdown data={breakdownData} currency={targetCurrency} />
          </Suspense>
        </div>
      </div>

      {/* Lists row: Budgets and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Suspense fallback={<ChartSkeleton />}>
            <BudgetProgressList userId={userId} />
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
