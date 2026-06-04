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

interface SpendingDayChartProps {
  data: { day: string; amount: number }[]
  currency?: string
}

const chartConfig = {
  amount: {
    label: "Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function SpendingDayChart({ data, currency = "USD" }: SpendingDayChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Spending by Day of Week</CardTitle>
        <CardDescription>Aggregate expenses by weekday over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {data.some((d) => d.amount > 0) ? (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor: item.color || item.payload?.fill,
                          }}
                        />
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">Spending:</span>
                          <span className="font-mono font-bold text-foreground ml-2">
                            {formatCurrency(Number(value) * 100, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={8} isAnimationActive={true} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No spending recorded in the last 30 days.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Weekday spending breakdown <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing aggregate expenses for the last 30 days
        </div>
      </CardFooter>
    </Card>
  )
}