"use client"

import * as React from "react"
import { ReviewHeroSummary } from "@/components/reports/review-hero-summary"
import { ReviewExecutiveBrief } from "@/components/reports/review-executive-brief"
import { ReviewSpendingBreakdown } from "@/components/reports/review-spending-breakdown"
import { ReviewPeriodComparison } from "@/components/reports/review-period-comparison"
import { ReviewPeriodChart } from "@/components/reports/review-period-chart"
import { ReviewOutflowsCard, ReviewInflowsCard } from "@/components/reports/review-top-transactions"
import type { QuarterlyReviewData, MonthlyReviewSummaryBrief } from "@/types"

interface QuarterlyReviewViewProps {
  data: QuarterlyReviewData
  navTabs: React.ReactNode
}

export function QuarterlyReviewView({ data, navTabs }: QuarterlyReviewViewProps) {
  const [brief, setBrief] = React.useState<MonthlyReviewSummaryBrief>(data.executiveBrief)

  React.useEffect(() => {
    setBrief(data.executiveBrief)
  }, [data.executiveBrief])

  React.useEffect(() => {
    const handleAiRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ period: string; brief: MonthlyReviewSummaryBrief }>
      if (customEvent.detail?.period === "quarterly" && customEvent.detail?.brief) {
        setBrief(customEvent.detail.brief)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("dime:period-review-ai-refreshed", handleAiRefreshed)
      return () => {
        window.removeEventListener("dime:period-review-ai-refreshed", handleAiRefreshed)
      }
    }
  }, [])

  const heroMetrics = React.useMemo(() => {
    const prevInc = data.previousQuarterMetrics?.totalIncomeCents ?? 0
    const prevExp = data.previousQuarterMetrics?.totalExpenseCents ?? 0
    const incDelta = prevInc > 0 ? Math.round(((data.metrics.totalIncomeCents - prevInc) / prevInc) * 100) : 0
    const expDelta = prevExp > 0 ? Math.round(((data.metrics.totalExpenseCents - prevExp) / prevExp) * 100) : 0

    return {
      ...data.metrics,
      incomeDeltaPercentage: incDelta,
      expenseDeltaPercentage: expDelta,
    }
  }, [data.metrics, data.previousQuarterMetrics])

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Hero Summary KPI Strip */}
      <ReviewHeroSummary
        metrics={heroMetrics}
        currency={data.targetCurrency}
        comparisonLabel="QoQ"
      />

      {/* 2. Navigation tabs placed just below the metric cards */}
      {navTabs && <div className="flex items-center">{navTabs}</div>}

      {/* 3. Executive Retrospective Brief */}
      <ReviewExecutiveBrief brief={brief} monthLabel={data.quarterLabel} />

      {/* 4. Row 1: 2x1 Ratio (Category Breakdown 2 cols + Period Comparison 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReviewSpendingBreakdown
          categories={data.topCategories}
          currency={data.targetCurrency}
          totalExpenseCents={data.metrics.totalExpenseCents}
          className="lg:col-span-2"
        />
        <ReviewPeriodComparison
          current={data.metrics}
          previous={data.previousQuarterMetrics}
          currentLabel={data.quarterLabel}
          previousLabel="Prior Qtr"
          currency={data.targetCurrency}
          className="lg:col-span-1"
        />
      </div>

      {/* 5. Row 2: 1x1x1 Ratio (Cash Flow Chart + Largest Outflows + Largest Inflows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReviewPeriodChart
          data={data.monthlyBreakdown}
          currency={data.targetCurrency}
          title={`${data.quarterLabel} Monthly Trend`}
          className="lg:col-span-1"
        />
        <ReviewOutflowsCard
          topExpenses={data.topExpenses || []}
          currency={data.targetCurrency}
          className="lg:col-span-1"
        />
        <ReviewInflowsCard
          topIncomes={data.topIncomes || []}
          currency={data.targetCurrency}
          className="lg:col-span-1"
        />
      </div>
    </div>
  )
}
