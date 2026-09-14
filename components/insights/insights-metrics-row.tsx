import React from "react"
import { formatCurrency } from "@/lib/utils"
import { MetricCard } from "@/components/ui/metric-card"
import { AlertTriangle, PiggyBank, Flame, BellRing } from "lucide-react"

interface InsightsMetricsRowProps {
  metrics: {
    activeCount: number
    anomalyCount: number
    potentialSavingsMonthlyCents: number
    discretionarySurgeCents: number
  }
  currency: string
}

export function InsightsMetricsRow({ metrics, currency }: InsightsMetricsRowProps) {
  return (
    <div className="flex flex-wrap gap-4 w-full">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={BellRing}
        color="#8b5cf6"
        label="Active Signals"
        value={metrics.activeCount.toString()}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={AlertTriangle}
        color="#f59e0b"
        label="Anomalies Flagged"
        value={metrics.anomalyCount.toString()}
        valueClassName={metrics.anomalyCount > 0 ? "text-amber-500" : undefined}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={PiggyBank}
        color="#10b981"
        label="Monthly Savings Potential"
        value={formatCurrency(metrics.potentialSavingsMonthlyCents, currency)}
        valueClassName="text-emerald-500"
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Flame}
        color="#ef4444"
        label="Discretionary Surge"
        value={formatCurrency(metrics.discretionarySurgeCents, currency)}
        valueClassName={metrics.discretionarySurgeCents > 0 ? "text-rose-500" : undefined}
      />
    </div>
  )
}
