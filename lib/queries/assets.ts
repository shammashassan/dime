import { cache } from "react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/collections"
import { Asset, AssetValuation } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { unstable_rethrow } from "next/navigation"

export const getAssets = cache(async (): Promise<Asset[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const assetsColl = await getCollection<Asset>("assets")

  return assetsColl.find({
    ...filter,
    status: "active"
  }).sort({ name: 1 }).toArray()
})

export const getAssetById = cache(async (id: string): Promise<Asset | null> => {
  try {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const assetsColl = await getCollection<Asset>("assets")

    console.log("[getAssetById] Input ID:", id)
    console.log("[getAssetById] Resolved Scope:", JSON.stringify(scope))
    console.log("[getAssetById] Generated Filter:", JSON.stringify(filter))

    const asset = await assetsColl.findOne({
      _id: new ObjectId(id),
      ...filter
    })

    console.log("[getAssetById] Query Result:", asset ? `${asset.name} (${asset._id})` : "null")
    return asset
  } catch (e) {
    unstable_rethrow(e)
    console.error("Error in getAssetById:", e)
    return null
  }
})

export const getAssetValuations = cache(async (assetId: string): Promise<AssetValuation[]> => {
  try {
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
    return valuationsColl.find({ assetId }).sort({ date: -1 }).toArray()
  } catch {
    return []
  }
})

export const getAssetsAndValuationsForScope = cache(async () => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const assetsColl = await getCollection<Asset>("assets")
  const valuationsColl = await getCollection<AssetValuation>("asset_valuations")

  const assets = await assetsColl.find(filter).toArray()
  const assetIds = assets.map(a => a._id.toString())

  const valuations = assetIds.length > 0 
    ? await valuationsColl.find({ assetId: { $in: assetIds } }).sort({ date: -1 }).toArray()
    : []

  return { assets, valuations }
})
