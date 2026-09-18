"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemFooter,
} from "@/components/ui/item"
import { ArrowUpRight, ArrowDownRight, Minus, Scale } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import type { PeriodReviewMetrics } from "@/types"

interface ReviewPeriodComparisonProps {
  current: PeriodReviewMetrics
  previous: PeriodReviewMetrics | null
  currentLabel: string
  previousLabel: string
  currency: string
  className?: string
}

export function ReviewPeriodComparison({
  current,
  previous,
  currentLabel,
  previousLabel,
  currency,
  className,
}: ReviewPeriodComparisonProps) {
  const computeDeltaPct = (curr: number, prev: number) => {
    if (prev === 0) return curr === 0 ? 0 : 100
    return Math.round(((curr - prev) / prev) * 100)
  }

  const rows = React.useMemo(() => {
    if (!previous) return []

    const incomeDeltaPct = computeDeltaPct(current.totalIncomeCents, previous.totalIncomeCents)
    const expenseDeltaPct = computeDeltaPct(current.totalExpenseCents, previous.totalExpenseCents)
    const savingsRateDeltaPp = current.savingsRatePercentage - previous.savingsRatePercentage
    const netWorthDeltaPct = computeDeltaPct(
      Math.abs(current.netWorthDeltaCents),
      Math.abs(previous.netWorthDeltaCents)
    )

    return [
      {
        label: "Total Income",
        currentValue: formatCurrency(current.totalIncomeCents, currency),
        previousValue: formatCurrency(previous.totalIncomeCents, currency),
        deltaPct: incomeDeltaPct,
        isPositiveGood: true,
      },
      {
        label: "Total Expenses",
        currentValue: formatCurrency(current.totalExpenseCents, currency),
        previousValue: formatCurrency(previous.totalExpenseCents, currency),
        deltaPct: expenseDeltaPct,
        isPositiveGood: false,
      },
      {
        label: "Savings Rate",
        currentValue: `${current.savingsRatePercentage}%`,
        previousValue: `${previous.savingsRatePercentage}%`,
        deltaPct: savingsRateDeltaPp,
        isPp: true,
        isPositiveGood: true,
      },
      {
        label: "Net Worth Delta",
        currentValue: `${current.netWorthDeltaCents >= 0 ? "+" : ""}${formatCurrency(current.netWorthDeltaCents, currency)}`,
        previousValue: `${previous.netWorthDeltaCents >= 0 ? "+" : ""}${formatCurrency(previous.netWorthDeltaCents, currency)}`,
        deltaPct: netWorthDeltaPct,
        isPositiveGood: true,
      },
    ]
  }, [current, previous, currency])

  const comparisonSubtitle = React.useMemo(() => {
    const cleanPrev = previousLabel
      .replace(/Prior Quarter/i, "Prior Qtr")
      .replace(/Previous Quarter/i, "Prior Qtr")
      .replace(/Prior Year/i, "Prior Yr")
      .replace(/Previous Year/i, "Prior Yr")
    const shortCurr = currentLabel.replace(/\s*20\d\d/, "")
    return `${shortCurr || currentLabel} vs ${cleanPrev}`
  }, [currentLabel, previousLabel])

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-tight">
          period comparison
        </span>
        <span className="text-[11px] font-mono text-muted-foreground shrink-0 text-right">
          {comparisonSubtitle}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col min-h-0">
        {!previous ? (
          <div className="flex flex-col items-center justify-center min-h-54 text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <Scale className="size-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">No baseline activity</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              No previous period records found to benchmark against {previousLabel}.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 w-full min-w-0 [&>div>div]:block!">
            <ItemGroup className="gap-2 pr-3 w-full min-w-0">
              {rows.map((row) => {
                const isZero = row.deltaPct === 0
                const isFavorable = row.isPositiveGood ? row.deltaPct > 0 : row.deltaPct < 0

                return (
                  <Item
                    key={row.label}
                    variant="outline"
                    size="xs"
                    className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 w-full min-w-0 overflow-hidden cursor-default"
                  >
                    <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate min-w-0 flex-1">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isZero ? (
                          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                            <Minus className="size-3" /> 0%
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5",
                              isFavorable
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            )}
                          >
                            {row.deltaPct > 0 ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <ArrowDownRight className="size-3" />
                            )}
                            {Math.abs(row.deltaPct)}
                            {row.isPp ? " pp" : "%"}
                          </span>
                        )}
                      </div>
                    </ItemHeader>
                    <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {row.currentValue}
                      </span>
                      <span className="tabular-nums font-mono text-muted-foreground/70 text-[10px]">
                        Prior: {row.previousValue}
                      </span>
                    </ItemFooter>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        )}
      </div>
    </Card>
  )
}
