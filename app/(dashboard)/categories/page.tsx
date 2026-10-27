import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories",
  description: "Customize income and expense categories, subcategories, and color codes.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getCategories } from "@/lib/queries/categories"
import { CategoriesView } from "@/components/categories/categories-view"
import { unstable_rethrow } from "next/navigation"

import { serializeData } from "@/lib/utils"



export default async function CategoriesPage() {
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
