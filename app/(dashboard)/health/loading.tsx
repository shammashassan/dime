import { Skeleton } from "@/components/ui/skeleton"

export default function HealthLoading() {
  return (
    <div className="flex flex-col gap-5 w-full pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-9 w-44 rounded-xl shrink-0" />
      </div>

      {/* Summary Metric Cards Row (2/2 on medium screens) */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-20 rounded-2xl flex-1 min-w-50"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Bento Row 1: Hero (1 col) + History Chart (2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <Skeleton className="lg:col-span-1 h-72 rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
      </div>

      {/* Bento Row 2: Recommendations (2 cols) + Score Optimizer (1 col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-72 rounded-2xl" />
      </div>

      {/* Bento Row 3: 5 Pillars + Methodology (6 Bento cards) */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
