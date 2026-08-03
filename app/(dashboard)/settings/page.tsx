import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { unstable_rethrow } from "next/navigation"
import { getPreferences } from "@/lib/queries/preferences"
import { getWallets } from "@/lib/queries/wallets"
import { getCategories } from "@/lib/queries/categories"
import { getBudgets } from "@/lib/queries/budgets"
import { getOrganizationSettings } from "@/lib/queries/organization"
import { SettingsView } from "@/components/settings/settings-view"
import { serializeData } from "@/lib/utils"
import SettingsLoading from "./loading"

async function SettingsContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const activeOrgId = session.session.activeOrganizationId || null

  let preferences
  let wallets = []
  let categories = []
  let budgets = []
  let orgSettings = null

  try {
    const [prefData, walletsData, categoriesData, budgetsData, orgSettingsData] = await Promise.all([
      getPreferences(userId),
      getWallets(userId),
      getCategories(userId),
      getBudgets(userId),
      activeOrgId ? getOrganizationSettings(activeOrgId) : null,
    ])
    preferences = prefData || {
      userId,
      defaultCurrency: "USD",
      dateFormat: "DD/MM/YYYY",
    }
    wallets = Array.isArray(walletsData) ? walletsData : []
    categories = Array.isArray(categoriesData) ? categoriesData : []
    budgets = Array.isArray(budgetsData) ? budgetsData : []
    orgSettings = orgSettingsData || null
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load settings data:", error)
    throw error
  }

  return (
    <SettingsView
      preferences={serializeData(preferences)}
      wallets={serializeData(wallets)}
      categories={serializeData(categories)}
      budgets={serializeData(budgets)}
      orgSettings={serializeData(orgSettings)}
      activeOrgId={activeOrgId}
    />
  )
}

export default async function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  )
}
