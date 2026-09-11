import React from "react"
import { Card, CardContent } from "@/components/ui/card"
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
}

export function AssetValuationInsightsCard({
  metrics,
  briefing,
  currency,
  onLogValuationClick,
}: AssetValuationInsightsCardProps) {
  const ratePct = (metrics.annualizedRate * 100).toFixed(1)
  const isPositiveRate = metrics.annualizedRate >= 0

  return (
    <Card className="rounded-2xl border border-border/40 shadow-xs overflow-hidden flex flex-col justify-between bg-card relative">
      {/* Background glow accent */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-40 rounded-full bg-primary/10 blur-[40px] pointer-events-none" />

      {/* ── Card Header Strip ── */}
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5 animate-pulse" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-foreground leading-none">
              AI Valuation Insights
            </h3>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              Predictive analysis &amp; category curves
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-md font-semibold text-[10px] h-5 px-2 gap-1 border-primary/30 text-primary bg-primary/5"
        >
          {briefing.isAiGenerated ? (
            <Bot className="size-3" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3" aria-hidden="true" />
          )}
          {briefing.isAiGenerated ? "Gemini 1.5" : "Diagnostic Summary"}
        </Badge>
      </div>

      {/* ── Card Body ── */}
      <CardContent className="p-4 flex flex-col gap-3 flex-1 justify-between">
        {/* Metric Badges / Performance Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md text-[10px] font-bold h-5 px-2 gap-1 border",
              isPositiveRate
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/30 bg-amber-500/10 text-amber-500"
            )}
          >
            {isPositiveRate ? (
              <TrendingUp className="size-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3" aria-hidden="true" />
            )}
            {ratePct}% / yr
          </Badge>

          <Badge
            variant="outline"
            className={cn(
              "rounded-md text-[10px] font-bold h-5 px-2 capitalize border",
              metrics.performance === "outperforming"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : metrics.performance === "underperforming"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                : "border-blue-500/30 bg-blue-500/10 text-blue-500"
            )}
          >
            {metrics.performance.replace("_", " ")} Benchmark
          </Badge>

          <span className="text-[10px] font-medium text-muted-foreground ml-auto">
            {metrics.totalReturnPct >= 0 ? "+" : ""}
            {metrics.totalReturnPct.toFixed(1)}% ({formatCurrency(metrics.nominalChange, currency)})
          </span>
        </div>

        {/* Executive Summary */}
        <p className="text-xs text-foreground/90 leading-relaxed font-medium">
          {briefing.summary}
        </p>

        {/* Focal Recommendation Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
          <div className="size-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="size-3.5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
              Focal Actionable Recommendation
            </span>
            <p className="text-[11px] text-foreground/90 leading-relaxed">
              {briefing.focalAdvice}
            </p>
          </div>
        </div>

        {/* Staleness Notice (if over 90 days) */}
        {metrics.isStale && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 text-amber-500 text-[11px]">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Last logged {metrics.daysSinceLastValuation} days ago
              </span>
            </div>
            {onLogValuationClick && (
              <button
                type="button"
                onClick={onLogValuationClick}
                className="text-[10px] font-bold text-amber-500 hover:underline shrink-0 cursor-pointer"
              >
                Log Valuation
              </button>
            )}
          </div>
        )}
      </CardContent>

      {/* ── Footer Strip ── */}
      <div className="px-4 py-2 border-t border-border/30 bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Benchmark: {(metrics.benchmarkRate * 100).toFixed(1)}%/yr</span>
        {briefing.isAiGenerated ? (
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Sparkles className="size-2.5 text-primary" aria-hidden="true" />
            Gemini 1.5
          </span>
        ) : (
          <span>Deterministic model</span>
        )}
      </div>
    </Card>
  )
}
