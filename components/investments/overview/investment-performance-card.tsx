"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { InvestmentHolding, InvestmentTransaction } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { LineChart } from "lucide-react"

const chartConfig = {
  gain: { label: "Unrealized Gain", color: "var(--chart-1)" },
  dividends: { label: "Dividend Payouts", color: "var(--chart-2)" },
} satisfies ChartConfig

export function InvestmentPerformanceCard({
  holdings = [],
  transactions = [],
  currency = "USD",
}: {
  holdings?: InvestmentHolding[]
  transactions?: InvestmentTransaction[]
  currency?: string
}) {
  const [metricMode, setMetricMode] = React.useState<"gain" | "dividends">("gain")

  const holdingsWithValue = React.useMemo(() => {
    return holdings.map((h) => ({
      ...h,
      currentValue: h.quantity * h.currentPrice,
    }))
  }, [holdings])

  const totalValue = React.useMemo(() => {
    return holdingsWithValue.reduce((sum, h) => sum + Math.max(0, h.currentValue), 0)
  }, [holdingsWithValue])

  const totalCostBasis = React.useMemo(() => {
    return holdingsWithValue.reduce((sum, h) => sum + h.totalCostBasis, 0)
  }, [holdingsWithValue])

  const unrealizedGain = totalValue - totalCostBasis

  const totalDividends = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === "cash_dividend")
      .reduce((sum, t) => sum + t.quantity * t.price, 0)
  }, [transactions])

  const performanceTrendData = React.useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split("T")[0]

    // Deduplicated map of date -> point
    const pointsMap = new Map<string, { date: string; gain: number; dividends: number }>()

    // Initialize 30 days ago baseline
    pointsMap.set(startDateStr, {
      date: startDateStr,
      gain: 0,
      dividends: 0,
    })

    // Process transactions if any exist
    if (transactions.length > 0) {
      const sortedTx = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      let runningDividends = 0

      sortedTx.forEach((tx) => {
        const txDateStr = new Date(tx.date).toISOString().split("T")[0]
        if (tx.type === "cash_dividend") {
          runningDividends += tx.quantity * tx.price
        }

        // On historical transaction dates, baseline gain is 0 (purchased at cost)
        pointsMap.set(txDateStr, {
          date: txDateStr,
          gain: 0,
          dividends: runningDividends,
        })
      })
    }

    // Always set current today state
    pointsMap.set(todayStr, {
      date: todayStr,
      gain: Math.max(0, unrealizedGain),
      dividends: totalDividends,
    })

    // Convert map values to sorted array
    return Array.from(pointsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [transactions, unrealizedGain, totalDividends])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* Header with Mode Toggle */}
      <div className="px-4 py-3 border-b border-border/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChart className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Portfolio Performance Trajectory</span>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/30">
          <button
            onClick={() => setMetricMode("gain")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${metricMode === "gain"
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Unrealized Gain
          </button>
          <button
            onClick={() => setMetricMode("dividends")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${metricMode === "dividends"
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Dividends
          </button>
        </div>
      </div>

      {/* Body: Stat Highlights + Area Chart */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
              {metricMode === "gain" ? "Total Unrealized Gain" : "Cumulative Dividends Earned"}
            </span>
            <span className="text-lg font-black tracking-tight tabular-nums text-foreground leading-tight">
              {metricMode === "gain"
                ? `${unrealizedGain >= 0 ? "+" : ""}${formatCurrency(unrealizedGain, currency)}`
                : formatCurrency(totalDividends, currency)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">Portfolio Value</span>
              <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                {formatCurrency(totalValue, currency)}
              </span>
            </div>
            <div className="text-right border-l border-border/30 pl-3">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">Total Cost Basis</span>
              <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums">
                {formatCurrency(totalCostBasis, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Official AreaChart with Restored Stroke and No strokeWidth Prop */}
        <div className="flex-1 min-h-35 flex items-center justify-center pt-1">
          {performanceTrendData.length > 0 ? (
            <ChartContainer config={chartConfig} className="aspect-auto h-35 w-full">
              <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill_gain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-gain)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-gain)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fill_dividends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-dividends)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-dividends)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis hide domain={[0, "auto"]} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey={metricMode}
                  type="monotone"
                  fill={`url(#fill_${metricMode})`}
                  stroke={`var(--color-${metricMode})`}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-6">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
