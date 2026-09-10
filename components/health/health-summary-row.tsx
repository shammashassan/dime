"use client"

import * as React from "react"
import { FinancialHealthData } from "@/types"
import { MetricCard } from "@/components/ui/metric-card"
import { Activity, Droplet, PiggyBank, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

interface HealthSummaryRowProps {
  data: FinancialHealthData
}

export function HealthSummaryRow({ data }: HealthSummaryRowProps) {
  const { overallScore, tier, scoreDelta, pillars } = data

  const tierColors: Record<string, string> = {
    excellent: "#10b981",
    good: "#8b5cf6",
    fair: "#f59e0b",
    needs_attention: "#ef4444",
  }

  const scoreColor = tierColors[tier] || "#8b5cf6"
  const runway = pillars.liquidity?.metrics[0]?.value || "0 mos"
  const savingsRate = pillars.savings?.metrics[0]?.value || "0%"
  const debtRatio = pillars.debt?.metrics[0]?.value || "0%"

  const deltaText =
    scoreDelta > 0 ? `+${scoreDelta} pts` : scoreDelta < 0 ? `${scoreDelta} pts` : "Steady"

  return (
    <div className="flex flex-wrap gap-4 w-full">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Activity}
        color={scoreColor}
        label={
          <span className="flex items-center gap-1.5">
            <span>Wellness Score</span>
            <span
              className={cn(
                "text-[9px] font-semibold lowercase tracking-normal",
                scoreDelta > 0
                  ? "text-emerald-500"
                  : scoreDelta < 0
                  ? "text-rose-500"
                  : "text-muted-foreground"
              )}
            >
              ({deltaText})
            </span>
          </span>
        }
        value={`${overallScore} / 100`}
        valueClassName="capitalize"
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Droplet}
        color="#0ea5e9"
        label="Emergency Runway"
        value={runway}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={PiggyBank}
        color="#10b981"
        label="Net Savings Rate"
        value={savingsRate}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Scale}
        color="#f59e0b"
        label="Debt-to-Asset"
        value={debtRatio}
      />
    </div>
  )
}
