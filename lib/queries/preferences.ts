import { cache } from "react"
import { getCollection } from "@/lib/db/collections"

export interface UserPreferences {
  userId: string
  defaultCurrency: string
  defaultWalletId?: string
  dateFormat: string
}

export const getPreferences = cache(async (userId: string): Promise<UserPreferences> => {
  const prefColl = await getCollection<UserPreferences>("preferences")
  const pref = await prefColl.findOne({ userId })
  if (pref) return pref
  return {
    userId,
    defaultCurrency: "USD",
    dateFormat: "DD/MM/YYYY",
  }
})
