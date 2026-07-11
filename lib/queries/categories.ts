import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Category } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

export const getCategories = cache(async (userId: string): Promise<Category[]> => {
  const scope = await getFinancialScope()
  const scopeFilter = getScopeFilter(scope)
  const categoriesColl = await getCollection<Category>("categories")
  
  const filter = {
    $or: [
      scopeFilter,
      { userId: null } // System default categories
    ]
  }

  return categoriesColl.find(filter).sort({ name: 1 }).toArray()
})

export const getCategoryById = cache(async (userId: string, categoryId: string): Promise<Category | null> => {
  try {
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)
    const categoriesColl = await getCollection<Category>("categories")
    
    const filter = {
      _id: new ObjectId(categoryId),
      $or: [
        scopeFilter,
        { userId: null } // System default categories
      ]
    }

    return categoriesColl.findOne(filter)
  } catch {
    return null
  }
})
