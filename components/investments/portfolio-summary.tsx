"use client"

import { MetricCard } from "@/components/ui/metric-card"
import { PortfolioViewModel } from "@/lib/calculations/investments"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, ArrowUpRight, ArrowDownRight, Coins, PieChart, Layers } from "lucide-react"

export function PortfolioSummary({ data, currency }: { data: PortfolioViewModel; currency: string }) {
  const isPositive = data.unrealizedGain >= 0
  const returnPercentage = data.totalCostBasis > 0 ? (data.unrealizedGain / data.totalCostBasis) * 100 : 0
  const activeHoldingsCount = data.holdingsCount ?? 0

  const cards = [
    {
      label: "Portfolio Value",
      value: formatCurrency(data.totalValue, currency),
      icon: TrendingUp,
      color: "#8b5cf6",
    },
    {
      label: (
        <div className="flex items-center justify-between gap-1 min-w-0">
          <span className="truncate">Unrealized P&L</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 leading-none ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            }`}
          >
            {isPositive ? "+" : ""}
            {returnPercentage.toFixed(1)}%
          </span>
        </div>
      ),
      value: `${isPositive ? "+" : ""}${formatCurrency(data.unrealizedGain, currency)}`,
      icon: isPositive ? ArrowUpRight : ArrowDownRight,
      color: isPositive ? "#10b981" : "#f43f5e",
      valueClassName: isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Total Cost Basis",
      value: formatCurrency(data.totalCostBasis, currency),
      icon: Coins,
      color: "#3b82f6",
    },
    {
      label: "Realized Gain",
      value: formatCurrency(data.realizedGain, currency),
      icon: PieChart,
      color: "#f59e0b",
    },
    {
      label: "Active Holdings",
      value: `${activeHoldingsCount} ${activeHoldingsCount === 1 ? "position" : "positions"}`,
      icon: Layers,
      color: "#ec4899",
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
          valueClassName={card.valueClassName}
          style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
        />
      ))}
    </div>
  )
}
