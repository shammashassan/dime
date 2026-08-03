"use client"

import * as React from "react"
import { InvestmentHolding } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import Link from "next/link"
import { Trophy, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Sparkles, Award } from "lucide-react"

export function TopPerformersCard({
  holdings,
  currency,
}: {
  holdings: InvestmentHolding[]
  currency: string
}) {
  const activeHoldings = React.useMemo(() => {
    return holdings.filter((h) => h.status === "active")
  }, [holdings])

  const holdingsWithGain = React.useMemo(() => {
    return activeHoldings.map((h) => {
      const currentValue = h.quantity * h.currentPrice
      const gain = currentValue - h.totalCostBasis
      const returnPct = h.totalCostBasis > 0 ? (gain / h.totalCostBasis) * 100 : 0
      return {
        ...h,
        currentValue,
        gain,
        returnPct,
      }
    })
  }, [activeHoldings])

  const sortedHoldings = React.useMemo(() => {
    return [...holdingsWithGain].sort((a, b) => b.returnPct - a.returnPct)
  }, [holdingsWithGain])

  const topGainer = sortedHoldings[0] || null
  const secondHolding = sortedHoldings[1] || null

  const profitableCount = holdingsWithGain.filter((h) => h.gain >= 0).length
  const winRate = activeHoldings.length > 0 ? (profitableCount / activeHoldings.length) * 100 : 0

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-3.5 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Performers</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {activeHoldings.length} {activeHoldings.length === 1 ? "position" : "positions"}
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        {activeHoldings.length > 0 ? (
          <>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {/* Top #1 Position Card */}
              {topGainer && (
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={`/investments/${topGainer.walletId}/${topGainer.symbol}`}
                      className="group block p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] flex items-center justify-center shrink-0 uppercase">
                            <Award className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors uppercase block leading-tight truncate">
                              {topGainer.symbol}
                            </span>
                            <span className="text-[10px] text-muted-foreground block leading-tight truncate">
                              {topGainer.name}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                          topGainer.returnPct >= 0
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}>
                          {topGainer.returnPct >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {topGainer.returnPct >= 0 ? "+" : ""}{topGainer.returnPct.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-500/15">
                        <span className="text-muted-foreground font-medium">Unrealized Gain</span>
                        <span className={cn("font-mono font-extrabold tabular-nums", topGainer.gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {topGainer.gain >= 0 ? "+" : ""}{formatCurrency(topGainer.gain, currency)}
                        </span>
                      </div>
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-60 text-xs rounded-xl border border-border/40 shadow-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="size-4 text-amber-500" />
                      <p className="font-bold text-xs">Highest Performing Holding</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-bold text-foreground">{topGainer.name} ({topGainer.symbol})</span> is your top position with <span className="font-bold text-emerald-600">+{topGainer.returnPct.toFixed(2)}%</span> return ({formatCurrency(topGainer.gain, currency)}).
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}

              {/* Top #2 Position Card */}
              {secondHolding && (
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={`/investments/${secondHolding.walletId}/${secondHolding.symbol}`}
                      className={cn(
                        "group block p-3 rounded-xl border transition-all cursor-pointer",
                        secondHolding.returnPct < 0
                          ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                          : "border-border/40 bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "size-7 rounded-lg font-extrabold text-[10px] flex items-center justify-center shrink-0 uppercase",
                            secondHolding.returnPct < 0
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          )}>
                            {secondHolding.returnPct < 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors uppercase block leading-tight truncate">
                              {secondHolding.symbol}
                            </span>
                            <span className="text-[10px] text-muted-foreground block leading-tight truncate">
                              {secondHolding.name}
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border",
                          secondHolding.returnPct < 0
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25"
                        )}>
                          {secondHolding.returnPct >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {secondHolding.returnPct >= 0 ? "+" : ""}{secondHolding.returnPct.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30">
                        <span className="text-muted-foreground font-medium">
                          {secondHolding.returnPct >= 0 ? "Unrealized Gain" : "Unrealized Loss"}
                        </span>
                        <span className={cn("font-mono font-extrabold tabular-nums", secondHolding.gain >= 0 ? "text-foreground" : "text-rose-600 dark:text-rose-400")}>
                          {secondHolding.gain >= 0 ? "+" : ""}{formatCurrency(secondHolding.gain, currency)}
                        </span>
                      </div>
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-60 text-xs rounded-xl border border-border/40 shadow-lg p-3">
                    <p className="font-bold text-xs mb-1">{secondHolding.name} ({secondHolding.symbol})</p>
                    <p className="text-[11px] text-muted-foreground">
                      Return: <span className="font-bold text-foreground">{secondHolding.returnPct >= 0 ? "+" : ""}{secondHolding.returnPct.toFixed(2)}%</span> ({formatCurrency(secondHolding.gain, currency)}).
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>

            {/* Bottom Summary Pill */}
            <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[10px] font-bold text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-lg">
              <span>Profitable Positions</span>
              <span className="text-foreground font-extrabold">
                {profitableCount} / {activeHoldings.length} ({winRate.toFixed(0)}%)
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground py-8 text-center flex items-center justify-center h-full">
            No active positions recorded.
          </div>
        )}
      </div>
    </div>
  )
}
