import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wallets & Accounts",
  description: "Manage bank accounts, digital wallets, credit cards, and cash balances.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { getPreferences } from "@/lib/queries/preferences"
import { getExchangeRates } from "@/lib/currency"
import { WalletsView } from "@/components/wallets/wallets-view"
import { serializeData } from "@/lib/utils"


export default async function WalletsPage() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const [wallets, prefs] = await Promise.all([
    getAllWalletsIncludingArchived(userId),
    getPreferences(userId),
  ])

  const baseCurrency = prefs?.defaultCurrency || "USD"
  const exchangeRates = await getExchangeRates(baseCurrency)

  return (
    <WalletsView
      wallets={serializeData(wallets)}
      baseCurrency={baseCurrency}
      exchangeRates={exchangeRates}
    />
  )
}
