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

export const description = "Wallet balance trend over time"

const chartConfig = {
  financial: {
    label: "Financial Data",
  },
  sales: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface WalletDetailChartProps {
  initialData: { date: string; balance: number }[]
  currency: string
}

function formatMonthDay(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function WalletDetailChart({ initialData = [], currency }: WalletDetailChartProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState(() => isMobile ? "7d" : "90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Map initialData { date, balance } to match dashboard-chart's { date, sales } schema
  const chartData = React.useMemo(() => {
    return initialData.map(item => ({
      date: item.date,
      sales: item.balance,
    }))
  }, [initialData])

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (chartData.length === 0) return []

    let limit = 30
    if (timeRange === "90d") {
      limit = 90
    } else if (timeRange === "30d") {
      limit = 30
    } else if (timeRange === "7d") {
      limit = 7
    }

    return chartData.slice(-limit)
  }, [chartData, timeRange])

  // Calculate Y-axis domain to prevent visual clipping
  const yAxisDomain = React.useMemo(() => {
    if (filteredData.length === 0) return [0, 100]

    const balances = filteredData.map(d => d.sales || 0)
    const minVal = Math.min(...balances)
    const maxVal = Math.max(...balances)

    const start = minVal < 0 ? Math.floor(minVal * 1.1) : 0
    const end = Math.ceil(maxVal * 1.1)

    return [start, end]
  }, [filteredData])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Balance History</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Daily balance trend over time
          </span>
          <span className="@[540px]/card:hidden">Balance trend</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => {
              if (val) setTimeRange(val)
            }}
            spacing={0}
            variant="outline"
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
              aria-label="Select a time range"
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
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
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
                tickFormatter={(value) => formatMonthDay(value)}
              />
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : filteredData.length - 1}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatMonthDay(value)}
                    formatter={(value) => (
                      <div className="flex flex-1 justify-between items-center gap-6 leading-none">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatCurrency(Number(value) * 100, currency)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="sales"
                type="monotone"
                fill="url(#fillSales)"
                stroke="var(--color-sales)"
                isAnimationActive={true}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No history data available for this wallet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
