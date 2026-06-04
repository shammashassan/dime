"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { formatCurrency } from "@/lib/utils"

interface BudgetPerformanceChartProps {
  data: { name: string; category: string; limit: number; spent: number }[]
  currency?: string
}

const chartConfig = {
  limit: {
    label: "Limit",
    color: "var(--chart-1)",
  },
  spent: {
    label: "Spent",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function BudgetPerformanceChart({ data, currency = "USD" }: BudgetPerformanceChartProps) {
  const totalLimit = data.reduce((sum, item) => sum + item.limit, 0)
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0)

  const percentage = totalLimit > 0
    ? ((totalSpent / totalLimit) * 100).toFixed(1)
    : "0"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Performance</CardTitle>
        <CardDescription>
          Compare spending limits vs actual spending across active budgets
        </CardDescription>
      </CardHeader>

      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 8)}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor: item.color || item.payload?.fill,
                          }}
                        />
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">
                            {name === "limit" ? "Limit" : "Spent"}:
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

              <Bar
                dataKey="limit"
                fill="var(--color-limit)"
                radius={4}
                maxBarSize={30}
                isAnimationActive={true}
              />

              <Bar
                dataKey="spent"
                fill="var(--color-spent)"
                radius={4}
                maxBarSize={30}
                isAnimationActive={true}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No active budgets to display performance.
          </div>
        )}
      </CardContent>

      {data.length > 0 && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            Budget usage at {percentage}% <TrendingUp className="h-4 w-4" />
          </div>

          <div className="leading-none text-muted-foreground">
            Showing total budget allocation and spending
          </div>
        </CardFooter>
      )}
    </Card>
  )
}