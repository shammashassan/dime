import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-5 w-full animate-pulse">
      {/* ── 1. Header Skeleton ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-40 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-xl self-start md:self-center" />
      </div>

      {/* ── 2. Metric Cards Row Skeleton ── */}
      <div className="flex flex-wrap gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-[74px] rounded-2xl flex-1 min-w-[200px]"
            style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          />
        ))}
      </div>

      {/* ── 3. Search & Operators Bar Skeleton ── */}
      <div className="flex flex-col gap-3 w-full bg-card rounded-2xl border border-border/50 p-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
          <Skeleton className="h-6 w-24 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-lg" />
        </div>
      </div>

      {/* ── 4. Tabs Switcher Skeleton ── */}
      <Skeleton className="h-10 w-full rounded-2xl" />

      {/* ── 5. Results Grid Skeleton ── */}
      <div className="flex flex-col gap-6 mt-1">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
