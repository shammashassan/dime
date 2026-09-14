import { Skeleton } from "@/components/ui/skeleton"

export function StatsSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[90px] flex-1 min-w-[200px] rounded-2xl"
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        />
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <StatsSkeleton />

      {/* Tabs */}
      <Skeleton className="h-10 w-96 rounded-xl" />

      {/* Table */}
      <TableSkeleton />
    </div>
  )
}

