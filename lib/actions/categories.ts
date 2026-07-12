"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { Category, Transaction } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { db } from "@/lib/db/client"
import { canManageBudgets, Role } from "@/lib/permissions"

const categoryInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less"),
  type: z.array(z.enum(["income", "expense", "transfer"])).min(1, "At least one type is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  parentId: z.string().optional().nullable(),
})

export type CategoryInput = z.infer<typeof categoryInputSchema>

export async function createCategory(input: CategoryInput) {
  const session = await requireApprovedUser()
  const validated = categoryInputSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const categoriesColl = await getCollection<Category>("categories")

  const category: Omit<Category, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    name: validated.name,
    type: validated.type,
    icon: validated.icon,
    color: validated.color,
    parentId: validated.parentId || undefined,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }

  const result = await categoriesColl.insertOne(category as Category)

  updateTag("categories")
  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const session = await requireApprovedUser()
  const validated = categoryInputSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const categoriesColl = await getCollection<Category>("categories")
  const categoryOid = new ObjectId(id)

  const existing = await categoriesColl.findOne({ _id: categoryOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Category not found or is read-only")

  await categoriesColl.updateOne(
    { _id: categoryOid, ...getScopeFilter(scope) },
    {
      $set: {
        name: validated.name,
        type: validated.type,
        icon: validated.icon,
        color: validated.color,
        parentId: validated.parentId || undefined,
        updatedAt: new Date(),
        updatedBy: scope.userId,
      },
      $inc: { version: 1 }
    }
  )

  updateTag("categories")
  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const categoriesColl = await getCollection<Category>("categories")
  const categoryOid = new ObjectId(id)

  const existing = await categoriesColl.findOne({ _id: categoryOid, ...getScopeFilter(scope) })
  if (!existing) throw new Error("Category not found or is read-only")

  await categoriesColl.deleteOne({ _id: categoryOid, ...getScopeFilter(scope) })

  updateTag("categories")
  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true }
}

export async function mergeCategory(sourceId: string, targetId: string) {
  const session = await requireApprovedUser()

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  const categoriesColl = await getCollection<Category>("categories")
  const transactionsColl = await getCollection<Transaction>("transactions")

  const sourceOid = new ObjectId(sourceId)
  const targetOid = new ObjectId(targetId)

  // Verify source exists and belongs to workspace (defaults cannot be deleted/merged)
  const sourceCategory = await categoriesColl.findOne({ _id: sourceOid, ...getScopeFilter(scope) })
  if (!sourceCategory) throw new Error("Source category not found or is read-only")

  // Verify target exists (can be workspace custom or system default)
  const targetCategory = await categoriesColl.findOne({
    _id: targetOid,
    $or: [getScopeFilter(scope), { userId: null }],
  })
  if (!targetCategory) throw new Error("Target category not found")

  // Update all transactions from source category to target category
  const result = await transactionsColl.updateMany(
    { ...getScopeFilter(scope), categoryId: sourceId },
    { 
      $set: { 
        categoryId: targetId, 
        updatedAt: new Date(),
        updatedBy: scope.userId
      },
      $inc: { version: 1 }
    }
  )

  // Delete source category
  await categoriesColl.deleteOne({ _id: sourceOid, ...getScopeFilter(scope) })

  updateTag("categories")
  updateTag("transactions")
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/")
  
  return { success: true, affectedCount: result.modifiedCount }
}

export async function getAffectedTransactionCount(sourceId: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()
  const transactionsColl = await getCollection<Transaction>("transactions")
  
  const count = await transactionsColl.countDocuments({
    ...getScopeFilter(scope),
    categoryId: sourceId
  })

  return count
}
