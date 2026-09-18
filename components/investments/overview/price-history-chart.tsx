"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { LineChart, TrendingUp, TrendingDown } from "lucide-react"
import type { PriceHistoryPoint, InvestmentTransaction, InvestmentHolding } from "@/types"

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[]
  symbol: string
  currency?: string
  transactions?: InvestmentTransaction[]
  holding?: InvestmentHolding
}

const chartConfig = {
  price: {
    label: "Market Price",
    color: "var(--chart-1)",
  },
  value: {
    label: "Holding Value",
    color: "var(--chart-2)",
  },
  gain: {
    label: "Unrealized P&L",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

type MetricMode = "price" | "value" | "gain"

export function PriceHistoryChart({
  data = [],
  symbol,
  currency = "USD",
  transactions = [],
  holding,
}: PriceHistoryChartProps) {
  const [metricMode, setMetricMode] = React.useState<MetricMode>("price")

  // Current stats derived from holding
  const currentQuantity = holding?.quantity ?? 0
  const currentPrice = holding?.currentPrice ?? (data.length > 0 ? data[data.length - 1].price : 0)
  const totalCostBasis = holding?.totalCostBasis ?? (currentQuantity * (holding?.averageCostBasis ?? 0))
  const totalValue = currentQuantity * currentPrice
  const unrealizedGain = totalValue - totalCostBasis
  const returnPercentage = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0
  const isPositiveReturn = unrealizedGain >= 0

  // Build a continuous, multi-point time-series dataset with interpolation
  const trajectoryData = React.useMemo(() => {
    const today = new Date()
    today.setUTCHours(23, 59, 59, 999)

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const sortedSnapshots = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Identify start date: earliest transaction date or price snapshot, with a 30-day baseline
    let earliestDate = today
    if (sortedTx.length > 0) {
      const firstTxDate = new Date(sortedTx[0].date)
      if (firstTxDate < earliestDate) earliestDate = firstTxDate
    }
    if (sortedSnapshots.length > 0) {
      const firstSnapDate = new Date(sortedSnapshots[0].date)
      if (firstSnapDate < earliestDate) earliestDate = firstSnapDate
    }

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Always ensure at least a 30-day span for visual elegance
    const timelineStart = earliestDate < thirtyDaysAgo ? earliestDate : thirtyDaysAgo
    timelineStart.setUTCHours(0, 0, 0, 0)

    // Build timeline of price checkpoints for smooth interpolation
    const priceCheckpoints: Array<{ time: number; price: number }> = []

    if (sortedTx.length > 0 && sortedTx[0].price > 0) {
      priceCheckpoints.push({
        time: timelineStart.getTime(),
        price: sortedTx[0].price,
      })
    }

    sortedTx.forEach((tx) => {
      if (tx.price > 0) {
        priceCheckpoints.push({
          time: new Date(tx.date).getTime(),
          price: tx.price,
        })
      }
    })

    sortedSnapshots.forEach((p) => {
      priceCheckpoints.push({
        time: new Date(p.date).getTime(),
        price: p.price,
      })
    })

    priceCheckpoints.push({
      time: today.getTime(),
      price: currentPrice,
    })

    // Sort checkpoints
    priceCheckpoints.sort((a, b) => a.time - b.time)

    // Helper: interpolate price at any date
    const getPriceAtDate = (d: Date): number => {
      const t = d.getTime()
      if (priceCheckpoints.length === 0) return currentPrice
      if (t <= priceCheckpoints[0].time) return priceCheckpoints[0].price
      if (t >= priceCheckpoints[priceCheckpoints.length - 1].time) return currentPrice

      // Find surrounding checkpoints
      let prev = priceCheckpoints[0]
      let next = priceCheckpoints[priceCheckpoints.length - 1]

      for (let i = 0; i < priceCheckpoints.length - 1; i++) {
        if (priceCheckpoints[i].time <= t && priceCheckpoints[i + 1].time >= t) {
          prev = priceCheckpoints[i]
          next = priceCheckpoints[i + 1]
          break
        }
      }

      if (prev.time === next.time) return prev.price
      const progress = (t - prev.time) / (next.time - prev.time)
      return Math.round(prev.price + progress * (next.price - prev.price))
    }

    // Helper: calculate holding quantity and cost basis up to date d
    const getHoldingStateAtDate = (d: Date) => {
      let qty = 0
      let cost = 0

      for (const tx of sortedTx) {
        const txDate = new Date(tx.date)
        if (txDate <= d) {
          if (tx.type === "buy" || tx.type === "reinvested_dividend") {
            qty += tx.quantity
            cost += tx.quantity * tx.price + (tx.fees || 0)
          } else if (tx.type === "sell") {
            const avg = qty > 0 ? cost / qty : 0
            qty = Math.max(0, qty - tx.quantity)
            cost = qty * avg
          }
        }
      }

      // If holding has quantity but no transactions recorded, fallback to holding props
      if (qty === 0 && currentQuantity > 0 && d >= timelineStart) {
        qty = currentQuantity
        cost = totalCostBasis
      }

      return { qty, cost }
    }

    // Step calculation: generate 24 to 32 evenly distributed time slices
    const totalDays = Math.max(1, Math.ceil((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)))
    const stepDays = Math.max(1, Math.round(totalDays / 28))

    const pointsMap = new Map<string, { date: string; price: number; value: number; gain: number }>()

    // 1. Add regular intervals
    const current = new Date(timelineStart)
    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0]
      const price = getPriceAtDate(current)
      const { qty, cost } = getHoldingStateAtDate(current)
      const value = Math.round(qty * price)
      const gain = value - cost

      pointsMap.set(dateStr, {
        date: dateStr,
        price,
        value: Math.max(0, value),
        gain,
      })

      current.setDate(current.getDate() + stepDays)
    }

    // 2. Add exact transaction dates
    sortedTx.forEach((tx) => {
      const d = new Date(tx.date)
      const dateStr = d.toISOString().split("T")[0]
      const price = tx.price > 0 ? tx.price : getPriceAtDate(d)
      const { qty, cost } = getHoldingStateAtDate(d)
      const value = Math.round(qty * price)
      const gain = value - cost

      pointsMap.set(dateStr, {
        date: dateStr,
        price,
        value: Math.max(0, value),
        gain,
      })
    })

    // 3. Add explicit price snapshot dates
    sortedSnapshots.forEach((p) => {
      const d = new Date(p.date)
      const dateStr = p.date.slice(0, 10)
      const price = p.price
      const { qty, cost } = getHoldingStateAtDate(d)
      const value = Math.round(qty * price)
      const gain = value - cost

      pointsMap.set(dateStr, {
        date: dateStr,
        price,
        value: Math.max(0, value),
        gain,
      })
    })

    // 4. Always ensure today's terminal state is exact
    const todayStr = today.toISOString().split("T")[0]
    pointsMap.set(todayStr, {
      date: todayStr,
      price: currentPrice,
      value: Math.max(0, totalValue),
      gain: unrealizedGain,
    })

    // Return sorted array
    return Array.from(pointsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [transactions, data, currentPrice, currentQuantity, totalCostBasis, totalValue, unrealizedGain])

  // Range highlights (min and max price)
  const priceRange = React.useMemo(() => {
    if (trajectoryData.length === 0) return { min: currentPrice, max: currentPrice, deltaPct: 0 }
    const prices = trajectoryData.map((d) => d.price).filter((p) => p > 0)
    const min = prices.length > 0 ? Math.min(...prices) : currentPrice
    const max = prices.length > 0 ? Math.max(...prices) : currentPrice

    const firstPrice = trajectoryData[0].price
    const deltaPct = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0

    return { min, max, deltaPct }
  }, [trajectoryData, currentPrice])

  const isPricePositive = priceRange.deltaPct >= 0

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden flex flex-col bg-card shrink-0">
      {/* Header with Mode Toggle */}
      <div className="px-4 py-3 border-b border-border/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChart className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {symbol} Performance Trajectory
          </span>
        </div>

        {/* Mode switcher capsule pill */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/30">
          <button
            type="button"
            onClick={() => setMetricMode("price")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
              metricMode === "price"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Market Price
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("value")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
              metricMode === "value"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Holding Value
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("gain")}
            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
              metricMode === "gain"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unrealized P&L
          </button>
        </div>
      </div>

      {/* Body: Stat Highlights + Area Chart */}
      <div className="p-3.5 flex flex-col justify-between gap-2">
        {/* Dynamic Metric Highlights */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
              {metricMode === "price"
                ? "Current Market Price"
                : metricMode === "value"
                ? "Total Position Value"
                : "Total Unrealized Gain / Loss"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-black tracking-tight tabular-nums text-foreground leading-tight">
                {metricMode === "price"
                  ? formatCurrency(currentPrice, currency)
                  : metricMode === "value"
                  ? formatCurrency(totalValue, currency)
                  : `${isPositiveReturn ? "+" : ""}${formatCurrency(unrealizedGain, currency)}`}
              </span>

              {/* Dynamic Delta Pill */}
              {metricMode === "price" && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${
                    isPricePositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isPricePositive ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                  {isPricePositive ? "+" : ""}
                  {priceRange.deltaPct.toFixed(2)}%
                </span>
              )}

              {(metricMode === "value" || metricMode === "gain") && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${
                    isPositiveReturn
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isPositiveReturn ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                  {isPositiveReturn ? "+" : ""}
                  {returnPercentage.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* Secondary stats strip */}
          <div className="flex items-center gap-3">
            {metricMode === "price" ? (
              <>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                    Avg Cost Basis
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                    {formatCurrency(holding?.averageCostBasis ?? 0, currency)}
                  </span>
                </div>
                <div className="text-right border-l border-border/30 pl-3">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                    Trajectory Range
                  </span>
                  <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums">
                    {formatCurrency(priceRange.min, currency)} – {formatCurrency(priceRange.max, currency)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                    Total Cost Basis
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                    {formatCurrency(totalCostBasis, currency)}
                  </span>
                </div>
                <div className="text-right border-l border-border/30 pl-3">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                    Units Held
                  </span>
                  <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums">
                    {currentQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Clean Official AreaChart with h-35 matching InvestmentPerformanceCard */}
        <div className="min-h-35 flex items-center justify-center pt-1">
          {trajectoryData.length > 0 ? (
            <ChartContainer config={chartConfig} className="aspect-auto h-35 w-full">
              <AreaChart
                data={trajectoryData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fill_price" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fill_value" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fill_gain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-gain)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-gain)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis hide domain={["auto", "auto"]} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={10}
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
                    />
                  }
                />
                <Area
                  dataKey={metricMode}
                  type="monotone"
                  fill={`url(#fill_${metricMode})`}
                  stroke={`var(--color-${metricMode})`}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-6">
              No historical price or transaction data recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
