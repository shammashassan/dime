"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { formatCurrency, cn } from "@/lib/utils"

const chartConfig = {
  financial: {
    label: "Financial Data",
  },
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Expense",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export interface SpendingTrendChartProps {
  initialData?: Array<{ date: string; income: number; expense: number }>
  currency?: string
  className?: string
}

const formatMonthDay = (dateStr: string | Date) => {
  // If it's a plain date string like "2026-07-05", parse it in UTC to prevent
  // the browser from shifting it to the previous day for positive-offset timezones.
  if (typeof dateStr === "string" && dateStr.length === 10) {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  }
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function SpendingTrendChart({
  initialData = [],
  currency = "USD",
  className,
}: SpendingTrendChartProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [prevIsMobile, setPrevIsMobile] = React.useState(isMobile)

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)
    if (isMobile) {
      setTimeRange("30d")
    }
  }

  // Memoize filtered data for performance
  const filteredData = React.useMemo(() => {
    if (initialData.length === 0) return []

    const sortedData = [...initialData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const referenceDate = new Date(sortedData[sortedData.length - 1]?.date || new Date())

    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "60d") {
      daysToSubtract = 60
    } else if (timeRange === "90d") {
      daysToSubtract = 90
    }

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return sortedData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [initialData, timeRange])

  return (
    <Card
      className={cn(
        "@container/card bento-tile flex h-full flex-col border-border/50 bg-card shadow-xs",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            cash flow trend
          </span>
          <CardTitle className="text-base font-bold tracking-tight">Cash Flow Trend</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            <span className="hidden @[540px]/card:block">
              Income vs Expenses over the chosen timeframe
            </span>
            <span className="@[540px]/card:hidden">Income vs Expenses</span>
          </CardDescription>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            spacing={0}
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">30D</ToggleGroupItem>
            <ToggleGroupItem value="60d">60D</ToggleGroupItem>
            <ToggleGroupItem value="90d">90D</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select timeframe"
            >
              <SelectValue placeholder="Last 90 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="60d" className="rounded-lg">
                Last 60 days
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 90 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 min-w-0">
        {filteredData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-expense)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-expense)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  return formatMonthDay(value)
                }}
              />

              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }}
                defaultIndex={isMobile ? -1 : 10}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return formatMonthDay(String(value))
                    }}
                    indicator="dot"
                    formatter={(value, name, item) => {
                      const isIncome =
                        name === "income" || name === "Income" || item.dataKey === "income"
                      const colorVar = isIncome ? "var(--chart-1)" : "var(--chart-2)"
                      return (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{
                              backgroundColor: colorVar,
                            }}
                          />
                          <div className="flex flex-1 justify-between items-center gap-4 leading-none">
                            <span className="text-muted-foreground capitalize">
                              {name}
                            </span>
                            <span className="font-mono font-medium text-foreground tabular-nums">
                              {formatCurrency(Number(value) * 100, currency)}
                            </span>
                          </div>
                        </>
                      )
                    }}
                  />
                }
              />
              <Area
                dataKey="expense"
                type="monotone"
                fill="url(#fillExpense)"
                stroke="var(--color-expense)"
                strokeWidth={2}
                isAnimationActive={true}
              />
              <Area
                dataKey="income"
                type="monotone"
                fill="url(#fillIncome)"
                stroke="var(--color-income)"
                strokeWidth={2}
                isAnimationActive={true}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-62.5 text-muted-foreground text-sm">
            No transaction trend data available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
