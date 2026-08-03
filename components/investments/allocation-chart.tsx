"use client"

import * as React from "react"
import { PieChart as PieChartIcon } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { InvestmentHolding } from "@/types"
import { calculateAllocationPercentages } from "@/lib/calculations/investments"
import { formatCurrency, cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const ASSET_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  stock: { label: "Stocks", color: "var(--chart-1)" },
  etf: { label: "ETFs", color: "var(--chart-2)" },
  crypto: { label: "Crypto", color: "var(--chart-3)" },
  mutual_fund: { label: "Mutual Funds", color: "var(--chart-4)" },
  bond: { label: "Bonds", color: "var(--chart-5)" },
  commodity: { label: "Commodities", color: "var(--primary)" },
  other: { label: "Other", color: "var(--muted-foreground)" },
}

export function AllocationChart({
  holdings = [],
  currency = "USD",
}: {
  holdings?: InvestmentHolding[]
  currency?: string
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

  const holdingsWithValue = React.useMemo(() => {
    return holdings.map((h) => ({
      ...h,
      currentValue: h.quantity * h.currentPrice,
    }))
  }, [holdings])

  const totalValue = React.useMemo(() => {
    return holdingsWithValue.reduce((sum, h) => sum + Math.max(0, h.currentValue), 0)
  }, [holdingsWithValue])

  const { byAssetType } = React.useMemo(() => {
    return calculateAllocationPercentages(holdingsWithValue)
  }, [holdingsWithValue])

  const entries = React.useMemo(() => {
    return Object.entries(byAssetType || {}).sort((a, b) => (b[1] as number) - (a[1] as number))
  }, [byAssetType])

  const activeData = React.useMemo(() => {
    if (entries.length === 0) return []
    return entries.map(([type, pct]) => {
      const conf = ASSET_TYPE_CONFIG[type] || { label: type.toUpperCase(), color: "var(--primary)" }
      const classValue = holdingsWithValue
        .filter((h) => h.assetType === type)
        .reduce((sum, h) => sum + h.currentValue, 0)

      return {
        category: conf.label,
        type,
        value: classValue,
        percentage: pct,
        color: conf.color,
      }
    })
  }, [entries, holdingsWithValue])

  const chartConfig = React.useMemo(() => {
    return activeData.reduce((acc, item) => {
      acc[item.type] = { label: item.category, color: item.color }
      return acc
    }, {} as ChartConfig)
  }, [activeData])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChartIcon className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asset Class Allocation</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {activeData.length} classes
        </span>
      </div>

      {/* Vertical layout on mobile/mid screens, Side-by-Side on xl screens */}
      <div className="p-3.5 flex-1 flex flex-col xl:flex-row items-center justify-between gap-4 min-h-[160px]">
        {/* Radial Arc Gauge (Centered) */}
        <div className="w-full xl:w-[46%] flex items-center justify-center shrink-0">
          {activeData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="w-full max-w-[300px] sm:max-w-[340px] h-[130px] sm:h-[145px] mx-auto overflow-visible -mt-4"
            >
              <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                <Pie
                  data={activeData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="95%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={85}
                  outerRadius={115}
                  cornerRadius={4}
                  paddingAngle={3}
                  minAngle={10}
                  stroke="var(--card)"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {activeData.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={entry.color}
                      style={{
                        opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.35,
                        transition: "opacity 0.2s ease-in-out",
                        outline: "none",
                      }}
                    />
                  ))}
                </Pie>
                <text x="50%" y="95%" textAnchor="middle" className="pointer-events-none">
                  <tspan
                    x="50%"
                    dy="-8"
                    className="fill-foreground text-base sm:text-lg font-extrabold tabular-nums tracking-tight"
                  >
                    {totalValue > 0 ? formatCurrency(totalValue, currency) : "$0"}
                  </tspan>
                  <tspan
                    x="50%"
                    dy="14"
                    className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider"
                  >
                    Portfolio
                  </tspan>
                </text>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) => {
                        const categoryName = String(name)
                        const color = item.payload?.color || item.color || item.payload?.fill
                        return (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex flex-1 justify-between items-center leading-none gap-2">
                              <span className="text-muted-foreground font-medium">{categoryName}:</span>
                              <span className="font-mono font-bold text-foreground">
                                {formatCurrency(Number(value), currency)}
                              </span>
                            </div>
                          </>
                        )
                      }}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-muted-foreground py-6 text-center">No assets.</div>
          )}
        </div>

        {/* ScrollArea Asset List */}
        {activeData.length > 0 && (
          <div className="w-full xl:w-[54%] border-t xl:border-t-0 xl:border-l border-border/30 pt-3 xl:pt-0 xl:pl-3 flex flex-col justify-center min-w-0 flex-1">
            <ScrollArea className="max-h-[160px] sm:max-h-[180px] w-full pr-1">
              <div className="flex flex-col gap-1.5">
                {activeData.map((entry, index) => (
                  <div
                    key={entry.category}
                    className={cn(
                      "flex items-center justify-between gap-1.5 text-xs px-2 py-1.5 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors cursor-default min-w-0",
                      activeIndex !== undefined && activeIndex !== index ? "opacity-30" : "opacity-100"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="font-bold text-foreground truncate text-[11px]">{entry.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto text-right">
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground tabular-nums">
                        {formatCurrency(entry.value, currency)}
                      </span>
                      <span className="text-[9px] font-extrabold text-muted-foreground/80 bg-muted/40 px-1 py-0.5 rounded-md border border-border/30 tabular-nums">
                        {entry.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
