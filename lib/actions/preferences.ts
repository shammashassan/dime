"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { revalidatePath } from "next/cache"
import { UserPreferences } from "@/lib/queries/preferences"

export async function updatePreferences(input: Omit<UserPreferences, "userId">) {
  const session = await requireApprovedUser()
  const prefColl = await getCollection<UserPreferences>("preferences")

  const updateData: Record<string, any> = {
    defaultCurrency: input.defaultCurrency,
    dateFormat: input.dateFormat,
  }

  if (input.defaultWalletId) {
    updateData.defaultWalletId = input.defaultWalletId
  } else {
    updateData.defaultWalletId = null
  }

  await prefColl.updateOne(
    { userId: session.user.id },
    { $set: updateData },
    { upsert: true }
  )

  revalidatePath("/")
  return { success: true }
}
