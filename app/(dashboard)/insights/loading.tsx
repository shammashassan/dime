import { Skeleton } from "@/components/ui/skeleton"

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      {/* Bento Hero Row: 2-col Briefing + 1-col Signal Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <Skeleton className="lg:col-span-2 h-56 w-full rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-56 w-full rounded-2xl" />
      </div>

      {/* Tab Selector Pills */}
      <Skeleton className="h-10 w-96 rounded-xl" />

      {/* Bento Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
