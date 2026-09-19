"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"

export interface NetSavingsChartProps {
  data: { month: string; savings: number }[]
  currency?: string
  className?: string
}

const chartConfig = {
  savings: {
    label: "Net Savings",
    color: "#10b981",
  },
} satisfies ChartConfig

export function NetSavingsChart({
  data = [],
  currency = "USD",
  className,
}: NetSavingsChartProps) {
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
            savings momentum
          </span>
          {data.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
              {data.length}m
            </span>
          )}
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 min-w-0 pt-1">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
              <XAxis
                dataKey="month"
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
                    formatter={(value) => {
                      const amount = Number(value)
                      const isPositive = amount >= 0
                      return (
                        <div className="flex flex-1 justify-between items-center leading-none gap-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor: isPositive ? "#10b981" : "#f43f5e",
                              }}
                            />
                            <span className="text-muted-foreground font-medium">Net Savings</span>
                          </div>
                          <span
                            className={cn(
                              "font-mono font-bold",
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {formatCurrency(amount * 100, currency)}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Bar dataKey="savings" maxBarSize={32} radius={[4, 4, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.savings >= 0 ? "#10b981" : "#f43f5e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No net savings data available.
          </div>
        )}
      </div>
    </Card>
  )
}