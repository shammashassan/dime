"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
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
import { Wallet, Category, Contact, Goal, DashboardFocusCounts, OwedSummaries } from "@/types"

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
  healthTier: "needs_attention" | "fair" | "good" | "excellent"
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
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tiles = gsap.utils.toArray<HTMLElement>(".bento-tile")
      const mm = gsap.matchMedia()

      gsap.set(tiles, { opacity: 0, y: 16 })

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(tiles, { opacity: 1, y: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(tiles, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "transform",
        })
      })

      return () => mm.revert()
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      {/* Header */}
      <DashboardHeader userName={userName} scopeName={scopeName} isOrganization={isOrganization} />

      {/* Row 0: Focus Badges */}
      <FinancialFocusStrip counts={focusCounts} />

      {/* Row 1: Command Center & Quick Log */}
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

      {/* Row 2: Loan Action & Financial Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LoanActionCard contacts={contacts} owedSummary={owedSummary} />
        </div>
        <div className="lg:col-span-1">
          <FinancialHealthGaugeCard
            score={healthScore}
            tier={healthTier}
            topRecommendation={topRecommendation}
          />
        </div>
      </div>

      {/* Row 3: Executive KPI Benchmark Strip */}
      <ExecutiveKpiStrip
        netWorth={netWorth}
        monthlyInflow={monthlyInflow}
        monthlyOutflow={monthlyOutflow}
        currency={targetCurrency}
      />

      {/* Row 4: Core Visual Analytics (Shadcn Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingTrendChart initialData={trendData} currency={targetCurrency} />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdown data={categoryBreakdown} currency={targetCurrency} />
        </div>
      </div>

      {/* Row 5: AI Spending Insights & Active Goals */}
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
        <UpcomingRecurring userId={userId} />
        <BudgetProgressList userId={userId} />
      </div>

      {/* Row 7: Recent Transactions Stream */}
      <RecentTransactions userId={userId} />
    </div>
  )
}
