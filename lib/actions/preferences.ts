"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { revalidatePath } from "next/cache"
import { UserPreferences } from "@/lib/queries/preferences"

export async function updatePreferences(input: Omit<UserPreferences, "userId">) {
  const session = await requireApprovedUser()
  const prefColl = await getCollection<UserPreferences>("preferences")

  await prefColl.updateOne(
    { userId: session.user.id },
    {
      $set: {
        defaultCurrency: input.defaultCurrency,
        defaultWalletId: input.defaultWalletId,
        dateFormat: input.dateFormat,
      },
    },
    { upsert: true }
  )

  revalidatePath("/")
  return { success: true }
}
