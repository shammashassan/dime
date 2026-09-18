"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, Label } from "recharts"
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
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

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
      color: item.color || "var(--primary)",
      icon: item.icon || "HelpCircle",
    }))
  }, [data])

  // Calculate total expense
  const totalExpense = React.useMemo(() => {
    return normalizedData.reduce((sum, item) => sum + item.value, 0)
  }, [normalizedData])

  // Filter zero-values and sort descending
  const sortedData = React.useMemo(() => {
    return [...normalizedData]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [normalizedData])

  // Dataset: Top 5 categories + aggregated Others slice
  const activeData = React.useMemo(() => {
    if (sortedData.length === 0) return []

    const total = totalExpense

    let items = sortedData
    if (sortedData.length > 5) {
      const top5 = sortedData.slice(0, 5)
      const othersVal = sortedData.slice(5).reduce((sum, d) => sum + d.value, 0)
      items = [
        ...top5,
        {
          category: "Others",
          value: othersVal,
          color: "var(--muted-foreground)",
          icon: "HelpCircle",
        },
      ]
    }

    return items.map((item) => {
      const pct = total > 0 ? (item.value / total) * 100 : 0
      return {
        category: item.category,
        value: item.value,
        rawValue: Math.round(item.value * 100),
        percentage: pct,
        color: item.color,
      }
    })
  }, [sortedData, totalExpense])

  const chartConfig = React.useMemo(() => {
    return activeData.reduce((acc, item) => {
      acc[item.category] = { label: item.category, color: item.color }
      return acc
    }, {} as ChartConfig)
  }, [activeData])

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            category breakdown
          </span>
          <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
            This month
          </span>
        </div>
        <Link
          href="/reports"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0 whitespace-nowrap ml-auto"
        >
          <span>View report</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* Main Center Donut - Vertically centered with ample headroom to prevent top clipping */}
      <div className="px-3 pt-2 pb-1 flex-1 flex flex-col items-center justify-center min-h-[140px]">
        {activeData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="w-full max-w-[260px] h-[155px] mx-auto overflow-visible"
          >
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={activeData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                cornerRadius={4}
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
                            className="fill-foreground text-base sm:text-lg font-black tabular-nums tracking-tight"
                          >
                            {formatCurrency(totalExpense * 100, currency)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 14}
                            className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider"
                          >
                            Total Spent
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
                              {formatCurrency(rawVal, currency)}
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
          <div className="flex items-center justify-center h-[140px] text-muted-foreground text-xs">
            No expenses recorded this month.
          </div>
        )}
      </div>

      {/* shadcn ScrollArea for Legend Row - Identical to Financial Health Card with bidirectional hover highlighting */}
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
                  {entry.percentage < 1 && entry.percentage > 0 ? "<1%" : `${Math.round(entry.percentage)}%`}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}
