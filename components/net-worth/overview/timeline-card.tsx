"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { HistoricalNetWorthPoint } from "@/types"

const chartConfig = {
  netWorth: { label: "Net Worth", color: "var(--chart-1)" },
  totalAssets: { label: "Total Assets", color: "var(--chart-2)" },
  totalLiabilities: { label: "Total Liabilities", color: "var(--chart-5)" },
} satisfies ChartConfig

export function TimelineCard({
  historyData,
  currency,
}: {
  historyData: HistoricalNetWorthPoint[]
  currency: string
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Net Worth Timeline</CardTitle>
        <CardDescription>
          Historical trajectory of total assets, liabilities, and overall net worth over time.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-1 pb-3 sm:px-6">
        {historyData.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-47.5 w-full">
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalAssets)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalAssets)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLiabilities" x1="0" y1="0" x2="0" y2="1">
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
                    year: "2-digit",
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
                            <span className="text-muted-foreground font-medium">
                              {label}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-foreground">
                            {formatCurrency(Number(value) / 100, currency)}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              {/* Not stacked: these are three independent metrics
                  (netWorth = totalAssets - totalLiabilities), not parts
                  of a whole, so they must not share a stackId. */}
              <Area
                dataKey="totalAssets"
                type="monotone"
                fill="url(#fillAssets)"
                stroke="var(--color-totalAssets)"
              />
              <Area
                dataKey="totalLiabilities"
                type="monotone"
                fill="url(#fillLiabilities)"
                stroke="var(--color-totalLiabilities)"
              />
              <Area
                dataKey="netWorth"
                type="monotone"
                fill="url(#fillNetWorth)"
                stroke="var(--color-netWorth)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-47.5 text-muted-foreground text-sm">
            No historical data available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}