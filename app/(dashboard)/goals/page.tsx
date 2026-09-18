import type { Metadata } from "next"
import React, { Suspense } from "react"
import { Target } from "lucide-react"

export const metadata: Metadata = {
  title: "Savings Goals",
  description: "Create financial targets, monitor savings milestones, and track progress.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getGoals } from "@/lib/queries/goals"
import { getWallets } from "@/lib/queries/wallets"
import { getPreferences } from "@/lib/queries/preferences"
import { getExchangeRates } from "@/lib/currency"
import { GoalList } from "@/components/goals/goal-list"
import { Skeleton } from "@/components/ui/skeleton"
import { serializeData } from "@/lib/utils"

import { GoalsSkeleton } from "./loading"

async function GoalsContent({ userId }: { userId: string }) {
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

export default async function GoalsPage() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent userId={userId} />
    </Suspense>
  )
}
