import { Skeleton } from "@/components/ui/skeleton"

export function AssetDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-11 rounded-2xl shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-44 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[90px] flex-1 rounded-2xl"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* ── Left column: 4 cards ── */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">

          {/* Card 1: Item Information */}
          <div className="rounded-2xl border border-border/40 overflow-hidden shrink-0">
            {/* header strip */}
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-sm" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            {/* 2×2 field grid */}
            <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-2.5 w-16 rounded-sm" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: AI Valuation Insights */}
          <div className="rounded-2xl border border-border/40 overflow-hidden shrink-0">
            {/* header strip */}
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 rounded-sm" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            {/* body */}
            <div className="p-4 flex flex-col gap-3">
              {/* 2-col mini stat grid */}
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
              {/* narrative paragraph */}
              <div className="border-l-2 border-border/40 pl-3 py-0.5 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-5/6 rounded-md" />
                <Skeleton className="h-3 w-4/6 rounded-md" />
              </div>
              {/* recommendation box */}
              <div className="rounded-xl border border-border/30 p-3 flex items-start gap-2.5">
                <Skeleton className="size-6 rounded-lg shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-2.5 w-24 rounded-sm" />
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-3 w-4/5 rounded-md" />
                </div>
              </div>
            </div>
            {/* footer strip */}
            <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between">
              <Skeleton className="h-3 w-36 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>

          {/* Card 3: Attachments */}
          <div className="rounded-2xl border border-border/40 overflow-hidden shrink-0 opacity-75">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-sm" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <div className="p-4 flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
            </div>
          </div>

          {/* Card 4: Market Sync */}
          <div className="rounded-2xl border border-border/40 overflow-hidden flex-1 flex flex-col">
            {/* header */}
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 rounded-sm" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4.5 w-20 rounded-md" />
            </div>
            {/* content */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                {/* Market Symbol row */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-5 w-12 rounded-md" />
                    <Skeleton className="h-3 w-8 rounded-md" />
                  </div>
                </div>
                {/* Current Valuation row */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                {/* Last Synced row */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              {/* Sync button */}
              <Skeleton className="h-8 w-full rounded-xl mt-1" />
            </div>
          </div>
        </div>

        {/* ── Right column: 3 cards ── */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">

          {/* Card 1: Valuation Trend chart */}
          <div className="rounded-2xl border border-border/40 overflow-hidden shrink-0">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 rounded-sm" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
              <Skeleton className="h-7 w-30 rounded-lg" />
            </div>
            <div className="p-4">
              {/* chart area */}
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          </div>

          {/* Card 2: Valuation Timeline */}
          <div className="rounded-2xl border border-border/40 overflow-hidden flex-1 flex flex-col min-h-[160px]">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 rounded-sm" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-12 rounded-md" />
                <Skeleton className="h-7 w-22 rounded-lg" />
              </div>
            </div>
            {/* timeline rows */}
            <div className="flex flex-col divide-y divide-border/30">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="size-8 rounded-xl shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-20 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                      <Skeleton className="h-4 w-12 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="size-6 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Valuation Health & Diagnostics */}
          <div className="rounded-2xl border border-border/40 overflow-hidden shrink-0">
            {/* header */}
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 rounded-sm" />
                <Skeleton className="h-3 w-44 rounded-md" />
              </div>
              <Skeleton className="h-5 w-28 rounded-md" />
            </div>
            {/* body */}
            <div className="p-4 flex flex-col gap-3.5">
              {/* Progress rows */}
              <div className="flex flex-col gap-2.5">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-40 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
              {/* 3-cell micro stat grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/20">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/30 bg-muted/20 p-2 flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-full rounded-sm" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-2.5 w-1/2 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssetDetailLoading() {
  return <AssetDetailSkeleton />
}

