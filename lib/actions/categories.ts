"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { Category, Transaction } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

  const categoriesColl = await getCollection<Category>("categories")

  const category: Omit<Category, "_id"> = {
    userId: session.user.id,
    name: validated.name,
    type: validated.type,
    icon: validated.icon,
    color: validated.color,
    parentId: validated.parentId || undefined,
    isDefault: false,
    createdAt: new Date(),
  }

  const result = await categoriesColl.insertOne(category as Category)

  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true, id: result.insertedId.toString() }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const session = await requireApprovedUser()
  const validated = categoryInputSchema.parse(input)

  const categoriesColl = await getCollection<Category>("categories")
  const categoryOid = new ObjectId(id)

  const existing = await categoriesColl.findOne({ _id: categoryOid, userId: session.user.id })
  if (!existing) throw new Error("Category not found or is read-only")

  await categoriesColl.updateOne(
    { _id: categoryOid, userId: session.user.id },
    {
      $set: {
        name: validated.name,
        type: validated.type,
        icon: validated.icon,
        color: validated.color,
        parentId: validated.parentId || undefined,
      },
    }
  )

  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const session = await requireApprovedUser()
  const categoriesColl = await getCollection<Category>("categories")
  const categoryOid = new ObjectId(id)

  const existing = await categoriesColl.findOne({ _id: categoryOid, userId: session.user.id })
  if (!existing) throw new Error("Category not found or is read-only")

  await categoriesColl.deleteOne({ _id: categoryOid, userId: session.user.id })

  revalidatePath("/categories")
  revalidatePath("/")
  return { success: true }
}

export async function mergeCategory(sourceId: string, targetId: string) {
  const session = await requireApprovedUser()
  const categoriesColl = await getCollection<Category>("categories")
  const transactionsColl = await getCollection<Transaction>("transactions")

  const sourceOid = new ObjectId(sourceId)
  const targetOid = new ObjectId(targetId)

  // Verify source exists and belongs to user (defaults cannot be deleted/merged)
  const sourceCategory = await categoriesColl.findOne({ _id: sourceOid, userId: session.user.id })
  if (!sourceCategory) throw new Error("Source category not found or is read-only")

  // Verify target exists (can be user custom or system default)
  const targetCategory = await categoriesColl.findOne({
    _id: targetOid,
    $or: [{ userId: session.user.id }, { userId: null }],
  })
  if (!targetCategory) throw new Error("Target category not found")

  // Update all transactions from source category to target category
  const result = await transactionsColl.updateMany(
    { userId: session.user.id, categoryId: sourceId },
    { $set: { categoryId: targetId, updatedAt: new Date() } }
  )

  // Delete source category
  await categoriesColl.deleteOne({ _id: sourceOid, userId: session.user.id })

  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/")
  
  return { success: true, affectedCount: result.modifiedCount }
}

export async function getAffectedTransactionCount(sourceId: string) {
  const session = await requireApprovedUser()
  const transactionsColl = await getCollection<Transaction>("transactions")
  
  const count = await transactionsColl.countDocuments({
    userId: session.user.id,
    categoryId: sourceId
  })

  return count
}
