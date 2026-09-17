"use client"

import React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { formatCurrency } from "@/lib/utils"
import {
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Target,
} from "lucide-react"
import type { CoachOverviewData } from "@/types"

interface CoachMetricsRowProps {
  metrics: CoachOverviewData["metrics"]
  emergencyFund: CoachOverviewData["emergencyFund"]
  debtComparison: CoachOverviewData["debtComparison"]
  currency: string
  onOpenSimulator: () => void
}

export function CoachMetricsRow({
  metrics,
  emergencyFund,
  debtComparison,
  currency,
  onOpenSimulator,
}: CoachMetricsRowProps) {
  const runwayColor =
    emergencyFund.healthTier === "critical"
      ? "#ef4444"
      : emergencyFund.healthTier === "warning"
        ? "#f59e0b"
        : "#10b981"

  const cards = [
    {
      label: "Emergency Runway",
      value: `${emergencyFund.currentRunwayMonths} mo`,
      subtext: `${formatCurrency(emergencyFund.liquidSavingsCents, currency)} liquid reserve`,
      icon: ShieldCheck,
      color: runwayColor,
      onClick: onOpenSimulator,
    },
    {
      label: "Debt Payoff Horizon",
      value: debtComparison ? `${debtComparison.acceleratedPayoffMonths} mo` : "Debt Free",
      subtext: debtComparison
        ? `-${debtComparison.monthsSaved} mo faster with snowball`
        : "Zero active borrowed debt",
      icon: TrendingDown,
      color: "#6366f1",
      onClick: onOpenSimulator,
    },
    {
      label: "Monthly Optimization",
      value: `+${formatCurrency(metrics.potentialMonthlyOptimizationCents, currency)}`,
      subtext: "Identified savings & trimming",
      icon: Sparkles,
      color: "#f59e0b",
      onClick: onOpenSimulator,
    },
    {
      label: "Goals Velocity",
      value: `${metrics.goalsOnTrackRatio.onTrack} of ${metrics.goalsOnTrackRatio.total}`,
      subtext: "Milestones on schedule",
      icon: Target,
      color: "#8b5cf6",
      href: "/goals",
    },
  ]

  return (
    <div className="flex flex-wrap gap-4 w-full">
      {cards.map((card, idx) => (
        <MetricCard
          key={idx}
          icon={card.icon}
          color={card.color}
          label={card.label}
          value={card.value}
          subtext={card.subtext}
          onClick={card.onClick}
          href={card.href}
        />
      ))}
    </div>
  )
}
