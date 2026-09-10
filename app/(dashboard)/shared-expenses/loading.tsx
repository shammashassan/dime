import { Skeleton } from "@/components/ui/skeleton"

export function SharedExpensesSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-52 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="flex flex-wrap gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-50 rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
          />
        ))}
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-full sm:w-60 rounded-xl" />
      </div>

      {/* Content List Skeleton */}
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}

export default function SharedExpensesLoading() {
  return <SharedExpensesSkeleton />
}
