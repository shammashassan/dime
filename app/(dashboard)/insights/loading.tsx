import { Skeleton } from "@/components/ui/skeleton"

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-56 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="flex flex-wrap gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Tab Selector Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-96 rounded-2xl" />
      </div>

      {/* Master Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {/* Row 1: Briefing (2 cols) + Radar (1 col) */}
        <Skeleton className="lg:col-span-2 h-64 w-full rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-64 w-full rounded-2xl" />

        {/* Row 2: High Impact Signals (2 cols) + Quick Actions (1 col) */}
        <Skeleton className="lg:col-span-2 h-72 w-full rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-72 w-full rounded-2xl" />

        {/* Row 3: 3 Column Cards */}
        <Skeleton className="lg:col-span-1 h-56 w-full rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-56 w-full rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-56 w-full rounded-2xl" />
      </div>
    </div>
  )
}

