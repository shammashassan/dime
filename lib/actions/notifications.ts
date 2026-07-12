"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { notificationsCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { updateTag } from "next/cache"
import { Notification } from "@/types"

export async function getNotificationsAction() {
  try {
    const session = await requireApprovedUser()
    const items = await notificationsCollection
      .find({
        userId: session.user.id,
        deletedAt: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .toArray()

    return {
      success: true,
      data: items.map((item) => ({
        _id: item._id.toString(),
        userId: item.userId || "",
        title: item.title,
        message: item.message,
        type: item.type,
        link: item.link || null,
        image: item.image || null,
        readAt: item.readAt ? item.readAt.toISOString() : null,
        dismissedAt: item.dismissedAt ? item.dismissedAt.toISOString() : null,
        archivedAt: item.archivedAt ? item.archivedAt.toISOString() : null,
        createdAt: item.createdAt ? item.createdAt.toISOString() : null,
        updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
      })),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const session = await requireApprovedUser()
    const query = { _id: new ObjectId(id), userId: session.user.id }

    const res = await notificationsCollection.updateOne(query, {
      $set: { readAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    return { success: true, data: res.modifiedCount > 0 }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

export async function archiveNotificationAction(id: string) {
  try {
    const session = await requireApprovedUser()
    const query = { _id: new ObjectId(id), userId: session.user.id }

    const res = await notificationsCollection.updateOne(query, {
      $set: { archivedAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    return { success: true, data: res.modifiedCount > 0 }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const session = await requireApprovedUser()
    const query = { _id: new ObjectId(id), userId: session.user.id }

    const res = await notificationsCollection.updateOne(query, {
      $set: { deletedAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    return { success: true, data: res.modifiedCount > 0 }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

// Helper to create notifications (internal)
export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
  image,
}: {
  userId: string
  title: string
  message: string
  type: string
  link?: string
  image?: string
}) {
  const doc = {
    userId,
    title,
    message,
    type,
    link,
    image,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const res = await notificationsCollection.insertOne(doc as unknown as Notification)
  updateTag("notifications")
  return { ...doc, _id: res.insertedId }
}
