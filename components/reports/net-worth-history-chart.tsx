"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { formatCurrency } from "@/lib/utils"

interface NetWorthHistoryChartProps {
  data: { month: string; netWorth: number; totalAssets: number; totalLiabilities: number }[]
  monthsCount: number
  currency?: string
}

const chartConfig = {
  totalAssets: {
    label: "Total Assets",
    color: "var(--chart-2)",
  },
  totalLiabilities: {
    label: "Total Liabilities",
    color: "var(--chart-5)",
  },
  netWorth: {
    label: "Net Worth",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function NetWorthHistoryChart({ data, monthsCount, currency = "USD" }: NetWorthHistoryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Net Worth History</CardTitle>
        <CardDescription>
          Assets, liabilities, and net worth trend over the last {monthsCount} {monthsCount === 1 ? "month" : "months"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <defs>
                <linearGradient id="fillTotalAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalAssets)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalAssets)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillTotalLiabilities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalLiabilities)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalLiabilities)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-xs"
                          style={{
                            backgroundColor: item.color || item.payload?.fill,
                          }}
                        />
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">
                            {name === "netWorth" ? "Net Worth" : name === "totalAssets" ? "Total Assets" : "Total Liabilities"}:
                          </span>
                          <span className="font-mono font-bold text-foreground ml-2">
                            {formatCurrency(Number(value) * 100, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="totalAssets"
                type="monotone"
                fill="url(#fillTotalAssets)"
                stroke="var(--color-totalAssets)"
                isAnimationActive={true}
              />
              <Area
                dataKey="totalLiabilities"
                type="monotone"
                fill="url(#fillTotalLiabilities)"
                stroke="var(--color-totalLiabilities)"
                isAnimationActive={true}
              />
              <Area
                dataKey="netWorth"
                type="monotone"
                fill="url(#fillNetWorth)"
                stroke="var(--color-netWorth)"
                isAnimationActive={true}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-75 text-muted-foreground text-sm">
            No net worth trend data available.
          </div>
        )}
      </CardContent>
      {data.length > 0 && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                Tracking your total net worth <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                Last {monthsCount} {monthsCount === 1 ? "month" : "months"}
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
