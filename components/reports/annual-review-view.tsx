"use client"

import * as React from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CalendarDays } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { ReviewHeroSummary } from "@/components/reports/review-hero-summary"
import { ReviewExecutiveBrief } from "@/components/reports/review-executive-brief"
import { ReviewSpendingBreakdown } from "@/components/reports/review-spending-breakdown"
import { ReviewPeriodComparison } from "@/components/reports/review-period-comparison"
import { ReviewPeriodChart } from "@/components/reports/review-period-chart"
import { ReviewOutflowsCard, ReviewInflowsCard } from "@/components/reports/review-top-transactions"
import type { AnnualReviewData, MonthlyReviewSummaryBrief } from "@/types"

interface AnnualReviewViewProps {
  data: AnnualReviewData
  navTabs: React.ReactNode
}

export function AnnualReviewView({ data, navTabs }: AnnualReviewViewProps) {
  const [brief, setBrief] = React.useState<MonthlyReviewSummaryBrief>(data.executiveBrief)

  React.useEffect(() => {
    setBrief(data.executiveBrief)
  }, [data.executiveBrief])

  React.useEffect(() => {
    const handleAiRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ period: string; brief: MonthlyReviewSummaryBrief }>
      if (customEvent.detail?.period === "annual" && customEvent.detail?.brief) {
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

  const { metrics, targetCurrency, yearLabel, quarterlyBreakdown } = data

  // Identify highest-performing quarter (highest savings rate or positive net)
  const bestQuarter = React.useMemo(() => {
    let best = quarterlyBreakdown[0]
    for (const q of quarterlyBreakdown) {
      if (q.netSavingsCents > best.netSavingsCents) {
        best = q
      }
    }
    return best?.netSavingsCents > 0 ? best.quarter : null
  }, [quarterlyBreakdown])

  const heroMetrics = React.useMemo(() => {
    const prevInc = data.previousYearMetrics?.totalIncomeCents ?? 0
    const prevExp = data.previousYearMetrics?.totalExpenseCents ?? 0
    const incDelta = prevInc > 0 ? Math.round(((data.metrics.totalIncomeCents - prevInc) / prevInc) * 100) : 0
    const expDelta = prevExp > 0 ? Math.round(((data.metrics.totalExpenseCents - prevExp) / prevExp) * 100) : 0

    return {
      ...data.metrics,
      incomeDeltaPercentage: incDelta,
      expenseDeltaPercentage: expDelta,
    }
  }, [data.metrics, data.previousYearMetrics])

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Hero Summary KPI Strip */}
      <ReviewHeroSummary
        metrics={heroMetrics}
        currency={data.targetCurrency}
        comparisonLabel="YoY"
      />

      {/* 2. Navigation tabs placed just below the metric cards */}
      {navTabs && <div className="flex items-center">{navTabs}</div>}

      {/* 3. Executive Retrospective Brief */}
      <ReviewExecutiveBrief brief={brief} monthLabel={`Full Year ${yearLabel}`} />

      {/* 4. Row 1: 2x1 Ratio (Category Breakdown 2 cols + YoY Period Comparison 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReviewSpendingBreakdown
          categories={data.topCategories}
          currency={data.targetCurrency}
          totalExpenseCents={data.metrics.totalExpenseCents}
          className="lg:col-span-2"
        />
        <ReviewPeriodComparison
          current={metrics}
          previous={data.previousYearMetrics}
          currentLabel={yearLabel}
          previousLabel="Prior Yr"
          currency={targetCurrency}
          className="lg:col-span-1"
        />
      </div>

      {/* 5. Row 2: 1x1x1 Ratio (12-Month Chart + Largest Outflows + Largest Inflows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReviewPeriodChart
          data={data.monthlyBreakdown}
          currency={targetCurrency}
          title={`${yearLabel}`}
          className="lg:col-span-1"
        />
        <ReviewOutflowsCard
          topExpenses={data.topExpenses || []}
          currency={targetCurrency}
          className="lg:col-span-1"
        />
        <ReviewInflowsCard
          topIncomes={data.topIncomes || []}
          currency={targetCurrency}
          className="lg:col-span-1"
        />
      </div>

      {/* 6. Row 3: Quarterly Rollup Table */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col justify-between">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Quarterly Rollup
            </span>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Performance Across Quarters of {yearLabel}
          </span>
        </div>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Quarter</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Inflow</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Outflow</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Net Savings</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Savings Rate</TableHead>
              <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quarterlyBreakdown.map((q) => {
              const rate =
                q.incomeCents > 0 ? Math.round((q.netSavingsCents / q.incomeCents) * 100) : 0
              const isBest = q.quarter === bestQuarter

              return (
                <TableRow
                  key={q.quarter}
                  className={cn(
                    "hover:bg-muted/40 transition-colors border-border/40",
                    isBest && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <TableCell className="font-semibold text-xs flex items-center gap-2 py-3">
                    <span>{q.label} {yearLabel}</span>
                    {isBest && (
                      <Badge variant="secondary" className="rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5 bg-primary/15 text-primary">
                        Best Quarter
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400 py-3">
                    {formatCurrency(q.incomeCents, targetCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-xs text-rose-600 dark:text-rose-400 py-3">
                    {formatCurrency(q.expenseCents, targetCurrency)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-bold text-xs py-3",
                      q.netSavingsCents >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {q.netSavingsCents >= 0 ? "+" : ""}
                    {formatCurrency(q.netSavingsCents, targetCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-xs py-3">
                    {rate}%
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <Link
                      href={`/reports?tab=quarterly&year=${data.year}&quarter=${q.quarter}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <span>Review</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
