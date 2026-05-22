import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-pulse">
      {/* Title & Description */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-xl" />
      </div>

      {/* Grid Layout (Vertical Tabs matching settings-view layout) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start w-full">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 border border-border/40 bg-card rounded-2xl p-3 shadow-md space-y-2.5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Content Card */}
        <div className="md:col-span-3 w-full border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden p-6 space-y-6">
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
