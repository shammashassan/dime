"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface WalletDetailChartProps {
  initialData: { month: string; balance: number }[]
  currency: string
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function WalletDetailChart({ initialData, currency }: WalletDetailChartProps) {
  return (
    <Card className="border border-border/40 shadow-xl bg-card">
      <CardHeader className="flex flex-col items-start gap-1 pb-4">
        <CardTitle className="text-lg font-bold">Balance History</CardTitle>
        <CardDescription className="text-xs">End-of-month balance trend over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {initialData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <AreaChart
              data={initialData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value * 100, currency)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => [formatCurrency(Number(value) * 100, currency), "Balance"]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No history data available for this wallet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
