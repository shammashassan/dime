"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"

export interface SpendingDayChartProps {
  data: { day: string; amount: number }[]
  currency?: string
  className?: string
}

const chartConfig = {
  amount: {
    label: "Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function SpendingDayChart({
  data = [],
  currency = "USD",
  className,
}: SpendingDayChartProps) {
  const hasData = data.some((d) => d.amount > 0)

  return (
    <Card
      className={cn(
        "@container/card bento-tile flex h-full flex-col justify-between border-border/50 p-5 shadow-xs",
        className
      )}
    >
      {/* Micro-header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            spending rhythm
          </span>
          <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
            7 days
          </span>
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 min-w-0 pt-1">
        {hasData ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                    indicator="dot"
                    formatter={(value) => (
                      <div className="flex flex-1 justify-between items-center leading-none gap-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="size-2.5 shrink-0 rounded-xs"
                            style={{
                              backgroundColor: "var(--chart-1)",
                            }}
                          />
                          <span className="text-muted-foreground font-medium">Spending</span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(Number(value) * 100, currency)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No spending recorded across days of week.
          </div>
        )}
      </div>
    </Card>
  )
}