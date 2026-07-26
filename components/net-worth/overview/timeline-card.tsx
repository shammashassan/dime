"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Net Worth Timeline</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-2 pt-4 sm:px-6">
        {historyData.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
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
                      })
                    }}
                    indicator="dot"
                    formatter={(value, name) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: `var(--color-${name})` }}
                        />
                        <div className="flex flex-1 justify-between leading-none">
                          <span className="text-muted-foreground">
                            {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCurrency(Number(value) / 100, currency)}
                          </span>
                        </div>
                      </>
                    )}
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
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No historical data available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}