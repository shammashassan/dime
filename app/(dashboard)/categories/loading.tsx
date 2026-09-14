import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Custom Categories Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-4 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </section>

      {/* System Categories Section */}
      <section>
        <Separator className="mb-5 opacity-40" />
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function CategoriesLoading() {
  return <CategoriesSkeleton />
}

