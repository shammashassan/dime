import { Skeleton } from "@/components/ui/skeleton"

export function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Filters Bar Skeleton */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/40 bg-card/40">
        <div className="flex flex-wrap gap-2.5 items-center">
          <Skeleton className="h-10 flex-1 min-w-[200px] rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 items-center gap-4 px-4 py-3 border-b border-border/40 bg-muted/20 text-xs font-semibold">
          <div className="col-span-1 flex items-center justify-center">
            <Skeleton className="size-4 rounded" />
          </div>
          <div className="col-span-4">
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <div className="col-span-1 text-right">
            <Skeleton className="h-4 w-14 rounded ml-auto" />
          </div>
          <div className="col-span-1 text-right">
            <Skeleton className="h-4 w-8 rounded ml-auto" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/30">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-4 px-4 py-3.5">
              <div className="col-span-1 flex items-center justify-center">
                <Skeleton className="size-4 rounded" />
              </div>
              <div className="col-span-4 flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-full shrink-0" />
                <div className="flex flex-col gap-1 w-full max-w-[180px]">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
              </div>
              <div className="col-span-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="col-span-1">
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="col-span-1 text-right">
                <Skeleton className="h-4 w-16 rounded ml-auto" />
              </div>
              <div className="col-span-1 text-right">
                <Skeleton className="size-6 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Footer Skeleton */}
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 p-1 sm:flex-row sm:gap-8 py-2">
        <Skeleton className="h-4 w-44 rounded-md" />
        <div className="flex items-center gap-4 sm:gap-6">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function TransactionsLoading() {
  return <TransactionsSkeleton />
}
