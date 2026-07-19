"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"

const areaChartConfig = {
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
} as const

export function TimelineCard({ historyData, currency }: { historyData: any[]; currency: string }) {
  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle className="text-base font-bold">Net Worth Timeline</CardTitle>
            <CardDescription className="text-xs">History of assets vs liabilities</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        {historyData.length > 0 ? (
          <ChartContainer config={areaChartConfig} className="aspect-auto h-[230px] w-full">
            <AreaChart data={historyData}>
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
                  const d = new Date(value)
                  if (Number.isNaN(d.getTime())) return String(value)
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => {
                  if (val >= 100000000) return `${(val / 100000000).toFixed(0)}M`
                  if (val >= 100000) return `${(val / 100000).toFixed(0)}k`
                  if (val <= -100000) return `-${(Math.abs(val) / 100000).toFixed(0)}k`
                  return (val / 100).toFixed(0)
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => {
                      const d = new Date(value)
                      if (Number.isNaN(d.getTime())) return String(value)
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value, name) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: `var(--color-${name})` }}
                        />
                        <div className="flex flex-1 justify-between leading-none">
                          <span className="text-muted-foreground text-[10px]">
                            {areaChartConfig[name as keyof typeof areaChartConfig]?.label ?? name}
                          </span>
                          <span className="font-mono text-[10px] font-medium tabular-nums text-foreground">
                            {formatCurrency(Number(value) / 100, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="totalAssets"
                type="natural"
                fill="url(#fillAssets)"
                stroke="var(--color-totalAssets)"
                stackId="a"
              />
              <Area
                dataKey="totalLiabilities"
                type="natural"
                fill="url(#fillLiabilities)"
                stroke="var(--color-totalLiabilities)"
                stackId="b"
              />
              <Area
                dataKey="netWorth"
                type="natural"
                fill="url(#fillNetWorth)"
                stroke="var(--color-netWorth)"
                stackId="c"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[230px] text-muted-foreground text-sm">
            No historical data available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
