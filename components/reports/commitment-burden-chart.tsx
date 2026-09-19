"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"

export interface CommitmentBurdenItem {
  name: string
  value: number
  color: string
}

export interface CommitmentBurdenData {
  fixed: number
  discretionary: number
  total: number
  fixedPercentage: number
  activeRulesCount: number
  recurringItems?: CommitmentBurdenItem[]
}

export interface CommitmentBurdenChartProps {
  data: CommitmentBurdenData
  currency?: string
  className?: string
}

const chartConfig = {
  fixed: {
    label: "Fixed Commitments",
    color: "var(--chart-1)",
  },
  discretionary: {
    label: "Discretionary",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function CommitmentBurdenChart({
  data,
  currency = "USD",
  className,
}: CommitmentBurdenChartProps) {
  const [hoveredSlice, setHoveredSlice] = React.useState<string | null>(null)

  const fixedPct = data.total > 0 ? (data.fixed / data.total) * 100 : 0
  const discPct = data.total > 0 ? (data.discretionary / data.total) * 100 : 0

  const pieData = React.useMemo(() => {
    if (data.total === 0) return []
    return [
      {
        name: "Fixed Commitments",
        key: "fixed",
        value: data.fixed,
        color: "var(--chart-1)",
      },
      {
        name: "Discretionary",
        key: "discretionary",
        value: data.discretionary,
        color: "var(--chart-2)",
      },
    ].filter((d) => d.value > 0)
  }, [data])

  return (
    <Card
      className={cn(
        "@container/card bento-tile flex h-full flex-col justify-between border-border/50 p-5 shadow-xs",
        className
      )}
    >
      {/* Micro-header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            commitment burden
          </span>
          {data.activeRulesCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
              {data.activeRulesCount} active
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
          {formatCurrency(data.total * 100, currency)}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-between min-h-0 pt-1">
        {pieData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No expense transactions recorded.
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 justify-between gap-2">
            {/* Half-donut arc gauge */}
            <div className="w-full flex items-center justify-center shrink-0">
              <ChartContainer
                config={chartConfig}
                className="w-full max-w-[220px] h-[95px] mx-auto overflow-visible"
              >
                <PieChart margin={{ top: 0, bottom: 0, left: 8, right: 8 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="95%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={54}
                    outerRadius={74}
                    cornerRadius={3}
                    paddingAngle={2}
                    minAngle={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setHoveredSlice(pieData[index]?.key || null)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    {pieData.map((entry) => {
                      const isHighlighted = hoveredSlice === null || hoveredSlice === entry.key
                      return (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          style={{
                            opacity: isHighlighted ? 1 : 0.35,
                            transition: "opacity 0.2s ease-in-out",
                            outline: "none",
                          }}
                        />
                      )
                    })}
                  </Pie>
                  <text x="50%" y="95%" textAnchor="middle" className="pointer-events-none">
                    <tspan
                      x="50%"
                      dy="-8"
                      className="fill-foreground text-xs font-extrabold tabular-nums tracking-tight font-mono"
                    >
                      {formatCurrency(data.total * 100, currency)}
                    </tspan>
                    <tspan
                      x="50%"
                      dy="13"
                      className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider font-mono"
                    >
                      Total
                    </tspan>
                  </text>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) => {
                          const label = String(name)
                          const color = item.payload?.color || item.color || item.payload?.fill
                          return (
                            <div className="flex flex-1 justify-between items-center leading-none gap-4">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="size-2.5 shrink-0 rounded-[2px]"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-muted-foreground font-medium">{label}</span>
                              </div>
                              <span className="font-mono font-bold text-foreground">
                                {formatCurrency(Number(value) * 100, currency)}
                              </span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            </div>

            {/* Responsive 2-column stat cards */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
              {/* Fixed */}
              <div
                className={cn(
                  "flex flex-col p-2 rounded-lg transition-colors border border-border/40 bg-muted/20 cursor-default min-w-0",
                  hoveredSlice === "fixed" ? "bg-muted border-border" : "hover:bg-muted/40"
                )}
                onMouseEnter={() => setHoveredSlice("fixed")}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                  <span className="size-2 rounded-full shrink-0 bg-[var(--chart-1)]" />
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    Fixed
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono ml-auto shrink-0">
                    {fixedPct.toFixed(0)}%
                  </span>
                </div>
                <span className="font-mono text-xs sm:text-sm font-semibold text-foreground truncate">
                  {formatCurrency(data.fixed * 100, currency)}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                  {data.activeRulesCount} active rule{data.activeRulesCount === 1 ? "" : "s"}
                </span>
              </div>

              {/* Discretionary */}
              <div
                className={cn(
                  "flex flex-col p-2 rounded-lg transition-colors border border-border/40 bg-muted/20 cursor-default min-w-0",
                  hoveredSlice === "discretionary" ? "bg-muted border-border" : "hover:bg-muted/40"
                )}
                onMouseEnter={() => setHoveredSlice("discretionary")}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                  <span className="size-2 rounded-full shrink-0 bg-[var(--chart-2)]" />
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    Discretionary
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono ml-auto shrink-0">
                    {discPct.toFixed(0)}%
                  </span>
                </div>
                <span className="font-mono text-xs sm:text-sm font-semibold text-foreground truncate">
                  {formatCurrency(data.discretionary * 100, currency)}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                  Variable outflow
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
