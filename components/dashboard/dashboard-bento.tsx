import React from "react"
import { BentoEntrance } from "./bento-entrance"
import { DashboardHeader } from "./dashboard-header"
import { FinancialFocusStrip } from "./financial-focus-strip"
import { CommandCenterCard } from "./command-center-card"
import { QuickLogCard } from "./quick-log-card"
import { LoanActionCard } from "./loan-action-card"
import { FinancialHealthGaugeCard } from "./financial-health-gauge-card"
import { ExecutiveKpiStrip } from "./executive-kpi-strip"
import { SpendingTrendChart } from "./spending-trend-chart"
import { CategoryBreakdown, CategoryItem } from "./category-breakdown"
import { AIInsights } from "./ai-insights"
import { ActiveGoalsCard } from "./active-goals-card"
import { UpcomingRecurring } from "./upcoming-recurring"
import { BudgetProgressList } from "./budget-progress-list"
import { RecentTransactions } from "./recent-transactions"
import { Wallet, Category, Contact, Goal, DashboardFocusCounts, OwedSummaries, HealthTier, PillarId, PillarScore } from "@/types"

export interface DashboardBentoProps {
  userName: string
  scopeName?: string
  isOrganization?: boolean
  wallets: Wallet[]
  categories: Category[]
  contacts: Contact[]
  goals: Goal[]
  focusCounts: DashboardFocusCounts
  owedSummary: OwedSummaries
  healthScore: number
  healthTier: HealthTier
  pillars?: Record<PillarId, PillarScore>
  topRecommendation?: {
    title: string
    potentialPoints: number
    actionPath: string
  }
  netWorth: number
  monthlyInflow: number
  monthlyOutflow: number
  trendData: Array<{ date: string; income: number; expense: number }>
  categoryBreakdown: CategoryItem[]
  userId: string
  targetCurrency: string
  defaultWalletId?: string
}

export function DashboardBento({
  userName,
  scopeName,
  isOrganization,
  wallets,
  categories,
  contacts,
  goals,
  focusCounts,
  owedSummary,
  healthScore,
  healthTier,
  pillars,
  topRecommendation,
  netWorth,
  monthlyInflow,
  monthlyOutflow,
  trendData,
  categoryBreakdown,
  userId,
  targetCurrency,
  defaultWalletId,
}: DashboardBentoProps) {
  return (
    <BentoEntrance className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <DashboardHeader userName={userName} scopeName={scopeName} isOrganization={isOrganization} />

      {/* Row 0: Focus Badges */}
      <FinancialFocusStrip counts={focusCounts} />

      {/* Row 1: Executive KPI Benchmark Strip */}
      <ExecutiveKpiStrip
        netWorth={netWorth}
        monthlyInflow={monthlyInflow}
        monthlyOutflow={monthlyOutflow}
        currency={targetCurrency}
      />

      {/* Row 2: Operations Tier — Command Center & Quick Log (2 : 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CommandCenterCard />
        </div>
        <div className="lg:col-span-1">
          <QuickLogCard
            wallets={wallets}
            categories={categories}
            defaultWalletId={defaultWalletId}
            baseCurrency={targetCurrency}
          />
        </div>
      </div>

      {/* Row 3: Analytics Tier — Cash Flow Trajectory & Category Breakdown (2 : 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingTrendChart initialData={trendData} currency={targetCurrency} />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdown data={categoryBreakdown} currency={targetCurrency} />
        </div>
      </div>

      {/* Row 4: Health & Obligations Tier — Financial Health Gauge & Loan Action (1 : 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <FinancialHealthGaugeCard
            score={healthScore}
            tier={healthTier}
            pillars={pillars}
            topRecommendation={topRecommendation}
          />
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <LoanActionCard contacts={contacts} owedSummary={owedSummary} />
        </div>
      </div>

      {/* Row 5: Intelligence & Goals Tier — AI Insights & Active Goals (2 : 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AIInsights userId={userId} />
        </div>
        <div className="lg:col-span-1">
          <ActiveGoalsCard goals={goals} currency={targetCurrency} />
        </div>
      </div>

      {/* Row 6: Live Operations & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bento-tile h-full">
          <UpcomingRecurring userId={userId} className="h-full" />
        </div>
        <div className="bento-tile h-full">
          <BudgetProgressList userId={userId} className="h-full" />
        </div>
      </div>

      {/* Row 7: Recent Transactions Stream */}
      <div className="bento-tile">
        <RecentTransactions userId={userId} />
      </div>
    </BentoEntrance>
  )
}
