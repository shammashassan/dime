"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn, formatCurrency } from "@/lib/utils"
import type { PeriodReviewMonthlyBreakdown } from "@/types"

interface ReviewPeriodChartProps {
  data: PeriodReviewMonthlyBreakdown[]
  currency: string
  title?: string
  description?: string
  className?: string
}

const chartConfig = {
  income: {
    label: "Income",
    color: "#10b981",
  },
  expense: {
    label: "Expense",
    color: "#f43f5e",
  },
} satisfies ChartConfig

export function ReviewPeriodChart({
  data,
  currency = "USD",
  title = "Cash Flow Breakdown",
  className,
}: ReviewPeriodChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((d) => ({
      month: d.monthLabel,
      income: d.incomeCents / 100,
      expense: d.expenseCents / 100,
      net: d.netSavingsCents / 100,
    }))
  }, [data])

  const hasData = chartData.some((d) => d.income > 0 || d.expense > 0)

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-tight">
          monthly cash flow
        </span>
        <span className="text-[11px] font-mono text-muted-foreground shrink-0 text-right">
          {title}
        </span>
      </div>
      <div className="p-4 flex-1">
        {hasData ? (
          <ChartContainer config={chartConfig} className="w-full h-48 sm:h-[216px]">
            <BarChart data={chartData} margin={{ top: 8, left: -14, right: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis
                width={36}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                fontSize={11}
                tickFormatter={(val) => {
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
                  return String(val)
                }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => (
                      <div className="flex justify-between items-center w-36 text-xs">
                        <span className="text-muted-foreground capitalize">{String(name)}:</span>
                        <span className="font-mono font-bold">
                          {formatCurrency(Number(value) * 100, currency)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[216px] text-muted-foreground text-sm">
            No transaction data recorded for this period.
          </div>
        )}
      </div>
    </Card>
  )
}
