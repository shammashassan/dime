import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getCategories } from "@/lib/queries/categories"
import { CategoriesView } from "@/components/categories/categories-view"
import { Skeleton } from "@/components/ui/skeleton"
import { unstable_rethrow } from "next/navigation"

import { serializeData } from "@/lib/utils"


import { CategoriesSkeleton } from "./loading"

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
