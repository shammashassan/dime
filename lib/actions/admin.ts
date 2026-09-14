"use server"

import { requireAdmin } from "@/lib/auth-guard"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/actions/notifications"

export async function approveUser(userId: string) {
  await requireAdmin()
  const headersList = await headers()

  await auth.api.adminUpdateUser({
    body: {
      userId,
      data: {
        approved: true,
      },
    },
    headers: headersList,
  })

  // Notify the user that their account was approved
  await createNotification({
    userId,
    title: "Account Approved! 🎉",
    message: "Your Dime account has been approved by an administrator. You now have full access to your workspace.",
    type: "system",
    link: "/dashboard",
  }).catch((err) => {
    console.error("Failed to notify approved user:", err)
  })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function rejectUser(userId: string) {
  await requireAdmin()
  const headersList = await headers()

  await auth.api.removeUser({
    body: {
      userId,
    },
    headers: headersList,
  })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function bulkApproveUsers(userIds: string[]) {
  await requireAdmin()
  const headersList = await headers()

  await Promise.all(
    userIds.map(async (userId) => {
      await auth.api.adminUpdateUser({
        body: {
          userId,
          data: {
            approved: true,
          },
        },
        headers: headersList,
      })

      await createNotification({
        userId,
        title: "Account Approved! 🎉",
        message: "Your Dime account has been approved by an administrator. You now have full access to your workspace.",
        type: "system",
        link: "/dashboard",
      }).catch((err) => {
        console.error("Failed to notify approved user:", err)
      })
    })
  )

  revalidatePath("/admin/users")
  return { success: true }
}

export async function bulkRejectUsers(userIds: string[]) {
  await requireAdmin()
  const headersList = await headers()

  await Promise.all(
    userIds.map((userId) =>
      auth.api.removeUser({
        body: {
          userId,
        },
        headers: headersList,
      })
    )
  )

  revalidatePath("/admin/users")
  return { success: true }
}
