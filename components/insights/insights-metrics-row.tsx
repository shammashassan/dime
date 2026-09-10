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
        icon={AlertTriangle}
        color="#f59e0b"
        label="Anomalies Flagged"
        value={metrics.anomalyCount.toString()}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={PiggyBank}
        color="#8b5cf6"
        label="Monthly Savings Potential"
        value={formatCurrency(metrics.potentialSavingsMonthlyCents, currency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Flame}
        color="#ef4444"
        label="Discretionary Surge"
        value={formatCurrency(metrics.discretionarySurgeCents, currency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={BellRing}
        color="#0ea5e9"
        label="Active Signals"
        value={metrics.activeCount.toString()}
      />
    </div>
  )
}
