import { Skeleton } from "@/components/ui/skeleton"

export default function TimelineLoading() {
  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* ── 1. Header Skeleton ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Title & Badge */}
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-md border border-primary/20 bg-primary/5" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>
        </div>

        {/* Controls: Date Filter & Export */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto shrink-0 justify-start xl:justify-end flex-wrap sm:flex-nowrap">
          <Skeleton className="h-10 w-48 sm:w-56 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* ── 2. Metric Cards Banner Skeleton (Exact Responsive Split) ── */}
      <div className="flex flex-wrap gap-4 w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 p-4 rounded-2xl border border-border/40 bg-card/40 flex flex-col justify-between gap-3 h-28"
            style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
        ))}
      </div>

      {/* ── 3. Adaptive Tabs & Same-Line Search Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 items-start sm:items-center justify-between w-full min-w-0">
        {/* Adaptive Tab Bar */}
        <div className="w-full sm:w-auto min-w-0 rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-lg shrink-0" />
            ))}
          </div>
        </div>

        {/* Search Input on the same line */}
        <div className="w-full sm:w-64 md:w-72 shrink-0">
          <Skeleton className="h-10 w-full rounded-xl border border-border/40" />
        </div>
      </div>

      {/* ── 4. Feed Spine & Event Items Skeleton ── */}
      <div className="flex flex-col gap-8 w-full mt-1">
        {Array.from({ length: 2 }).map((_, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-3">
            {/* Date Group Header */}
            <div className="flex items-center justify-between py-1.5 px-1 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary/40" />
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-6 rounded-md" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>

            {/* Event Items in Spine */}
            <div className="flex flex-col gap-2.5 pl-2 sm:pl-3 border-l-2 border-border/40 ml-1">
              {Array.from({ length: 3 }).map((_, eIdx) => (
                <div
                  key={eIdx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/40 shadow-2xs"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <Skeleton className="size-10 rounded-xl shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-36 sm:w-48 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-56 max-w-full rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="size-6 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
