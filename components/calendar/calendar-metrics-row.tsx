import React from "react"
import { formatCurrency } from "@/lib/utils"
import { MetricCard } from "@/components/ui/metric-card"
import { TrendingUp, TrendingDown, ArrowDownRight, ShieldAlert } from "lucide-react"
import { CashFlowMonthOverview } from "@/types"

interface CalendarMetricsRowProps {
  overview: CashFlowMonthOverview
}

export function CalendarMetricsRow({ overview }: CalendarMetricsRowProps) {
  const { totalInflow, totalOutflow, netCashFlow, lowestBalance, deficitDaysCount, targetCurrency } = overview

  const isLowestDeficit = lowestBalance < 0

  return (
    <div className="flex flex-wrap gap-4 w-full">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={TrendingUp}
        color="#10b981"
        label="Expected Inflow"
        value={formatCurrency(totalInflow, targetCurrency)}
        valueClassName="text-emerald-500"
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={TrendingDown}
        color="#ef4444"
        label="Scheduled Outflow"
        value={formatCurrency(totalOutflow, targetCurrency)}
        valueClassName="text-rose-500"
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={ArrowDownRight}
        color="#8b5cf6"
        label="Net Projected Flow"
        value={formatCurrency(netCashFlow, targetCurrency)}
        valueClassName={netCashFlow >= 0 ? "text-emerald-500" : "text-rose-500"}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={ShieldAlert}
        color={isLowestDeficit ? "#ef4444" : "#f59e0b"}
        label={isLowestDeficit ? `Deficit Warning (${deficitDaysCount}d)` : "Lowest Cash Point"}
        value={formatCurrency(lowestBalance, targetCurrency)}
        valueClassName={isLowestDeficit ? "text-rose-500" : undefined}
      />
    </div>
  )
}
