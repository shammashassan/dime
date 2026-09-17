import { Skeleton } from "@/components/ui/skeleton"

export function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>

        {/* Global Filter Component Skeleton */}
        <div className="flex flex-col lg:items-end 2xl:flex-row 2xl:items-center gap-2.5 self-start lg:self-center shrink-0">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-44 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* MetricCards row */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 0.75rem))" }}
          />
        ))}
      </div>

      {/* Bento grid of 6 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[380px] w-full rounded-2xl" />
        ))}
      </div>

      {/* Monthly Summary Table Skeleton */}
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  )
}

export default function ReportsLoading() {
  return <ReportsSkeleton />
}
