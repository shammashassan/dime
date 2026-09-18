"use client"

import * as React from "react"
import { PieChart as PieChartIcon, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemFooter,
} from "@/components/ui/item"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"
import type { MonthlyReviewCategorySpend, PeriodReviewCategorySpend } from "@/types"

export type ReviewCategoryItem = MonthlyReviewCategorySpend | PeriodReviewCategorySpend | {
  categoryId: string
  name?: string
  categoryName?: string
  icon?: string
  color?: string
  categoryColor?: string
  amountCents: number
  percentage?: number
  percentageOfTotal?: number
  previousMonthAmountCents?: number
  previousPeriodAmountCents?: number
  deltaPercentage?: number
}

export interface ReviewSpendingBreakdownProps {
  categories: ReviewCategoryItem[]
  currency: string
  totalExpenseCents: number
  className?: string
}

const DEFAULT_PALETTE = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f97316", // Orange
  "#14b8a6", // Teal
]

export function ReviewSpendingBreakdown({
  categories = [],
  currency,
  totalExpenseCents,
  className,
}: ReviewSpendingBreakdownProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

  const activeData = React.useMemo(() => {
    return categories.map((rawCat, idx) => {
      const cat = rawCat as any
      const name = cat.name || cat.categoryName || "Uncategorized"
      const color = cat.color || cat.categoryColor || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]
      const pct =
        cat.percentage ??
        cat.percentageOfTotal ??
        (totalExpenseCents > 0 ? Math.round((cat.amountCents / totalExpenseCents) * 100) : 0)
      const prev = cat.previousMonthAmountCents ?? cat.previousPeriodAmountCents ?? 0
      const delta = cat.deltaPercentage ?? 0

      return {
        categoryId: String(cat.categoryId || `cat-${idx}`),
        name,
        color,
        amountCents: cat.amountCents,
        percentage: pct,
        hasPrev: prev > 0,
        deltaPercentage: delta,
      }
    })
  }, [categories, totalExpenseCents])

  const chartConfig = React.useMemo(() => {
    return activeData.reduce((acc, item) => {
      acc[item.categoryId] = { label: item.name, color: item.color }
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
      {/* Micro-label header matching dashboard bento cards */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-tight">
            category{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              breakdown
              {categories.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
                  {categories.length}
                </span>
              )}
            </span>
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0 text-right">
          {formatCurrency(totalExpenseCents, currency)}
        </span>
      </div>

      <div className="p-4 flex-1">
        {activeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[216px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <PieChartIcon className="size-5" />
            </div>
            <p className="font-semibold text-foreground text-xs">No Categorized Expenses</p>
            <p className="text-[11px] max-w-[200px] leading-normal text-muted-foreground">
              Zero expense transactions were categorized during this review period.
            </p>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 h-full min-h-[216px]">
            {/* Radial Arc Gauge (Centered on Top for < xl, Left for >= xl) */}
            <div className="w-full xl:w-[44%] flex items-center justify-center shrink-0">
              <ChartContainer
                config={chartConfig}
                className="w-full max-w-[280px] h-[130px] sm:h-[140px] mx-auto overflow-visible"
              >
                <PieChart margin={{ top: 0, bottom: 0, left: 8, right: 8 }}>
                  <Pie
                    data={activeData}
                    dataKey="amountCents"
                    nameKey="name"
                    cx="50%"
                    cy="95%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={68}
                    outerRadius={94}
                    cornerRadius={4}
                    paddingAngle={2}
                    minAngle={6}
                    stroke="var(--card)"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    {activeData.map((entry, index) => (
                      <Cell
                        key={entry.categoryId}
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
                      className="fill-foreground text-sm sm:text-base font-extrabold tabular-nums tracking-tight font-mono"
                    >
                      {totalExpenseCents > 0 ? formatCurrency(totalExpenseCents, currency) : "$0"}
                    </tspan>
                    <tspan
                      x="50%"
                      dy="14"
                      className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider font-mono"
                    >
                      Total Expenses
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
                                className="size-2.5 shrink-0 rounded-[2px]"
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
            </div>

            {/* Category List with ScrollArea below on < xl, right on >= xl */}
            <div className="w-full xl:w-[56%] border-t xl:border-t-0 xl:border-l border-border/30 pt-3 xl:pt-0 xl:pl-4 flex flex-col justify-center min-w-0 flex-1">
              <ScrollArea className="h-36 sm:h-40 xl:h-[216px] w-full pr-1 [&>div>div]:!block">
                <ItemGroup className="gap-1.5 w-full min-w-0">
                  {activeData.map((entry, index) => {
                    const isSelected = activeIndex === index
                    const isDimmed = activeIndex !== undefined && !isSelected

                    return (
                      <Item
                        key={entry.categoryId}
                        variant="outline"
                        size="xs"
                        className={cn(
                          "flex-col items-stretch p-2 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-all gap-1 cursor-default group w-full min-w-0 overflow-hidden",
                          isDimmed ? "opacity-35" : "opacity-100",
                          isSelected && "border-border/60 bg-muted/40 shadow-xs"
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(undefined)}
                      >
                        <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-semibold text-foreground truncate min-w-0">
                              {entry.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-muted-foreground/80 bg-muted/40 px-1 py-0.2 rounded border border-border/30 tabular-nums shrink-0">
                              {entry.percentage}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {entry.hasPrev && entry.deltaPercentage !== 0 && (
                              <span
                                className={cn(
                                  "inline-flex items-center text-[9px] font-mono font-semibold",
                                  entry.deltaPercentage > 0 ? "text-rose-500" : "text-emerald-500"
                                )}
                              >
                                {entry.deltaPercentage > 0 ? (
                                  <ArrowUpRight className="size-2.5 mr-0.5" />
                                ) : (
                                  <ArrowDownRight className="size-2.5 mr-0.5" />
                                )}
                                {entry.deltaPercentage > 0 ? "+" : ""}
                                {entry.deltaPercentage}%
                              </span>
                            )}
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {formatCurrency(entry.amountCents, currency)}
                            </span>
                          </div>
                        </ItemHeader>

                        <ItemFooter className="mt-0.5 w-full min-w-0">
                          <Progress
                            value={entry.percentage}
                            className="h-1 w-full bg-muted/60"
                            style={
                              {
                                "--progress-background": entry.color,
                              } as React.CSSProperties
                            }
                          />
                        </ItemFooter>
                      </Item>
                    )
                  })}
                </ItemGroup>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
