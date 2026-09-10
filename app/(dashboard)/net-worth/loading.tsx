import { Skeleton } from "@/components/ui/skeleton"

export function NetWorthSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full animate-pulse">
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
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>

      {/* Tab Selector */}
      <Skeleton className="h-9 w-64 rounded-xl" />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />
      </div>
    </div>
  )
}

export default function NetWorthLoading() {
  return <NetWorthSkeleton />
}
