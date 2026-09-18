"use client"

import * as React from "react"
import { ReviewHeroSummary } from "./review-hero-summary"
import { ReviewExecutiveBrief } from "./review-executive-brief"
import { ReviewSpendingBreakdown } from "./review-spending-breakdown"
import { ReviewBudgetScorecard } from "./review-budget-scorecard"
import { ReviewWealthPulse } from "./review-wealth-pulse"
import { ReviewOutflowsCard, ReviewInflowsCard } from "./review-top-transactions"
import type { MonthlyReviewData, MonthlyReviewSummaryBrief } from "@/types"

export interface MonthlyReviewViewProps {
  data: MonthlyReviewData
  navTabs?: React.ReactNode
}

export function MonthlyReviewView({ data, navTabs }: MonthlyReviewViewProps) {
  const [refreshedBriefs, setRefreshedBriefs] = React.useState<Record<string, MonthlyReviewSummaryBrief>>({})

  // Listen for AI brief refreshes from MonthlyReviewFilters in header
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ monthKey: string; brief: MonthlyReviewSummaryBrief }>).detail
      if (detail?.monthKey && detail?.brief) {
        setRefreshedBriefs((prev) => ({ ...prev, [detail.monthKey]: detail.brief }))
      }
    }
    window.addEventListener("dime:monthly-review-ai-refreshed", handler)
    return () => window.removeEventListener("dime:monthly-review-ai-refreshed", handler)
  }, [])

  const executiveBrief = refreshedBriefs[data.monthKey] || data.executiveBrief

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Hero Summary KPI Strip */}
      <ReviewHeroSummary metrics={data.metrics} currency={data.targetCurrency} />

      {/* 2. Navigation Tabs placed just below the metric cards */}
      {navTabs && <div className="flex items-center">{navTabs}</div>}

      {/* 3. Executive Retrospective Brief */}
      <ReviewExecutiveBrief brief={executiveBrief} monthLabel={data.monthLabel} />

      {/* 4. Row 1: 2x1 Ratio (Category Breakdown 2 cols + Budget Scorecard 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReviewSpendingBreakdown
          categories={data.categoryBreakdown}
          currency={data.targetCurrency}
          totalExpenseCents={data.metrics.totalExpenseCents}
          className="lg:col-span-2"
        />
        <ReviewBudgetScorecard
          budgets={data.budgetPerformance}
          currency={data.targetCurrency}
          className="lg:col-span-1"
        />
      </div>

      {/* 5. Row 2: 1x1x1 Ratio (Largest Outflows 1 col + Largest Inflows 1 col + Goals & Commitments 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReviewOutflowsCard
          topExpenses={data.topExpenses}
          currency={data.targetCurrency}
        />
        <ReviewInflowsCard
          topIncomes={data.topIncomes}
          currency={data.targetCurrency}
        />
        <ReviewWealthPulse
          goals={data.goalContributions}
          loans={data.loanPaydowns}
          subscriptionChanges={data.subscriptionChanges}
          currency={data.targetCurrency}
        />
      </div>
    </div>
  )
}
