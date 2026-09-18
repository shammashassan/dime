"use client"

import * as React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { formatCurrency } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, Landmark, Percent } from "lucide-react"

export interface ReviewHeroSummaryProps {
  metrics: {
    totalIncomeCents: number
    totalExpenseCents: number
    netSavingsCents: number
    savingsRatePercentage: number
    incomeDeltaPercentage?: number
    expenseDeltaPercentage?: number
    openingNetWorthCents?: number
    closingNetWorthCents?: number
    netWorthOpeningCents?: number
    netWorthClosingCents?: number
    netWorthDeltaCents: number
  }
  currency: string
  comparisonLabel?: string
}

export function ReviewHeroSummary({
  metrics,
  currency,
  comparisonLabel = "MoM",
}: ReviewHeroSummaryProps) {
  const isNetPositive = metrics.netSavingsCents >= 0
  const isNetWorthUp = metrics.netWorthDeltaCents >= 0

  const periodWord = comparisonLabel === "YoY" ? "year" : comparisonLabel === "QoQ" ? "quarter" : "month"

  const incDelta = metrics.incomeDeltaPercentage ?? 0
  const expDelta = metrics.expenseDeltaPercentage ?? 0

  const incomeSubtext =
    incDelta !== 0
      ? `${incDelta > 0 ? "+" : ""}${incDelta}% ${comparisonLabel}`
      : `Total ${periodWord} inflows`

  const expenseSubtext =
    expDelta !== 0
      ? `${expDelta > 0 ? "+" : ""}${expDelta}% ${comparisonLabel}`
      : `Total ${periodWord} outflows`

  const closingBalance = metrics.closingNetWorthCents ?? metrics.netWorthClosingCents ?? 0
  const savingsSubtext = `${isNetPositive ? "+" : ""}${formatCurrency(metrics.netSavingsCents, currency)} retained`
  const netWorthSubtext = `Closing balance: ${formatCurrency(closingBalance, currency)}`

  return (
    <div className="flex flex-wrap gap-4">
      {/* 1. Total Inflow */}
      <MetricCard
        icon={ArrowUpRight}
        color="#10b981"
        label="Total Inflow"
        value={formatCurrency(metrics.totalIncomeCents, currency)}
        subtext={incomeSubtext}
      />

      {/* 2. Total Outflow */}
      <MetricCard
        icon={ArrowDownRight}
        color="#f43f5e"
        label="Total Outflow"
        value={formatCurrency(metrics.totalExpenseCents, currency)}
        subtext={expenseSubtext}
      />

      {/* 3. Net Savings Rate */}
      <MetricCard
        icon={Percent}
        color="#3b82f6"
        label="Net Savings Rate"
        value={`${metrics.savingsRatePercentage}%`}
        subtext={savingsSubtext}
      />

      {/* 4. Net Worth Shift */}
      <MetricCard
        icon={Landmark}
        color="#8b5cf6"
        label="Net Worth Shift"
        value={`${isNetWorthUp ? "+" : ""}${formatCurrency(metrics.netWorthDeltaCents, currency)}`}
        subtext={netWorthSubtext}
      />
    </div>
  )
}
