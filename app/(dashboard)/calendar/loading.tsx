import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-5 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="flex flex-wrap gap-4 w-full">
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-44 rounded-2xl" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48 rounded-2xl" />
          <Skeleton className="h-9 w-20 rounded-2xl" />
        </div>
      </div>

      {/* Month Grid Skeleton */}
      <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  )
}
