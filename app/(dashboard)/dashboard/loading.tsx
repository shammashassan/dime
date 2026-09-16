import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
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
      <div className="w-full">
        <div className="flex sm:hidden gap-3 overflow-hidden">
          <Skeleton className="h-[74px] basis-[82%] shrink-0 rounded-2xl" />
          <Skeleton className="h-[74px] basis-[82%] shrink-0 rounded-2xl" />
        </div>
        <div className="hidden sm:flex flex-wrap gap-4 w-full">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-[74px] flex-1 min-w-[200px] rounded-2xl"
              style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
            />
          ))}
        </div>
      </div>

      {/* Row 1: Executive KPI Benchmark Strip */}
      <div className="flex flex-wrap gap-4 w-full">
        {[...Array(3)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[74px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Row 2: Command Center & Quick Log */}
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

      {/* Row 3: Analytics Tier — Cash Flow Trajectory & Category Breakdown (2 : 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/50 flex flex-col justify-between">
          <div className="flex justify-between items-center p-5 pb-2 border-b border-border/30">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
          <div className="p-5 pt-2">
            <Skeleton className="h-47.5 w-full rounded-xl" />
          </div>
        </Card>
        <Card className="lg:col-span-1 border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0 flex flex-col justify-between">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3.5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="px-3 pt-2 pb-1 flex-1 flex flex-col items-center justify-center min-h-[140px]">
            <Skeleton className="size-[136px] rounded-full" />
          </div>
          <div className="h-[56px] w-full border-t border-border/30 bg-muted/5 px-3 py-2 flex items-center justify-center gap-2">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        </Card>
      </div>

      {/* Row 4: Health & Obligations Tier — Financial Health Gauge & Loan Action (1 : 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs overflow-hidden h-[260px] flex flex-col justify-between p-0 py-0 gap-0 lg:col-span-1">
          <div className="flex justify-between items-center px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="px-3 pt-2 pb-1 flex-1 flex flex-col items-center justify-center min-h-[120px]">
            <Skeleton className="w-[180px] h-[90px] rounded-t-full" />
          </div>
          <div className="h-[56px] w-full border-t border-border/30 bg-muted/5 px-3 py-2 flex items-center justify-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </Card>
        <Card className="lg:col-span-2 h-[260px] border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0 flex flex-col justify-between">
          <div className="flex justify-between items-center px-5 py-3 border-b border-border/40">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
            <div className="flex flex-col gap-3 border-t border-border/40 pt-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-9 rounded-md" />
                <Skeleton className="h-9 rounded-md" />
              </div>
              <Skeleton className="h-8.5 rounded-md" />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 5: Intelligence & Goals Tier — AI Insights & Active Goals (2 : 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs overflow-hidden h-full flex flex-col p-0 py-0 gap-0 lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="p-4 flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-8.5 rounded-xl shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3.5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2.5 w-36 rounded" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-3.5 w-14 rounded" />
                <Skeleton className="h-3.5 w-10 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-8.5 rounded-xl shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-3.5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-2.5 w-40 rounded" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-3.5 w-16 rounded" />
                <Skeleton className="h-3.5 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="lg:col-span-1 border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0 flex flex-col justify-between">
          <div className="flex justify-between items-center px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="p-4 flex-1 flex flex-col gap-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </Card>
      </div>

      {/* Row 6: Live Operations & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[225px] border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0 flex flex-col justify-between">
          <div className="flex justify-between items-center px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <div className="flex flex-col gap-2 p-4 my-auto">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </Card>
        <Card className="h-[225px] border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0 flex flex-col justify-between">
          <div className="flex justify-between items-center px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <div className="flex flex-col gap-2.5 p-4 my-auto">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </Card>
      </div>

      {/* Row 7: Recent Transactions Stream */}
      <Card className="border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <Skeleton className="h-3 w-14 rounded" />
        </div>
        <div>
          <div className="h-9 bg-muted/30 border-b border-border/40 flex items-center px-5 gap-4">
            <Skeleton className="h-2.5 w-20 rounded" />
            <Skeleton className="h-2.5 w-16 rounded hidden sm:block" />
            <Skeleton className="h-2.5 w-16 rounded hidden md:block" />
            <Skeleton className="h-2.5 w-12 rounded ml-auto" />
            <Skeleton className="h-2.5 w-14 rounded" />
          </div>
          <div className="divide-y divide-border/40">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center px-5 py-2.5 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="h-2 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-full hidden sm:block" />
                <Skeleton className="h-4 w-14 rounded-full hidden md:block" />
                <Skeleton className="h-2.5 w-14 rounded" />
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="size-3.5 rounded" />
              </div>
            ))}
          </div>
        </div>
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
