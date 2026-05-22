import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Category } from "@/types"

export const getCategories = cache(async (userId: string): Promise<Category[]> => {
  const categoriesColl = await getCollection<Category>("categories")
  return categoriesColl.find({
    $or: [{ userId }, { userId: null }]
  }).sort({ name: 1 }).toArray()
})

export const getCategoryById = cache(async (userId: string, categoryId: string): Promise<Category | null> => {
  try {
    const categoriesColl = await getCollection<Category>("categories")
    return categoriesColl.findOne({
      _id: new ObjectId(categoryId),
      $or: [{ userId }, { userId: null }]
    })
  } catch (err) {
    return null
  }
})
