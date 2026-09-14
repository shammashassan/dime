import { Skeleton } from "@/components/ui/skeleton"

export function NetWorthSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Tab Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start gap-1">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-44 rounded-lg" />
        </div>
        <div className="sm:hidden w-full">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Bento Grid: 9 Cards matching DEFAULT_BENTO_LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {/* Row 1: Timeline (2 cols) + Health (1 col) */}
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />

        {/* Row 2: Recent Activity (2 cols) + Quick Actions (1 col) */}
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />

        {/* Row 3: Insights (2 cols) + Asset Allocation (1 col) */}
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />

        {/* Row 4: Currency Allocation (1 col) + Top Assets (1 col) + Top Liabilities (1 col) */}
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />
      </div>
    </div>
  )
}

export default function NetWorthLoading() {
  return <NetWorthSkeleton />
}
