"use client"

import React, { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { formatCurrency, cn } from "@/lib/utils"
import { Asset, AssetValuation } from "@/types"
import type { AssetValuationMetrics } from "@/lib/calculations/asset-valuation"
import {
  ShieldCheck,
  Clock,
  Scale,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react"

interface AssetHealthDiagnosticsCardProps {
  asset: Asset
  valuations: AssetValuation[]
  metrics: AssetValuationMetrics
  className?: string
}

export function AssetHealthDiagnosticsCard({
  asset,
  valuations,
  metrics,
  className,
}: AssetHealthDiagnosticsCardProps) {
  const isAsset = asset.kind === "asset"
  const accent = isAsset ? "#10b981" : "#ef4444"

  const sorted = useMemo(() => {
    return [...valuations].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [valuations])

  // Freshness calculation (90-day review cycle)
  const daysSince = metrics.daysSinceLastValuation
  const freshnessPct = Math.max(0, Math.min(100, Math.round(((90 - daysSince) / 90) * 100)))
  const daysRemaining = Math.max(0, 90 - daysSince)
  const isOverdue = daysSince > 90

  // Monthly velocity
  const monthlyVelocity = useMemo(() => {
    if (sorted.length < 2 || metrics.holdingPeriodYears <= 0) return null
    const totalMonths = Math.max(1, metrics.holdingPeriodYears * 12)
    return Math.round(metrics.nominalChange / totalMonths)
  }, [sorted.length, metrics.holdingPeriodYears, metrics.nominalChange])

  // Average Cadence
  const cadenceDays = useMemo(() => {
    if (sorted.length < 2) return null
    const firstTime = new Date(sorted[0].date).getTime()
    const lastTime = new Date(sorted[sorted.length - 1].date).getTime()
    const days = Math.round((lastTime - firstTime) / (1000 * 60 * 60 * 24))
    return Math.max(1, Math.round(days / (sorted.length - 1)))
  }, [sorted])

  const netOwnedValue = Math.round(
    asset.currentValue * (asset.ownershipPercentage / 100)
  )

  // Benchmark comparison percentage representation
  const ratePct = (metrics.annualizedRate * 100).toFixed(1)
  const benchmarkRatePct = (metrics.benchmarkRate * 100).toFixed(1)
  const benchmarkDeltaPct = (metrics.benchmarkDelta * 100).toFixed(1)

  // Overall Health Tier
  const healthTier = useMemo(() => {
    if (sorted.length <= 1) {
      return {
        label: "Baseline Set",
        variant: "outline" as const,
        className: "border-primary/30 text-primary bg-primary/5",
      }
    }
    if (isOverdue) {
      return {
        label: "Review Due",
        variant: "outline" as const,
        className: "border-amber-500/30 text-amber-500 bg-amber-500/10",
      }
    }
    if (metrics.performance === "outperforming") {
      return {
        label: "Optimal Cadence",
        variant: "outline" as const,
        className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
      }
    }
    if (metrics.performance === "underperforming") {
      return {
        label: "Lagging Target",
        variant: "outline" as const,
        className: "border-rose-500/30 text-rose-500 bg-rose-500/10",
      }
    }
    return {
      label: "Healthy Cadence",
      variant: "outline" as const,
      className: "border-blue-500/30 text-blue-500 bg-blue-500/10",
    }
  }, [sorted.length, isOverdue, metrics.performance])

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden bg-card shrink-0",
        className
      )}
    >
      {/* ── Card Header ── */}
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-primary" style={{ color: accent }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Valuation Health &amp; Diagnostics
          </span>
        </div>

        <Badge
          variant={healthTier.variant}
          className={cn(
            "rounded-md text-[9px] font-bold uppercase tracking-wider h-5 px-2",
            healthTier.className
          )}
        >
          {healthTier.label}
        </Badge>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col gap-3.5">
        {/* Diagnostic Progress Rows */}
        <div className="flex flex-col gap-2.5">
          {/* Row 1: Appraisal Freshness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px]">
                <Clock className="size-3 text-muted-foreground" />
                Appraisal Freshness
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
                    >
                      <Info className="size-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-3 text-xs w-64 border border-border/40 shadow-lg rounded-xl"
                    align="start"
                  >
                    Valuations should be refreshed at least once every 90 days.
                    Fresh records keep your net worth calculations reliable and
                    current.
                  </PopoverContent>
                </Popover>
              </span>
              <span
                className={cn(
                  "font-bold text-[11px] tabular-nums",
                  isOverdue ? "text-amber-500" : "text-foreground"
                )}
              >
                {isOverdue
                  ? `${daysSince - 90}d overdue`
                  : `${daysRemaining}d remaining in cycle`}
              </span>
            </div>
            <Progress
              value={freshnessPct}
              className="h-1.5 bg-muted/50"
              indicatorStyle={{
                backgroundColor: isOverdue
                  ? "#f59e0b"
                  : daysSince <= 30
                  ? "#10b981"
                  : "var(--primary)",
              }}
            />
          </div>

          {/* Row 2: Category Benchmark Spread */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px]">
                <Scale className="size-3 text-muted-foreground" />
                Benchmark Spread ({ratePct}% vs {benchmarkRatePct}%/yr)
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
                    >
                      <Info className="size-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-3 text-xs w-64 border border-border/40 shadow-lg rounded-xl"
                    align="start"
                  >
                    Compares this asset&apos;s annualized return against the
                    standard {asset.category.replace("_", " ")} category baseline
                    of {benchmarkRatePct}%/yr.
                  </PopoverContent>
                </Popover>
              </span>
              <span
                className={cn(
                  "font-bold text-[11px] tabular-nums",
                  metrics.performance === "outperforming"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : metrics.performance === "underperforming"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground"
                )}
              >
                {metrics.benchmarkDelta >= 0 ? "+" : ""}
                {benchmarkDeltaPct}% spread
              </span>
            </div>
            <Progress
              value={
                metrics.performance === "outperforming"
                  ? Math.min(100, 60 + Math.abs(metrics.benchmarkDelta) * 200)
                  : metrics.performance === "underperforming"
                  ? Math.max(15, 50 - Math.abs(metrics.benchmarkDelta) * 200)
                  : 50
              }
              className="h-1.5 bg-muted/50"
              indicatorStyle={{
                backgroundColor:
                  metrics.performance === "outperforming"
                    ? "#10b981"
                    : metrics.performance === "underperforming"
                    ? "#f43f5e"
                    : "#3b82f6",
              }}
            />
          </div>
        </div>

        {/* 3-Cell Micro Stat Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/20">
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 p-2 min-w-0">
            <span className="text-[8.5px] uppercase font-bold text-muted-foreground/70 tracking-wider truncate">
              Capital Velocity
            </span>
            <div className="flex items-center gap-1 min-w-0">
              {monthlyVelocity !== null ? (
                <>
                  {monthlyVelocity >= 0 ? (
                    <TrendingUp className="size-3 text-emerald-500 shrink-0" />
                  ) : (
                    <TrendingDown className="size-3 text-amber-500 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums truncate",
                      monthlyVelocity >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {monthlyVelocity >= 0 ? "+" : ""}
                    {formatCurrency(monthlyVelocity / 100, asset.currency)}
                    <span className="text-[9px] font-normal text-muted-foreground">
                      /mo
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  Baseline
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 p-2 min-w-0">
            <span className="text-[8.5px] uppercase font-bold text-muted-foreground/70 tracking-wider truncate">
              Net Equity
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums truncate">
              {formatCurrency(netOwnedValue / 100, asset.currency)}
            </span>
            <span className="text-[9px] text-muted-foreground truncate">
              {asset.ownershipPercentage}% share
            </span>
          </div>

          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 p-2 min-w-0">
            <span className="text-[8.5px] uppercase font-bold text-muted-foreground/70 tracking-wider truncate">
              Appraisal Log
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums truncate">
              {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
            </span>
            <span className="text-[9px] text-muted-foreground truncate">
              {cadenceDays !== null ? `every ~${cadenceDays}d` : "first baseline"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
