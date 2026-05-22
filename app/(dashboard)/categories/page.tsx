import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getCategories } from "@/lib/queries/categories"
import { CategoriesView } from "@/components/categories/categories-view"
import { Skeleton } from "@/components/ui/skeleton"
import { unstable_rethrow } from "next/navigation"

import { serializeData } from "@/lib/utils"


function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

async function CategoriesContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let categories: any[] = []

  try {
    categories = await getCategories(userId)
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load categories:", error)
  }

  return <CategoriesView categories={serializeData(categories)} />
}

export default async function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent />
    </Suspense>
  )
}
