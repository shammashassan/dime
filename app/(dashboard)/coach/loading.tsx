import { Skeleton } from "@/components/ui/skeleton"

export default function CoachLoading() {
  return (
    <div className="flex flex-col gap-5 w-full">
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
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Safety Banner Skeleton */}
      <Skeleton className="h-8 w-full rounded-xl" />

      {/* Summary Metric Cards Row */}
      <div className="flex flex-wrap gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[84px] rounded-2xl flex-1 min-w-[200px]"
            style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(25% - 1rem))" }}
          />
        ))}
      </div>

      {/* Executive Briefing Hero Card Skeleton */}
      <Skeleton className="h-48 w-full rounded-2xl" />

      {/* Playbooks Tabs & Grid Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-80 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
