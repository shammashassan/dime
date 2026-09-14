import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full md:w-36 rounded-xl" />
      </div>

      <Separator />

      {/* Content skeleton */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-2xl">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="size-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-10 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsLoading() {
  return <NotificationsSkeleton />
}

