import { cache } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { getCollection } from "@/lib/db/collections"

export interface UserPreferences {
  userId: string
  defaultCurrency: string
  defaultWalletId?: string
  dateFormat: string
}

async function fetchPreferences(userId: string): Promise<UserPreferences> {
  "use cache"
  cacheTag("preferences", `preferences-${userId}`)
  cacheLife("hours")

  const prefColl = await getCollection<UserPreferences>("preferences")
  const pref = await prefColl.findOne({ userId })
  if (pref) {
    return {
      userId: pref.userId,
      defaultCurrency: pref.defaultCurrency,
      defaultWalletId: pref.defaultWalletId ? pref.defaultWalletId.toString() : undefined,
      dateFormat: pref.dateFormat,
    }
  }
  return {
    userId,
    defaultCurrency: "USD",
    dateFormat: "DD/MM/YYYY",
  }
}

export const getPreferences = cache(async (userId: string): Promise<UserPreferences> => {
  return fetchPreferences(userId)
})
