import { Skeleton } from "@/components/ui/skeleton"

export function LoansSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-xl w-full md:w-auto" />
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
          />
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start gap-1">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
        <div className="sm:hidden w-full">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-9 w-full sm:w-60 rounded-xl" />
      </div>

      {/* Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function LoansLoading() {
  return <LoansSkeleton />
}
