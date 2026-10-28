import { cache } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Category } from "@/types"
import { getFinancialScope } from "@/lib/scope"
import { serializeData } from "@/lib/utils"

async function fetchCategories(userId: string, orgId?: string | null): Promise<Category[]> {
  "use cache"
  cacheTag("categories", `categories-${userId}`)
  cacheLife("hours")

  const categoriesColl = await getCollection<Category>("categories")
  const scopeFilter = orgId
    ? { organizationId: orgId }
    : {
        userId,
        $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
      }

  const filter = {
    $or: [
      scopeFilter,
      { userId: null }, // System default categories
    ],
  }

  const docs = await categoriesColl.find(filter).sort({ name: 1 }).toArray()
  return serializeData(docs)
}

export const getCategories = cache(async (userId: string): Promise<Category[]> => {
  const scope = await getFinancialScope()
  return fetchCategories(userId, scope.organizationId)
})

async function fetchCategoryById(
  userId: string,
  categoryId: string,
  orgId?: string | null
): Promise<Category | null> {
  "use cache"
  cacheTag("categories", `categories-${userId}`)
  cacheLife("hours")

  try {
    const categoriesColl = await getCollection<Category>("categories")
    const scopeFilter = orgId
      ? { organizationId: orgId }
      : {
          userId,
          $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
        }

    const filter = {
      _id: new ObjectId(categoryId),
      $or: [
        scopeFilter,
        { userId: null }, // System default categories
      ],
    }

    const doc = await categoriesColl.findOne(filter)
    return doc ? serializeData(doc) : null
  } catch {
    return null
  }
}

export const getCategoryById = cache(async (userId: string, categoryId: string): Promise<Category | null> => {
  const scope = await getFinancialScope()
  return fetchCategoryById(userId, categoryId, scope.organizationId)
})
