import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Header with Icon Box */}
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-14 rounded-2xl shrink-0" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-xl" />
        </div>
      </div>

      {/* Tabs Layout matching settings-view */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Navigation Tabs List (horizontal on mobile, vertical w-60 on lg) */}
        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible w-full lg:w-60 lg:shrink-0 border border-border/40 bg-card rounded-2xl p-1.5 shadow-md gap-1">
          <Skeleton className="h-10 w-28 lg:w-full rounded-xl shrink-0" />
          <Skeleton className="h-10 w-32 lg:w-full rounded-xl shrink-0" />
          <Skeleton className="h-10 w-28 lg:w-full rounded-xl shrink-0" />
          <Skeleton className="h-10 w-36 lg:w-full rounded-xl shrink-0" />
          <Skeleton className="h-10 w-28 lg:w-full rounded-xl shrink-0" />
          <Skeleton className="h-10 w-36 lg:w-full rounded-xl shrink-0" />
        </div>

        {/* Content Card */}
        <div className="flex-1 w-full border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
