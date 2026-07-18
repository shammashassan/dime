"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { assetSchema, AssetInput, assetValuationSchema, AssetValuationInput } from "@/lib/validations/asset.schema"
import { Asset, AssetValuation } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { Role } from "@/lib/permissions"

async function checkWritePermission() {
  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (role === "viewer") {
      throw new Error("Unauthorized: Viewers cannot make modifications.")
    }
  }
  return scope
}

export async function createAsset(input: AssetInput) {
  await requireApprovedUser()
  const scope = await checkWritePermission()
  const validated = assetSchema.parse(input)

  const assetsColl = await getCollection<Asset>("assets")
  
  const asset: Omit<Asset, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    name: validated.name,
    kind: validated.kind,
    category: validated.category,
    currency: validated.currency,
    currentValue: validated.currentValue,
    valuationMethod: validated.valuationMethod,
    ownershipPercentage: validated.ownershipPercentage,
    acquiredAt: validated.acquiredAt || undefined,
    notes: validated.notes,
    status: validated.status,
    isArchived: validated.isArchived,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }

  const result = await assetsColl.insertOne(asset as Asset)
  const assetId = result.insertedId.toString()

  // Create initial valuation point to establish historical baseline
  const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
  const initialValuation: Omit<AssetValuation, "_id"> = {
    assetId,
    userId: scope.userId,
    organizationId: scope.organizationId,
    date: validated.acquiredAt || new Date(),
    value: validated.currentValue,
    source: "manual",
    notes: "Initial asset setup value",
    createdAt: new Date()
  }
  await valuationsColl.insertOne(initialValuation as AssetValuation)

  updateTag("assets")
  updateTag("asset_valuations")
  revalidatePath("/net-worth")
  revalidatePath("/", "layout")

  return { success: true, id: assetId }
}

export async function updateAsset(id: string, input: AssetInput) {
  await requireApprovedUser()
  const scope = await checkWritePermission()
  const validated = assetSchema.parse(input)

  const assetsColl = await getCollection<Asset>("assets")
  const assetOid = new ObjectId(id)

  const existing = await assetsColl.findOne({ _id: assetOid, ...getScopeFilter(scope) })
  if (!existing) {
    return { success: false, error: "Asset not found" }
  }

  // If currentValue changed, add a new valuation record to the timeline
  if (existing.currentValue !== validated.currentValue) {
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
    const valuation: Omit<AssetValuation, "_id"> = {
      assetId: id,
      userId: scope.userId,
      organizationId: scope.organizationId,
      date: new Date(),
      value: validated.currentValue,
      source: "manual",
      notes: "Value updated during asset edit",
      createdAt: new Date()
    }
    await valuationsColl.insertOne(valuation as AssetValuation)
  }

  await assetsColl.updateOne(
    { _id: assetOid },
    {
      $set: {
        name: validated.name,
        kind: validated.kind,
        category: validated.category,
        currency: validated.currency,
        currentValue: validated.currentValue,
        valuationMethod: validated.valuationMethod,
        ownershipPercentage: validated.ownershipPercentage,
        acquiredAt: validated.acquiredAt || undefined,
        notes: validated.notes,
        status: validated.status,
        isArchived: validated.isArchived,
        updatedAt: new Date(),
        updatedBy: scope.userId
      },
      $inc: { version: 1 }
    }
  )

  updateTag("assets")
  updateTag("asset_valuations")
  revalidatePath("/net-worth")
  revalidatePath(`/net-worth/assets/${id}`)
  revalidatePath("/", "layout")

  return { success: true }
}

export async function archiveAsset(id: string) {
  await requireApprovedUser()
  const scope = await checkWritePermission()

  const assetsColl = await getCollection<Asset>("assets")
  const assetOid = new ObjectId(id)

  const existing = await assetsColl.findOne({ _id: assetOid, ...getScopeFilter(scope) })
  if (!existing) {
    return { success: false, error: "Asset not found" }
  }

  await assetsColl.updateOne(
    { _id: assetOid },
    {
      $set: {
        status: "archived",
        isArchived: true,
        updatedAt: new Date()
      }
    }
  )

  updateTag("assets")
  revalidatePath("/net-worth")
  revalidatePath(`/net-worth/assets/${id}`)
  revalidatePath("/", "layout")

  return { success: true }
}

export async function unarchiveAsset(id: string) {
  await requireApprovedUser()
  const scope = await checkWritePermission()

  const assetsColl = await getCollection<Asset>("assets")
  const assetOid = new ObjectId(id)

  const existing = await assetsColl.findOne({ _id: assetOid, ...getScopeFilter(scope) })
  if (!existing) {
    return { success: false, error: "Asset not found" }
  }

  await assetsColl.updateOne(
    { _id: assetOid },
    {
      $set: {
        status: "active",
        isArchived: false,
        updatedAt: new Date()
      }
    }
  )

  updateTag("assets")
  revalidatePath("/net-worth")
  revalidatePath(`/net-worth/assets/${id}`)
  revalidatePath("/", "layout")

  return { success: true }
}

export async function deleteAsset(id: string) {
  await requireApprovedUser()
  const scope = await checkWritePermission()

  const assetsColl = await getCollection<Asset>("assets")
  const assetOid = new ObjectId(id)

  const existing = await assetsColl.findOne({ _id: assetOid, ...getScopeFilter(scope) })
  if (!existing) {
    return { success: false, error: "Asset not found" }
  }

  // Delete the asset itself
  await assetsColl.deleteOne({ _id: assetOid })

  // Delete all associated valuation records
  const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
  await valuationsColl.deleteMany({ assetId: id })

  updateTag("assets")
  updateTag("asset_valuations")
  revalidatePath("/net-worth")
  revalidatePath("/", "layout")

  return { success: true }
}

export async function addAssetValuation(input: AssetValuationInput) {
  await requireApprovedUser()
  const scope = await checkWritePermission()
  const validated = assetValuationSchema.parse(input)

  const assetsColl = await getCollection<Asset>("assets")
  const assetOid = new ObjectId(validated.assetId)

  const asset = await assetsColl.findOne({ _id: assetOid, ...getScopeFilter(scope) })
  if (!asset) {
    return { success: false, error: "Asset not found" }
  }

  const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
  const valuation: Omit<AssetValuation, "_id"> = {
    assetId: validated.assetId,
    userId: scope.userId,
    organizationId: scope.organizationId,
    date: validated.date,
    value: validated.value,
    source: validated.source,
    notes: validated.notes,
    createdAt: new Date()
  }

  await valuationsColl.insertOne(valuation as AssetValuation)

  // Re-query the latest valuation of the asset to denormalize the currentValue
  const latestVal = await valuationsColl.findOne(
    { assetId: validated.assetId },
    { sort: { date: -1 } }
  )

  if (latestVal) {
    await assetsColl.updateOne(
      { _id: assetOid },
      {
        $set: {
          currentValue: latestVal.value,
          updatedAt: new Date()
        }
      }
    )
  }

  updateTag("assets")
  updateTag("asset_valuations")
  revalidatePath("/net-worth")
  revalidatePath(`/net-worth/assets/${validated.assetId}`)
  revalidatePath("/", "layout")

  return { success: true }
}

export async function deleteAssetValuation(valuationId: string) {
  await requireApprovedUser()
  const scope = await checkWritePermission()

  const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
  const valOid = new ObjectId(valuationId)

  const valuation = await valuationsColl.findOne({ _id: valOid })
  if (!valuation) {
    return { success: false, error: "Valuation record not found" }
  }

  // Verify that the user has scope access to the associated asset
  const assetsColl = await getCollection<Asset>("assets")
  const assetOid = new ObjectId(valuation.assetId)
  const asset = await assetsColl.findOne({ _id: assetOid, ...getScopeFilter(scope) })
  if (!asset) {
    return { success: false, error: "Unauthorized" }
  }

  await valuationsColl.deleteOne({ _id: valOid })

  // Re-query the latest valuation of the asset to update currentValue
  const latestVal = await valuationsColl.findOne(
    { assetId: valuation.assetId },
    { sort: { date: -1 } }
  )

  await assetsColl.updateOne(
    { _id: assetOid },
    {
      $set: {
        currentValue: latestVal ? latestVal.value : 0,
        updatedAt: new Date()
      }
    }
  )

  updateTag("assets")
  updateTag("asset_valuations")
  revalidatePath("/net-worth")
  revalidatePath(`/net-worth/assets/${valuation.assetId}`)
  revalidatePath("/", "layout")

  return { success: true }
}
