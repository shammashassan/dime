import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-64 rounded-lg md:h-9" />
        </div>
        <Skeleton className="h-4 w-44 rounded" />
      </div>

      {/* Row 0: Focus Strip Skeleton */}
      <div className="flex flex-wrap gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[74px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Row 1: Command Center & Quick Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[155px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-7 w-28 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        </Card>
        <Card className="lg:col-span-1 h-[155px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-8.5 w-full rounded-md" />
        </Card>
      </div>

      {/* Row 2: Loan Action & Financial Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[260px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-border/40 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-9 rounded-md" />
              <Skeleton className="h-9 rounded-md" />
            </div>
            <Skeleton className="h-8.5 rounded-md" />
          </div>
        </Card>
        <div className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden h-[260px] flex flex-col lg:col-span-1">
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <div className="px-3 pt-2 pb-1 flex-1 flex flex-col items-center justify-center min-h-[120px]">
            <Skeleton className="w-[180px] h-[90px] rounded-t-full" />
          </div>
          <div className="h-[56px] w-full border-t border-border/30 bg-muted/5 px-3 py-2 flex items-center justify-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* Row 3: Executive KPI Benchmark Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-[105px] p-4.5 border-border/50 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <Skeleton className="h-7 w-32 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Row 4: Core Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[380px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-5 w-36 rounded" />
            </div>
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </Card>
        <Card className="lg:col-span-1 h-[380px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
            </div>
            <Skeleton className="size-7 rounded-md" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </Card>
      </div>

      {/* Row 5: AI Spending Insights & Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[360px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-start pb-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded" />
          </div>
          <div className="flex flex-col gap-2 my-auto">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="h-4 w-32 rounded" />
        </Card>
        <Card className="lg:col-span-1 h-[360px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <Skeleton className="size-7 rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 my-auto">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
          <Skeleton className="h-7 w-full rounded-md" />
        </Card>
      </div>

      {/* Row 6: Live Operations & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[300px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
          <div className="flex flex-col gap-2 my-auto">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
          <Skeleton className="h-4 w-36 rounded" />
        </Card>
        <Card className="h-[300px] p-5 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
          <div className="flex flex-col gap-2 my-auto">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
          <Skeleton className="h-4 w-36 rounded" />
        </Card>
      </div>

      {/* Row 7: Recent Transactions Stream */}
      <Card className="h-[320px] p-5 border-border/50 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-3 w-52 rounded" />
          </div>
          <Skeleton className="h-7 w-24 rounded" />
        </div>
        <div className="flex flex-col gap-2 my-auto">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <Skeleton className="h-4 w-28 rounded" />
      </Card>
    </div>
  )
}

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
  return <DashboardSkeleton />
}
