import type { Metadata } from "next"
import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope } from "@/lib/scope"
import { getPreferences } from "@/lib/queries/preferences"
import { getWallets } from "@/lib/queries/wallets"
import { getCategories } from "@/lib/queries/categories"
import { getContacts, getOwedSummaries } from "@/lib/queries/loans"
import { getGoals } from "@/lib/queries/goals"
import { getDashboardFocusCounts } from "@/lib/queries/dashboard"
import { getDailyIncomeExpenseTrend, getCategoryBreakdown } from "@/lib/queries/reports"
import { getFinancialHealthScore } from "@/lib/queries/financial-health"
import { getNetWorthSummary } from "@/lib/queries/net-worth"
import { DashboardBento } from "@/components/dashboard/dashboard-bento"
import { serializeData } from "@/lib/utils"
import { DashboardSkeleton } from "./loading"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "High-density overview of your finances, cash flow, and financial health.",
}

async function DashboardContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const [
    prefs,
    wallets,
    categories,
    contacts,
    goals,
    owedSummary,
    focusCounts,
    trendData,
    categoryBreakdown,
    healthScoreData,
    netWorthData,
  ] = await Promise.all([
    getPreferences(userId),
    getWallets(userId),
    getCategories(userId),
    getContacts(),
    getGoals(userId),
    getOwedSummaries(),
    getDashboardFocusCounts(userId),
    getDailyIncomeExpenseTrend(userId),
    getCategoryBreakdown(userId),
    getFinancialHealthScore(userId),
    getNetWorthSummary(userId),
  ])

  const targetCurrency = prefs?.defaultCurrency || "USD"

  // Calculate monthly inflow & outflow from trendData for current month (converted to cents)
  const now = new Date()
  const currentMonthPrefix = now.toISOString().slice(0, 7)
  let monthlyInflow = 0
  let monthlyOutflow = 0
  for (const day of trendData) {
    if (day.date.startsWith(currentMonthPrefix)) {
      monthlyInflow += Math.round((day.income || 0) * 100)
      monthlyOutflow += Math.round((day.expense || 0) * 100)
    }
  }

  // Fallback to trailing 30 days if current month has zero activity
  if (monthlyInflow === 0 && monthlyOutflow === 0) {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    for (const day of trendData) {
      if (day.date >= thirtyDaysAgo) {
        monthlyInflow += Math.round((day.income || 0) * 100)
        monthlyOutflow += Math.round((day.expense || 0) * 100)
      }
    }
  }

  const topRec = healthScoreData.recommendations?.[0]
  const topRecommendation = topRec
    ? {
        title: topRec.title,
        potentialPoints: topRec.potentialPoints,
        actionPath: topRec.actionUrl || "/health",
      }
    : undefined

  return (
    <DashboardBento
      userName={session.user.name || "User"}
      scopeName={scope.isOrganization ? "Team" : "Personal"}
      isOrganization={scope.isOrganization}
      wallets={serializeData(wallets)}
      categories={serializeData(categories)}
      contacts={serializeData(contacts)}
      goals={serializeData(goals)}
      focusCounts={focusCounts}
      owedSummary={owedSummary}
      healthScore={healthScoreData.overallScore}
      healthTier={healthScoreData.tier}
      pillars={serializeData(healthScoreData.pillars)}
      topRecommendation={topRecommendation}
      netWorth={netWorthData.currentNetWorth}
      monthlyInflow={monthlyInflow}
      monthlyOutflow={monthlyOutflow}
      trendData={trendData}
      categoryBreakdown={categoryBreakdown}
      userId={userId}
      targetCurrency={targetCurrency}
      defaultWalletId={prefs?.defaultWalletId}
    />
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
