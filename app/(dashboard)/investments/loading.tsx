import { Skeleton } from "@/components/ui/skeleton"

export function InvestmentsSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* ── Header Row ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <Skeleton className="size-9 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-32 rounded-xl flex-1 sm:flex-initial" />
          <Skeleton className="h-9 w-44 rounded-xl flex-1 sm:flex-initial" />
        </div>
      </div>

      {/* ── Metric Summary Row (5 cards matching PortfolioSummary) ── */}
      <div className="flex flex-wrap gap-4 w-full">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[76px] flex-1 min-w-[200px] rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
          />
        ))}
      </div>

      {/* ── Tab Selector (Matching responsive scrollable tab bar) ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 items-start sm:items-center justify-between w-full min-w-0">
        <div className="w-full sm:w-auto min-w-0 rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <div className="flex items-center gap-1 overflow-hidden">
            <Skeleton className="h-7 w-20 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-36 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-32 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
            <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Bento Grid: 7 Cards matching investments-view overview tab ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {/* Top Row: Allocation (2 cols) + Quick Actions (1 col) */}
        <div className="lg:col-span-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>

        {/* Middle Row: Performance (2 cols) + Top Performers (1 col) */}
        <div className="lg:col-span-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>

        {/* Bottom Row: Top Holdings (1 col) + Top Accounts (1 col) + Recent Transactions (md:col-span-2 lg:col-span-1) */}
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export default function InvestmentsLoading() {
  return <InvestmentsSkeleton />
}
