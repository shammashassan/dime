import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Financial Goals",
  description: "Track savings targets, contributions, and debt payoff milestones.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getGoals } from "@/lib/queries/goals"
import { getWallets } from "@/lib/queries/wallets"
import { getPreferences } from "@/lib/queries/preferences"
import { getExchangeRates } from "@/lib/currency"
import { GoalList } from "@/components/goals/goal-list"
import { serializeData } from "@/lib/utils"

export default async function GoalsPage() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const [goals, wallets, prefs] = await Promise.all([
    getGoals(userId),
    getWallets(userId),
    getPreferences(userId),
  ])

  const baseCurrency = prefs?.defaultCurrency || "USD"
  const exchangeRates = await getExchangeRates(baseCurrency)

  return (
    <GoalList
      initialGoals={serializeData(goals)}
      wallets={serializeData(wallets)}
      baseCurrency={baseCurrency}
      exchangeRates={exchangeRates}
    />
  )
}
