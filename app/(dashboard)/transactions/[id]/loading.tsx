import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionDetailLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div>
        <Skeleton className="h-4 w-36 mb-3 rounded-md" />
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      <div className="p-6 rounded-2xl border border-border/40 shadow-xs flex flex-col gap-6">
        {/* Top amount and category banner */}
        <div className="flex items-center justify-between pb-6 border-b border-border/20">
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-14 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>

        {/* Detail attributes list */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
          ))}
        </div>

        {/* Action buttons footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
