"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { notificationsCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { Notification } from "@/types"

import { syncUserAlerts } from "@/lib/notification-sync"
import { db } from "@/lib/db/client"

export async function getNotificationsAction() {
  try {
    const session = await requireApprovedUser()

    // Sync any time-based alerts (loans, subscriptions, bills, budgets) for active user
    await syncUserAlerts(session.user.id).catch((err) => {
      console.error("Failed to sync alerts:", err)
    })

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
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id), userId: session.user.id }
      : { _id: id as any, userId: session.user.id }

    const res = await notificationsCollection.updateOne(query, {
      $set: { readAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    revalidatePath("/", "layout")
    return { success: true, data: res.modifiedCount > 0 }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await requireApprovedUser()
    const query = {
      userId: session.user.id,
      readAt: { $exists: false },
      deletedAt: { $exists: false },
    }

    const res = await notificationsCollection.updateMany(query, {
      $set: { readAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    revalidatePath("/", "layout")
    return { success: true, modifiedCount: res.modifiedCount }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

export async function archiveNotificationAction(id: string) {
  try {
    const session = await requireApprovedUser()
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id), userId: session.user.id }
      : { _id: id as any, userId: session.user.id }

    const res = await notificationsCollection.updateOne(query, {
      $set: { archivedAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    revalidatePath("/", "layout")
    return { success: true, data: res.modifiedCount > 0 }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An error occurred"
    return { success: false, error: msg }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const session = await requireApprovedUser()
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id), userId: session.user.id }
      : { _id: id as any, userId: session.user.id }

    const res = await notificationsCollection.updateOne(query, {
      $set: { deletedAt: new Date(), updatedAt: new Date() },
    })

    updateTag("notifications")
    revalidatePath("/notifications")
    revalidatePath("/", "layout")
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
    link: link || null,
    image: image || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const res = await notificationsCollection.insertOne(doc as unknown as Notification)
  updateTag("notifications")
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
  return { ...doc, _id: res.insertedId.toString() }
}

/**
 * Dispatches an in-app notification to all system administrators.
 */
export async function createNotificationForAdmins({
  title,
  message,
  type = "system",
  link,
}: {
  title: string
  message: string
  type?: string
  link?: string
}) {
  try {
    const admins = await db.collection("user").find({
      $or: [{ role: "admin" }, { roles: "admin" }]
    }).toArray()

    if (admins.length === 0) return { success: true, count: 0 }

    const now = new Date()
    const notifications = admins.map((admin) => ({
      userId: admin.id || admin._id?.toString(),
      title,
      message,
      type,
      link: link || null,
      createdAt: now,
      updatedAt: now,
    }))

    await notificationsCollection.insertMany(notifications as unknown as Notification[])
    updateTag("notifications")
    revalidatePath("/notifications")
    revalidatePath("/", "layout")
    return { success: true, count: notifications.length }
  } catch (err) {
    console.error("Failed to notify admins:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to notify admins" }
  }
}
