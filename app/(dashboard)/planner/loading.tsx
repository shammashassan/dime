import { Skeleton } from "@/components/ui/skeleton"

export default function PlannerLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-52 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:ml-auto md:justify-end">
          <Skeleton className="w-full sm:w-48 h-10 rounded-xl" />
          <Skeleton className="w-full sm:w-32 h-10 rounded-xl" />
          <Skeleton className="w-full sm:w-32 h-10 rounded-xl" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Controls Skeleton */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Tab Selector Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start gap-1">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
        <div className="sm:hidden w-full">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>

      {/* Chart & Insights Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
