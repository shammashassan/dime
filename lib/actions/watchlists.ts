"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import {
  createWatchlistSchema,
  addWatchlistItemSchema,
  updateWatchlistItemSchema,
  type CreateWatchlistInput,
  type AddWatchlistItemInput,
  type UpdateWatchlistItemInput,
} from "@/lib/validations/watchlist.schema"
import type { Watchlist, WatchlistItem } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"

export async function createWatchlistAction(
  rawInput: CreateWatchlistInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requireApprovedUser()
    const scope = await getFinancialScope()
    const validated = createWatchlistSchema.parse(rawInput)

    const watchlistsColl = await getCollection<Watchlist>("watchlists")

    const newWatchlist: Omit<Watchlist, "_id"> = {
      userId: session.user.id,
      organizationId: scope.organizationId,
      name: validated.name.trim(),
      description: "",
      sortOrder: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const res = await watchlistsColl.insertOne(newWatchlist as Watchlist)

    updateTag("watchlists")
    revalidatePath("/investments")
    return { success: true, id: res.insertedId.toString() }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create watchlist" }
  }
}

export async function deleteWatchlistAction(
  watchlistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireApprovedUser()
    const scope = await getFinancialScope()

    if (!ObjectId.isValid(watchlistId)) {
      return { success: false, error: "Invalid watchlist ID" }
    }

    const watchlistsColl = await getCollection<Watchlist>("watchlists")
    const itemsColl = await getCollection<WatchlistItem>("watchlist_items")

    const wOid = new ObjectId(watchlistId)
    const existing = await watchlistsColl.findOne({
      _id: wOid,
      ...getScopeFilter(scope),
    })

    if (!existing) {
      return { success: false, error: "Watchlist not found or unauthorized" }
    }

    await Promise.all([
      watchlistsColl.deleteOne({ _id: wOid }),
      itemsColl.deleteMany({ watchlistId }),
    ])

    updateTag("watchlists")
    revalidatePath("/investments")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete watchlist" }
  }
}

export async function addWatchlistItemAction(
  rawInput: AddWatchlistItemInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireApprovedUser()
    const scope = await getFinancialScope()
    const validated = addWatchlistItemSchema.parse(rawInput)

    if (!ObjectId.isValid(validated.watchlistId)) {
      return { success: false, error: "Invalid watchlist ID" }
    }

    const watchlistsColl = await getCollection<Watchlist>("watchlists")
    const itemsColl = await getCollection<WatchlistItem>("watchlist_items")

    const watchlist = await watchlistsColl.findOne({
      _id: new ObjectId(validated.watchlistId),
      ...getScopeFilter(scope),
    })

    if (!watchlist) {
      return { success: false, error: "Watchlist not found" }
    }

    // Check for duplicate symbol in the same watchlist
    const existing = await itemsColl.findOne({
      watchlistId: validated.watchlistId,
      symbol: validated.symbol,
    })

    if (existing) {
      return { success: false, error: `${validated.symbol} is already in this watchlist` }
    }

    const newItem: Omit<WatchlistItem, "_id"> = {
      watchlistId: validated.watchlistId,
      symbol: validated.symbol,
      name: validated.name.trim(),
      assetType: validated.assetType,
      sortOrder: 0,
      targetPrice: validated.targetPrice,
      notes: validated.notes?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const res = await itemsColl.insertOne(newItem as WatchlistItem)

    updateTag("watchlists")
    revalidatePath("/investments")
    return { success: true, id: res.insertedId.toString() }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add watchlist item" }
  }
}

export async function removeWatchlistItemAction(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireApprovedUser()
    const scope = await getFinancialScope()

    if (!ObjectId.isValid(itemId)) {
      return { success: false, error: "Invalid item ID" }
    }

    const itemsColl = await getCollection<WatchlistItem>("watchlist_items")
    const item = await itemsColl.findOne({ _id: new ObjectId(itemId) })
    if (!item) {
      return { success: false, error: "Item not found" }
    }

    // Verify ownership of the parent watchlist
    const watchlistsColl = await getCollection<Watchlist>("watchlists")
    const watchlist = await watchlistsColl.findOne({
      _id: new ObjectId(item.watchlistId),
      ...getScopeFilter(scope),
    })

    if (!watchlist) {
      return { success: false, error: "Unauthorized" }
    }

    await itemsColl.deleteOne({ _id: new ObjectId(itemId) })

    updateTag("watchlists")
    revalidatePath("/investments")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove watchlist item" }
  }
}

export async function updateWatchlistItemAction(
  itemId: string,
  rawInput: UpdateWatchlistItemInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireApprovedUser()
    const scope = await getFinancialScope()
    const validated = updateWatchlistItemSchema.parse(rawInput)

    if (!ObjectId.isValid(itemId)) {
      return { success: false, error: "Invalid item ID" }
    }

    const itemsColl = await getCollection<WatchlistItem>("watchlist_items")
    const item = await itemsColl.findOne({ _id: new ObjectId(itemId) })
    if (!item) {
      return { success: false, error: "Item not found" }
    }

    const watchlistsColl = await getCollection<Watchlist>("watchlists")
    const watchlist = await watchlistsColl.findOne({
      _id: new ObjectId(item.watchlistId),
      ...getScopeFilter(scope),
    })

    if (!watchlist) {
      return { success: false, error: "Unauthorized" }
    }

    const updateFields: Partial<WatchlistItem> = {}
    if (validated.symbol !== undefined) updateFields.symbol = validated.symbol
    if (validated.name !== undefined) updateFields.name = validated.name
    if (validated.assetType !== undefined) updateFields.assetType = validated.assetType
    if (validated.targetPrice !== undefined) updateFields.targetPrice = validated.targetPrice
    if (validated.notes !== undefined) updateFields.notes = validated.notes

    await itemsColl.updateOne({ _id: new ObjectId(itemId) }, { $set: updateFields })

    updateTag("watchlists")
    revalidatePath("/investments")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update watchlist item" }
  }
}
