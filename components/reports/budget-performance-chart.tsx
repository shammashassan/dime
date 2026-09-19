"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PiggyBank } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

export interface BudgetPerformanceChartProps {
  data: { name: string; category: string; limit: number; spent: number }[]
  currency?: string
  className?: string
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

export function BudgetPerformanceChart({
  data = [],
  currency = "USD",
  className,
}: BudgetPerformanceChartProps) {
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
            budget adherence
          </span>
          {data.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
              {data.length}
            </span>
          )}
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 min-w-0 pt-1">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 10)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name, item) => (
                      <div className="flex flex-1 justify-between items-center leading-none gap-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="size-2.5 shrink-0 rounded-xs"
                            style={{
                              backgroundColor: item.color || item.payload?.fill,
                            }}
                          />
                          <span className="text-muted-foreground font-medium">
                            {name === "limit" ? "Limit" : "Spent"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(Number(value) * 100, currency)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="limit"
                fill="var(--color-limit)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="spent"
                fill="var(--color-spent)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
              <PiggyBank className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">No active budgets found</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Set up monthly spending targets for your categories to track adherence here.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-xs font-semibold">
              <Link href="/budgets">Configure Budgets</Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}