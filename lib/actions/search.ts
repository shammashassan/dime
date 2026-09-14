"use server"

import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { searchEntities } from "@/lib/queries/search"
import {
  categoriesCollection,
  walletsCollection,
  savedSearchesCollection,
} from "@/lib/db/collections"
import {
  saveSearchSchema,
  deleteSearchSchema,
  SaveSearchInput,
} from "@/lib/validations/search.schema"
import type {
  UniversalSearchResults,
  SerializedSavedSearch,
  SearchEntityType,
} from "@/lib/search/types"

/**
 * Executes a universal search for the authenticated user.
 */
export async function universalSearchAction(
  query: string,
  limitPerEntity = 5,
  allowedEntities?: SearchEntityType[]
): Promise<UniversalSearchResults> {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id

    return await searchEntities(userId, query, {
      limitPerEntity,
      allowedEntities,
    })
  } catch (error) {
    console.error("universalSearchAction error:", error)
    return {
      totalCount: 0,
      items: [],
      countsByEntity: {
        transaction: 0,
        wallet: 0,
        budget: 0,
        goal: 0,
        loan: 0,
        contact: 0,
        recurring: 0,
        investment: 0,
        asset: 0,
        liability: 0,
        page: 0,
      },
      parsedQuery: {
        rawQuery: query,
        textQuery: query,
        operators: {},
        activeBadges: [],
      },
    }
  }
}

/**
 * Retrieves all saved searches for the authenticated user.
 */
export async function getSavedSearchesAction(): Promise<SerializedSavedSearch[]> {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)

    const list = await savedSearchesCollection
      .find({
        ...scopeFilter,
        userId,
      })
      .sort({ createdAt: -1 })
      .toArray()

    return list.map((s) => ({
      id: s._id ? s._id.toString() : "",
      name: s.name,
      query: s.query,
      createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: s.updatedAt ? s.updatedAt.toISOString() : new Date().toISOString(),
    }))
  } catch (error) {
    console.error("getSavedSearchesAction error:", error)
    return []
  }
}

/**
 * Saves a search query for quick reuse.
 */
export async function saveSearchAction(input: SaveSearchInput) {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id
    const scope = await getFinancialScope()

    const validated = saveSearchSchema.parse(input)

    const doc = {
      userId,
      organizationId: scope.organizationId || null,
      name: validated.name,
      query: validated.query,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const res = await savedSearchesCollection.insertOne(doc)
    revalidatePath("/search")

    return {
      success: true,
      id: res.insertedId.toString(),
    }
  } catch (error) {
    console.error("saveSearchAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save search",
    }
  }
}

/**
 * Deletes a saved search by ID.
 */
export async function deleteSavedSearchAction(id: string) {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)

    const validated = deleteSearchSchema.parse({ id })

    await savedSearchesCollection.deleteOne({
      _id: new ObjectId(validated.id),
      ...scopeFilter,
      userId,
    })

    revalidatePath("/search")
    return { success: true }
  } catch (error) {
    console.error("deleteSavedSearchAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete saved search",
    }
  }
}

/**
 * Suggestions for autocomplete chips: user categories, wallets, and popular operators.
 */
export async function getSearchSuggestionsAction() {
  try {
    const session = await requireApprovedUser()
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)

    const [categories, wallets] = await Promise.all([
      categoriesCollection.find({ ...scopeFilter }).project({ name: 1 }).limit(10).toArray(),
      walletsCollection.find({ ...scopeFilter, isArchived: false }).project({ name: 1 }).limit(10).toArray(),
    ])

    return {
      categories: categories.map((c) => c.name),
      wallets: wallets.map((w) => w.name),
      operators: [
        { label: "amount>", syntax: "amount>50", description: "Transactions over $50" },
        { label: "category:", syntax: "category:Food", description: "Filter by category" },
        { label: "date:", syntax: "date:this-month", description: "Current month records" },
        { label: "status:overdue", syntax: "status:overdue", description: "Overdue bills or loans" },
        { label: "wallet:", syntax: "wallet:Cash", description: "Filter by account" },
        { label: "loan:active", syntax: "loan:active", description: "All active loans" },
        { label: "bill:overdue", syntax: "bill:overdue", description: "Unpaid overdue bills" },
        { label: "subscription:active", syntax: "subscription:active", description: "Active subscriptions" },
        { label: "type:expense", syntax: "type:expense", description: "All expense entries" },
      ],
    }
  } catch (error) {
    console.error("getSearchSuggestionsAction error:", error)
    return {
      categories: [],
      wallets: [],
      operators: [],
    }
  }
}
