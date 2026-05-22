"use server"

import { requireAdmin } from "@/lib/auth-guard"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

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
    userIds.map((userId) =>
      auth.api.adminUpdateUser({
        body: {
          userId,
          data: {
            approved: true,
          },
        },
        headers: headersList,
      })
    )
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
