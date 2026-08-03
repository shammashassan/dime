"use client"

import * as React from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Label } from "recharts"
import { formatCurrency, cn } from "@/lib/utils"
import { NetWorthOverviewViewModel, NetWorthBreakdown } from "@/types"
import { PieChart as PieChartIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const ASSET_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  investments: "Investments",
  loans: "Receivables",
  manualAssets: "Other Assets",
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  cash: "var(--chart-1)",
  bank: "var(--chart-2)",
  investments: "var(--chart-3)",
  loans: "var(--chart-4)",
  manualAssets: "var(--chart-5)",
}

export function AssetAllocationCard({
  viewModel,
  breakdowns,
}: {
  viewModel: NetWorthOverviewViewModel
  breakdowns: NetWorthBreakdown["assetsBreakdown"]
}) {
  const { totalAssets, currency } = viewModel
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

  const activeData = React.useMemo(() => {
    const rawItems = [
      { type: "cash", rawValue: breakdowns.cash },
      { type: "bank", rawValue: breakdowns.bank },
      { type: "investments", rawValue: breakdowns.investments },
      { type: "loans", rawValue: breakdowns.loans },
      { type: "manualAssets", rawValue: breakdowns.manualAssets },
    ].filter((item) => item.rawValue > 0)

    const total = rawItems.reduce((sum, item) => sum + item.rawValue, 0)

    return rawItems
      .sort((a, b) => b.rawValue - a.rawValue)
      .map((item) => {
        const val = item.rawValue / 100
        const pct = total > 0 ? (item.rawValue / total) * 100 : 0
        const label = ASSET_TYPE_LABELS[item.type] || item.type
        const color = ASSET_TYPE_COLORS[item.type] || "var(--primary)"

        return {
          category: label,
          type: item.type,
          value: val,
          rawValue: item.rawValue,
          percentage: pct,
          color,
        }
      })
  }, [breakdowns])

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
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asset Allocation</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {activeData.length} categories
        </span>
      </div>

      {/* Main Large Center Donut Pie Chart */}
      <div className="p-3 flex-1 flex flex-col items-center justify-center min-h-[140px]">
        {activeData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="w-full max-w-[210px] h-[165px] mx-auto overflow-visible"
          >
            <PieChart>
              <Pie
                data={activeData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={82}
                cornerRadius={5}
                paddingAngle={3}
                minAngle={12}
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
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none">
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-lg sm:text-xl font-extrabold tabular-nums tracking-tight">
                            {formatCurrency(totalAssets / 100, currency)}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-[9px] font-bold uppercase tracking-wider">
                            Total Assets
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => {
                      const categoryName = String(name)
                      const color = item.payload?.color || item.color || item.payload?.fill
                      const rawVal = item.payload?.rawValue ?? (Number(value) * 100)
                      return (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex flex-1 justify-between items-center leading-none gap-2">
                            <span className="text-muted-foreground font-medium">{categoryName}:</span>
                            <span className="font-mono font-bold text-foreground">
                              {formatCurrency(rawVal / 100, currency)}
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
          <div className="text-xs text-muted-foreground py-6 text-center">No assets to allocate.</div>
        )}
      </div>

      {/* shadcn ScrollArea for Legend Row */}
      {activeData.length > 0 && (
        <ScrollArea className="max-h-[56px] w-full border-t border-border/30 bg-muted/5 px-3 py-2">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {activeData.map((entry, index) => (
              <div
                key={entry.category}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-opacity cursor-default",
                  activeIndex !== undefined && activeIndex !== index ? "opacity-30" : "opacity-100"
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-bold text-foreground">{entry.category}</span>
                <span className="text-[10px] font-extrabold text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded-full border border-border/30">
                  {entry.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}