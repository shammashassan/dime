"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, TrendingUp, ArrowLeftRight } from "lucide-react"
import { Cell, Label, Pie, PieChart } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, cn } from "@/lib/utils"

export interface CategoryItem {
  category?: string
  name?: string
  value?: number
  amount?: number
  color?: string
  icon?: string
}

export interface CategoryBreakdownProps {
  data?: CategoryItem[]
  currency?: string
  className?: string
}

export function CategoryBreakdown({
  data = [],
  currency = "USD",
  className,
}: CategoryBreakdownProps) {
  const router = useRouter()

  // Normalize data to support both category/value and name/amount contracts
  const normalizedData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    return data.map((item) => ({
      category: item.category || item.name || "Uncategorized",
      value:
        typeof item.value === "number"
          ? item.value
          : typeof item.amount === "number"
            ? item.amount
            : 0,
      color: item.color || "#94a3b8",
      icon: item.icon || "HelpCircle",
    }))
  }, [data])

  // Calculate total expense to compute percentages
  const totalExpense = React.useMemo(() => {
    return normalizedData.reduce((sum, item) => sum + item.value, 0)
  }, [normalizedData])

  // Filter out zero-values and sort descending by value
  const sortedData = React.useMemo(() => {
    return [...normalizedData]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [normalizedData])

  // Donut chart dataset: Top 5 categories + aggregated Others slice
  const chartData = React.useMemo(() => {
    if (sortedData.length <= 5) {
      return sortedData.map((item) => ({
        category: item.category,
        value: item.value,
        color: item.color,
      }))
    }
    const top5 = sortedData.slice(0, 5).map((item) => ({
      category: item.category,
      value: item.value,
      color: item.color,
    }))
    const othersValue = sortedData.slice(5).reduce((sum, item) => sum + item.value, 0)
    if (othersValue > 0) {
      top5.push({
        category: "Others",
        value: othersValue,
        color: "#94a3b8",
      })
    }
    return top5
  }, [sortedData])

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      value: { label: "Amount" },
    }
    chartData.forEach((item) => {
      cfg[item.category] = {
        label: item.category,
        color: item.color,
      }
    })
    return cfg
  }, [chartData])

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col border-border/50 bg-card shadow-xs",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            category distribution
          </span>
          <CardTitle className="text-base font-bold tracking-tight">Category Breakdown</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Expense distribution for the current month
          </CardDescription>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Menu"
                className="h-8 w-8 rounded-xl border border-border/40"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push("/reports")}
                  className="rounded-lg cursor-pointer"
                >
                  <TrendingUp className="size-4 mr-2 text-muted-foreground" />
                  View Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/transactions")}
                  className="rounded-lg cursor-pointer"
                >
                  <ArrowLeftRight className="size-4 mr-2 text-muted-foreground" />
                  Transactions
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 px-4 pb-4 pt-1 gap-3">
        {sortedData.length === 0 ? (
          <div className="flex justify-center items-center flex-1 py-12 text-muted-foreground text-sm">
            No expenses recorded this month.
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="relative flex items-center justify-center shrink-0">
              <ChartContainer
                config={chartConfig}
                initialDimension={{ width: 180, height: 180 }}
                className="mx-auto aspect-square max-h-[180px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">{String(name)}:</span>
                            <span className="font-mono font-semibold tabular-nums text-foreground">
                              {formatCurrency(Number(value) * 100, currency)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 4}
                                className="fill-foreground font-mono text-sm sm:text-base font-extrabold tracking-tight tabular-nums"
                              >
                                {formatCurrency(totalExpense * 100, currency)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                className="fill-muted-foreground font-mono text-[9px] uppercase tracking-wider"
                              >
                                Total Spent
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Category list */}
            <div className="flex flex-col gap-1 pt-2 border-t border-border/40 flex-1 min-h-0">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  top categories
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  share / amount
                </span>
              </div>
              <ScrollArea className="flex-1 min-h-[110px] max-h-[160px] w-full pr-2">
                <div className="flex flex-col divide-y divide-border/20">
                  {sortedData.map((item) => {
                    const share = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0
                    return (
                      <div
                        key={item.category}
                        className="flex items-center justify-between py-1.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className="size-2 rounded-full shrink-0 ring-1 ring-border/20"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-foreground truncate max-w-[130px]">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {share.toFixed(1)}%
                          </span>
                          <span className="font-mono font-semibold tabular-nums text-foreground">
                            {formatCurrency(item.value * 100, currency)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
