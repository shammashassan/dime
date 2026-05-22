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
import { formatCurrency } from "@/lib/utils"

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

interface SpendingTrendChartProps {
  initialData?: Array<{ date: string; income: number; expense: number }>
  currency?: string
}

const formatMonthDay = (dateStr: string | Date) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function SpendingTrendChart({ initialData = [], currency = "USD" }: SpendingTrendChartProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState(() => isMobile ? "7d" : "90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Memoize filtered data for performance
  const filteredData = React.useMemo(() => {
    if (initialData.length === 0) return []

    const sortedData = [...initialData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const referenceDate = new Date(sortedData[sortedData.length - 1]?.date || new Date())

    let daysToSubtract = 30
    if (timeRange === "90d") {
      daysToSubtract = 90
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return sortedData.filter(item => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [initialData, timeRange])

  return (
    <Card className="@container/card h-full flex flex-col">
      <CardHeader>
        <CardTitle>Cash Flow Trend</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Income vs Expenses over the chosen timeframe
          </span>
          <span className="@[540px]/card:hidden">Income vs Expenses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            spacing={0}
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select timeframe"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        {filteredData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.1}
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
                    stopOpacity={0.1}
                  />
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
                  return formatMonthDay(value)
                }}
              />

              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : 10}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return formatMonthDay(value)
                    }}
                    indicator="dot"
                    formatter={(value, name, item) => {
                      const isIncome = name === "income" || name === "Income" || item.dataKey === "income"
                      const colorVar = isIncome ? "var(--chart-1)" : "var(--chart-2)"
                      return (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor: colorVar,
                            }}
                          />
                          <div className="flex flex-1 justify-between items-center leading-none">
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
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No transaction trend data available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
