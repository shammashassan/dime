"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card } from "@/components/ui/card"
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
  income: { label: "Income", color: "var(--chart-1)" },
  expense: { label: "Expense", color: "var(--chart-2)" },
} satisfies ChartConfig

export interface SpendingTrendChartProps {
  initialData?: Array<{ date: string; income: number; expense: number }>
  currency?: string
  className?: string
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
        "@container/card bento-tile flex h-full flex-col justify-between border-border/50 p-5 shadow-xs",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/30">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            cash flow trajectory
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Cash Flow Trend
            </h3>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Historical trajectory of income and expenses
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
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
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        {filteredData.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-47.5 w-full">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(String(value)).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                    formatter={(value, name, item) => {
                      const label = chartConfig[name as keyof typeof chartConfig]?.label || String(name)
                      const indicatorColor = item.color || `var(--color-${name})`
                      return (
                        <div className="flex flex-1 justify-between items-center leading-none gap-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-xs"
                              style={{ backgroundColor: indicatorColor }}
                            />
                            <span className="text-muted-foreground font-medium">
                              {label}
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
              <Area
                dataKey="expense"
                type="monotone"
                fill="url(#fillExpense)"
                stroke="var(--color-expense)"
              />
              <Area
                dataKey="income"
                type="monotone"
                fill="url(#fillIncome)"
                stroke="var(--color-income)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-47.5 text-muted-foreground text-sm">
            No transaction trend data available.
          </div>
        )}
      </div>
    </Card>
  )
}
