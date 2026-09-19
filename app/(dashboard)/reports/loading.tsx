import { Skeleton } from "@/components/ui/skeleton"

export function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
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
        <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* MetricCards row: 5 items */}
      <div className="flex flex-wrap gap-4 w-full">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[74px] flex-1 min-w-[200px] rounded-2xl"
          />
        ))}
      </div>

      {/* Nav Tabs Skeleton */}
      <Skeleton className="h-9 w-80 rounded-2xl" />

      {/* 3-Column Asymmetric Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch w-full">
        {/* Tier 1: 2 : 1 */}
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />

        {/* Tier 2: 2 : 1 */}
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />

        {/* Tier 3: 1 : 2 */}
        <Skeleton className="lg:col-span-1 h-[340px] rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl" />

        {/* Tier 4: Ledger Table (3 cols full width) */}
        <Skeleton className="col-span-1 md:col-span-2 lg:col-span-3 h-[300px] rounded-2xl" />
      </div>
    </div>
  )
}

export default function ReportsLoading() {
  return <ReportsSkeleton />
}
