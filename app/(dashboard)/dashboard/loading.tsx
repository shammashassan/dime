import { Skeleton } from "@/components/ui/skeleton"

export function MetricsRowSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton
          key={i}
          className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
        />
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return <Skeleton className="h-[380px] w-full rounded-xl" />
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
      </div>

      {/* Top row: Metrics */}
      <div className="grid grid-cols-1 gap-6">
        <MetricsRowSkeleton />
      </div>

      {/* AI Insights and Category Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-1">
          <ChartSkeleton />
        </div>
      </div>

      {/* Cash flow trend chart row */}
      <div className="grid grid-cols-1 gap-6">
        <ChartSkeleton />
      </div>

      {/* Lists row: Budgets and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
      </div>
    </div>
  )
}
