import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { unstable_rethrow } from "next/navigation"
import { getPreferences } from "@/lib/queries/preferences"
import { getWallets } from "@/lib/queries/wallets"
import { SettingsView } from "@/components/settings/settings-view"
import { serializeData } from "@/lib/utils"
import SettingsLoading from "./loading"

async function SettingsContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let preferences
  let wallets = []

  try {
    const [prefData, walletsData] = await Promise.all([
      getPreferences(userId),
      getWallets(userId),
    ])
    preferences = prefData
    wallets = walletsData
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load settings data:", error)
    throw error
  }

  return <SettingsView preferences={serializeData(preferences)} wallets={serializeData(wallets)} />
}

export default async function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  )
}
