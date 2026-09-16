"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bot, AlertCircle, Clock, TrendingUp, TrendingDown } from "lucide-react"
import type {
  AssetValuationMetrics,
  AssetValuationBriefing,
} from "@/lib/calculations/asset-valuation"
import { cn, formatCurrency } from "@/lib/utils"

interface AssetValuationInsightsCardProps {
  metrics: AssetValuationMetrics
  briefing: AssetValuationBriefing
  currency: string
  onLogValuationClick?: () => void
  className?: string
}

export function AssetValuationInsightsCard({
  metrics,
  briefing,
  currency,
  onLogValuationClick,
  className,
}: AssetValuationInsightsCardProps) {
  const ratePct = (metrics.annualizedRate * 100).toFixed(1)
  const isPositiveRate = metrics.annualizedRate >= 0

  return (
    <Card
      className={cn(
        "@container rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden relative bg-card shrink-0",
        className
      )}
    >
      {/* ── Card Header Strip ── */}
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            AI Valuation Insights
          </span>
        </div>

        <Badge
          variant="outline"
          className="rounded-md font-semibold text-[10px] h-5 px-2 gap-1 border-primary/30 text-primary bg-primary/5 shrink-0"
        >
          {briefing.isAiGenerated ? (
            <>
              <Bot className="size-3" aria-hidden="true" />
              Gemini AI
            </>
          ) : (
            <>
              <Sparkles className="size-3" aria-hidden="true" />
              Analysis
            </>
          )}
        </Badge>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col gap-3">
        {/* Metric Summary Grid — container-responsive with benchmark rate on top line */}
        <div className="grid grid-cols-1 @[260px]:grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/30 bg-muted/20 p-2.5 flex flex-col justify-between gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-1 text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              <span className="truncate">Annual Return</span>
              <span className="tabular-nums font-semibold normal-case text-muted-foreground/80 shrink-0">
                CAGR
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              {isPositiveRate ? (
                <TrendingUp className="size-3 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className="size-3 text-amber-500 shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs font-bold tabular-nums truncate",
                  isPositiveRate
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {ratePct}%{" "}
                <span className="text-[10px] font-normal text-muted-foreground">/ yr</span>
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/30 bg-muted/20 p-2.5 flex flex-col justify-between gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-1 text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              <span className="truncate">vs Benchmark</span>
              <span className="tabular-nums font-semibold normal-case text-muted-foreground/80 shrink-0">
                {(metrics.benchmarkRate * 100).toFixed(1)}%/yr
              </span>
            </div>
            <div className="flex items-center min-w-0">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md text-[10px] font-bold h-5 px-2 capitalize border truncate max-w-full",
                  metrics.performance === "outperforming"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : metrics.performance === "underperforming"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                )}
              >
                <span
                  className="size-1.5 rounded-full mr-1.5 shrink-0"
                  style={{
                    backgroundColor:
                      metrics.performance === "outperforming"
                        ? "#10b981"
                        : metrics.performance === "underperforming"
                        ? "#f43f5e"
                        : "#3b82f6",
                  }}
                />
                <span className="truncate">{metrics.performance.replace("_", " ")}</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Narrative / Executive Summary */}
        <div className="border-l-2 border-primary/40 pl-3 py-0.5">
          <p className="text-xs text-foreground/90 leading-relaxed font-normal">
            {briefing.summary}
          </p>
        </div>

        {/* Actionable Recommendation Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="size-3.5" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
              Recommendation
            </span>
            <p className="text-[11px] text-foreground/85 leading-relaxed">
              {briefing.focalAdvice}
            </p>
          </div>
        </div>

        {/* Staleness Notice (if over 90 days) */}
        {metrics.isStale && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 text-amber-600 dark:text-amber-400 text-xs">
              <Clock className="size-3.5 shrink-0" />
              <span className="truncate text-[11px] font-medium">
                Last logged {metrics.daysSinceLastValuation} days ago
              </span>
            </div>
            {onLogValuationClick && (
              <button
                type="button"
                onClick={onLogValuationClick}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0 cursor-pointer"
              >
                Log Valuation
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Footer Strip ── */}
      <div className="px-4 py-2.5 border-t border-border/30 bg-muted/15 flex items-center justify-between gap-2 flex-wrap text-[10px] text-muted-foreground">
        <span className="truncate">
          Total Return: {metrics.totalReturnPct >= 0 ? "+" : ""}
          {metrics.totalReturnPct.toFixed(1)}% ({formatCurrency(metrics.nominalChange, currency)})
        </span>
        <span className="flex items-center gap-1 font-medium text-muted-foreground shrink-0 ml-auto">
          {briefing.isAiGenerated ? (
            <>
              <Sparkles className="size-2.5 text-primary" />
              Gemini AI
            </>
          ) : (
            "Deterministic Model"
          )}
        </span>
      </div>
    </Card>
  )
}
