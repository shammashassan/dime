import { Skeleton } from "@/components/ui/skeleton"

export default function SharedExpenseDetailLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-11 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-44 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Settlement Progress Card */}
      <div className="rounded-2xl border border-border/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Row 1: Info · Allocation · Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>

      {/* Row 2: Wallet · Paid vs Owed · Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  )
}

