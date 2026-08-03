"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { LineChart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { ForecastPoint } from "@/types"

interface PlannerChartProps {
  points: ForecastPoint[]
  currency: string
  horizonMonths: number
}

const chartConfig = {
  baseline: { label: "Baseline", color: "var(--chart-4)" },
  simulated: { label: "Simulated", color: "var(--chart-1)" },
} satisfies ChartConfig

export function PlannerChart({ points, currency, horizonMonths }: PlannerChartProps) {
  const [metricMode, setMetricMode] = useState<"netWorth" | "liquidCash">("netWorth")

  const chartData = points.map((p) => ({
    date: p.dateStr,
    baseline: (metricMode === "netWorth" ? p.baselineNetWorth : p.baselineLiquidCash) / 100,
    simulated: (metricMode === "netWorth" ? p.simulatedNetWorth : p.simulatedLiquidCash) / 100,
  }))

  const latest = points[points.length - 1]
  const simulatedValue = latest ? (metricMode === "netWorth" ? latest.simulatedNetWorth : latest.simulatedLiquidCash) : 0
  const baselineValue = latest ? (metricMode === "netWorth" ? latest.baselineNetWorth : latest.baselineLiquidCash) : 0
  const delta = simulatedValue - baselineValue
  const isPositive = delta >= 0

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* Header with Mode Toggle — matches investment-performance-card */}
      <div className="px-4 py-3 border-b border-border/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChart className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Financial Forecast Trajectory</span>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/30">
          <button
            onClick={() => setMetricMode("netWorth")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${metricMode === "netWorth"
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Net Worth
          </button>
          <button
            onClick={() => setMetricMode("liquidCash")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${metricMode === "liquidCash"
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Liquid Cash
          </button>
        </div>
      </div>

      {/* Body: Stat Highlights + Area Chart */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
              Simulated {metricMode === "netWorth" ? "Net Worth" : "Liquid Cash"} &middot; {horizonMonths}mo
            </span>
            <span className="text-lg font-black tracking-tight tabular-nums text-foreground leading-tight">
              {formatCurrency(simulatedValue, currency)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">Baseline</span>
              <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums">
                {formatCurrency(baselineValue, currency)}
              </span>
            </div>
            <div className="text-right border-l border-border/30 pl-3">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">vs Baseline</span>
              <span className={cn("text-xs font-mono font-bold tabular-nums inline-flex items-center gap-0.5", isPositive ? "text-emerald-500" : "text-rose-500")}>
                {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {formatCurrency(Math.abs(delta), currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-56 flex items-center justify-center pt-1">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill_planner_simulated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-simulated)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-simulated)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fill_planner_baseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-baseline)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-baseline)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis
                  hide
                  domain={["auto", "auto"]}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name) => {
                        const isSimulated = name === "simulated"
                        const dotColor = isSimulated ? "var(--color-simulated)" : "var(--color-baseline)"
                        return (
                          <div className="flex flex-1 justify-between items-center leading-none gap-4">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-xs"
                                style={{ backgroundColor: dotColor }}
                              />
                              <span className="text-muted-foreground font-medium">
                                {isSimulated ? "Simulated" : "Baseline"}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-foreground">
                              {formatCurrency(Number(value), currency)}
                            </span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Area
                  dataKey="baseline"
                  type="monotone"
                  stroke="var(--color-baseline)"
                  fill="url(#fill_planner_baseline)"
                />
                <Area
                  dataKey="simulated"
                  type="monotone"
                  stroke="var(--color-simulated)"
                  fill="url(#fill_planner_simulated)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-6">
              No forecast data available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}