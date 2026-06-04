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

interface IncomeExpenseTrendChartProps {
  data: { month: string; income: number; expense: number }[]
  monthsCount: number
  currency?: string
}

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Expense",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function IncomeExpenseTrendChart({ data, monthsCount, currency = "USD" }: IncomeExpenseTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Income vs Expense Trend</CardTitle>
        <CardDescription>
          Cash flow over the last {monthsCount} {monthsCount === 1 ? "month" : "months"}
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
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor: item.color || item.payload?.fill,
                          }}
                        />
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">
                            {name === "income" ? "Income" : "Expense"}:
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
                dataKey="income"
                type="monotone"
                fill="var(--color-income)"
                fillOpacity={0.4}
                stroke="var(--color-income)"
                isAnimationActive={true}
              />
              <Area
                dataKey="expense"
                type="monotone"
                fill="var(--color-expense)"
                fillOpacity={0.4}
                stroke="var(--color-expense)"
                isAnimationActive={true}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No transaction trend data available.
          </div>
        )}
      </CardContent>
      {data.length > 0 && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                Tracking your cash flow <TrendingUp className="h-4 w-4" />
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