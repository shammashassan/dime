"use client"

import * as React from "react"
import Link from "next/link"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Target } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"

export interface CapitalAllocationItem {
  name: string
  type: "goal" | "debt"
  amount: number
  color: string
}

export interface CapitalAllocationData {
  items: CapitalAllocationItem[]
  totalGoals: number
  totalDebt: number
  totalAllocated: number
}

export interface CapitalAllocationChartProps {
  data: CapitalAllocationData
  currency?: string
  className?: string
}

const chartConfig = {
  amount: {
    label: "Allocated",
    color: "var(--chart-1)",
  },
  goal: {
    label: "Goal Contribution",
    color: "var(--chart-1)",
  },
  debt: {
    label: "Debt Payoff",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function CapitalAllocationChart({
  data,
  currency = "USD",
  className,
}: CapitalAllocationChartProps) {
  const hasData = data.items.length > 0

  return (
    <Card
      className={cn(
        "@container/card bento-tile flex h-full flex-col justify-between border-border/50 p-5 shadow-xs",
        className
      )}
    >
      {/* Micro-header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            capital allocation
          </span>
          {data.items.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
              {data.items.length}
            </span>
          )}
        </div>
        {hasData && (
          <span className="text-[11px] font-mono font-medium text-foreground shrink-0">
            {formatCurrency(data.totalAllocated * 100, currency)}
          </span>
        )}
      </div>

      {/* Chart Body */}
      <div className="flex-1 min-w-0 pt-1">
        {hasData ? (
          <div className="flex flex-col justify-between h-full gap-2">
            <ScrollArea className="h-36.25 pr-2 w-full">
              <div
                style={{ height: `${Math.max(140, data.items.length * 36)}px` }}
                className="w-full"
              >
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <BarChart
                    accessibilityLayer
                    data={data.items}
                    layout="vertical"
                    margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
                  >
                    <XAxis type="number" dataKey="amount" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      tickMargin={6}
                      axisLine={false}
                      width={90}
                      tickFormatter={(value) => value.slice(0, 13)}
                      className="text-[11px] fill-muted-foreground"
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          formatter={(value, _, item) => {
                            const payload = item.payload as CapitalAllocationItem
                            const isGoal = payload.type === "goal"
                            const typeLabel = isGoal ? "Goal Target" : "Loan Principal"
                            const dotColor = isGoal ? "var(--chart-1)" : "var(--chart-2)"
                            return (
                              <div className="flex flex-1 justify-between items-center leading-none gap-4">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="size-2.5 shrink-0 rounded-xs"
                                    style={{ backgroundColor: dotColor }}
                                  />
                                  <span className="text-muted-foreground font-medium">
                                    {payload.name} ({typeLabel})
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-foreground">
                                  {formatCurrency(Number(value) * 100, currency)}
                                </span>
                              </div>
                            )
                          }}
                        />
                      }
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {data.items.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.type === "goal" ? "var(--chart-1)" : "var(--chart-2)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </ScrollArea>

            {/* Micro legend footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-chart-1 shrink-0" />
                  <span className="text-muted-foreground text-[11px]">Goals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-chart-2 shrink-0" />
                  <span className="text-muted-foreground text-[11px]">Debt Payoff</span>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-muted-foreground">
                  Goals: {formatCurrency(data.totalGoals * 100, currency)}
                </span>
                <span className="text-muted-foreground">
                  Debt: {formatCurrency(data.totalDebt * 100, currency)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
              <Target className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                No goal contributions or debt payoffs recorded
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Allocate your savings toward goals or loan repayments to track capital velocity here.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-xs font-semibold">
                <Link href="/goals">View Goals</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-xs font-semibold">
                <Link href="/loans">View Loans</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
