"use client"

import React from "react"
import type { TimelineSummaryStats } from "@/types"
import { MetricCard } from "@/components/ui/metric-card"
import { formatCurrency } from "@/lib/utils"
import {
  History,
  Trophy,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
} from "lucide-react"

interface TimelineStatsBannerProps {
  stats: TimelineSummaryStats
}

export function TimelineStatsBanner({ stats }: TimelineStatsBannerProps) {
  const isNetPositive = stats.netFlow >= 0

  const cards = [
    {
      label: "Total Activity",
      value: stats.totalEvents,
      subtext: "Recorded events",
      icon: History,
      color: "#6366f1",
    },
    {
      label: "Milestones",
      value: stats.milestonesCount,
      subtext: "Goals & achievements",
      icon: Trophy,
      color: "#f59e0b",
    },
    {
      label: "Total Inflow",
      value: formatCurrency(stats.totalInflow, stats.currency),
      subtext: "Income & settlements",
      icon: ArrowDownLeft,
      color: "#10b981",
    },
    {
      label: "Total Outflow",
      value: formatCurrency(stats.totalOutflow, stats.currency),
      subtext: "Spending & payments",
      icon: ArrowUpRight,
      color: "#ef4444",
    },
    {
      label: "Net Cash Flow",
      value: `${isNetPositive ? "+" : ""}${formatCurrency(stats.netFlow, stats.currency)}`,
      subtext: isNetPositive ? "Positive net flow" : "Negative net flow",
      icon: Activity,
      color: isNetPositive ? "#10b981" : "#ef4444",
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
          style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
        />
      ))}
    </div>
  )
}
