"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"

export interface NetWorthHistoryChartProps {
  data: { date?: string; month?: string; netWorth: number; totalAssets: number; totalLiabilities: number }[]
  currency?: string
  className?: string
}

const chartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "var(--chart-1)",
  },
  totalAssets: {
    label: "Total Assets",
    color: "var(--chart-2)",
  },
  totalLiabilities: {
    label: "Total Liabilities",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function NetWorthHistoryChart({
  data = [],
  currency = "USD",
  className,
}: NetWorthHistoryChartProps) {
  return (
    <Card
      className={cn(
        "@container/card bento-tile flex h-full flex-col justify-between border-border/50 p-5 shadow-xs",
        className
      )}
    >
      {/* Micro-header */}
      <div className="flex flex-col gap-0.5 pb-2 border-b border-border/30">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          wealth trajectory
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Net Worth Timeline
        </h3>
      </div>

      {/* Chart Body */}
      <div className="flex-1 min-w-0 pt-1">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillNetWorthReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillAssetsReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalAssets)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalAssets)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLiabilitiesReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalLiabilities)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalLiabilities)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
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
                      return new Date(String(value)).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                    formatter={(value, name, item) => {
                      const label = chartConfig[name as keyof typeof chartConfig]?.label || String(name)
                      const indicatorColor = item.color || `var(--color-${name})`
                      return (
                        <div className="flex flex-1 justify-between items-center leading-none gap-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-xs"
                              style={{ backgroundColor: indicatorColor }}
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
              <Area
                dataKey="totalAssets"
                type="monotone"
                fill="url(#fillAssetsReport)"
                stroke="var(--color-totalAssets)"
              />
              <Area
                dataKey="totalLiabilities"
                type="monotone"
                fill="url(#fillLiabilitiesReport)"
                stroke="var(--color-totalLiabilities)"
              />
              <Area
                dataKey="netWorth"
                type="monotone"
                fill="url(#fillNetWorthReport)"
                stroke="var(--color-netWorth)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No net worth timeline data available.
          </div>
        )}
      </div>
    </Card>
  )
}
