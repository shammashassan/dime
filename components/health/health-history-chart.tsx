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
import { MonthlyHealthTrend } from "@/types"

const chartConfig = {
  overallScore: {
    label: "Health Score",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function HealthHistoryChart({ data }: { data: MonthlyHealthTrend[] }) {
  return (
    <Card className="flex flex-col h-full gap-2 py-4">
      <CardHeader className="pb-1 px-4 sm:px-6">
        <CardTitle>Health Score Timeline</CardTitle>
        <CardDescription>
          Historical trajectory of your composite financial health score over time.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-2 sm:px-6">
        {data && data.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-45 w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillHealthScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-overallScore)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-overallScore)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  if (!value) return ""
                  const parts = String(value).split("-")
                  if (parts.length === 2) {
                    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      year: "2-digit",
                    })
                  }
                  return String(value)
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      if (!value) return ""
                      const parts = String(value).split("-")
                      if (parts.length === 2) {
                        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
                        return date.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      }
                      return String(value)
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
                            {Number(value)} / 100
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Area
                dataKey="overallScore"
                type="monotone"
                fill="url(#fillHealthScore)"
                stroke="var(--color-overallScore)"
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