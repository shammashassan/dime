import { cache } from "react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/collections"
import { Asset, AssetValuation } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

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

    return assetsColl.findOne({
      _id: new ObjectId(id),
      ...filter
    })
  } catch {
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
