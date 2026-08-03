"use client"

import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Landmark, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react"

export function SummaryCards({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { netWorth, totalAssets, totalLiabilities, moMChangePct, currency } = viewModel
  const isPositive = moMChangePct >= 0

  return (
    <div className="flex flex-wrap gap-4">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Landmark}
        color="#8b5cf6"
        label="Net Worth"
        value={formatCurrency(netWorth / 100, currency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={ArrowUpRight}
        color="#10b981"
        label="Total Assets"
        value={formatCurrency(totalAssets / 100, currency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={ArrowDownRight}
        color="#f43f5e"
        label="Total Liabilities"
        value={formatCurrency(totalLiabilities / 100, currency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={isPositive ? TrendingUp : TrendingDown}
        color={isPositive ? "#10b981" : "#f43f5e"}
        label="Trend Period"
        value={(isPositive ? "+" : "") + `${moMChangePct.toFixed(1)}%`}
        valueClassName={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
      />
    </div>
  )
}
