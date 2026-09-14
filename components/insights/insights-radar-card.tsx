"use client"

import React from "react"
import type { SpendingInsight, InsightSeverity } from "@/types"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, CheckCircle2, Flame, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface InsightsRadarCardProps {
  insights: SpendingInsight[]
}

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { label: string; color: string; barColor: string; dotColor: string }
> = {
  critical: {
    label: "Critical",
    color: "text-red-500",
    barColor: "bg-red-500",
    dotColor: "bg-red-500",
  },
  warning: {
    label: "Warning",
    color: "text-amber-500",
    barColor: "bg-amber-500",
    dotColor: "bg-amber-500",
  },
  opportunity: {
    label: "Opportunity",
    color: "text-purple-500",
    barColor: "bg-purple-500",
    dotColor: "bg-purple-500",
  },
  info: {
    label: "Info",
    color: "text-blue-500",
    barColor: "bg-blue-500",
    dotColor: "bg-blue-500",
  },
}

export function InsightsRadarCard({ insights }: InsightsRadarCardProps) {
  const total = insights.length
  const counts: Record<InsightSeverity, number> = {
    critical: insights.filter((i) => i.severity === "critical").length,
    warning: insights.filter((i) => i.severity === "warning").length,
    opportunity: insights.filter((i) => i.severity === "opportunity").length,
    info: insights.filter((i) => i.severity === "info").length,
  }

  const topSignal = insights[0] // Sorted by score descending

  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden flex flex-col justify-between h-full">
      {/* ── Header Strip ── */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Signal Severity Radar
          </span>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 bg-muted text-foreground border border-border/40"
        >
          {total} {total === 1 ? "Signal" : "Signals"}
        </Badge>
      </div>

      {/* ── Content ── */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 flex-1 justify-between">
        {/* Severity Distribution Meters */}
        <div className="flex flex-col gap-2">
          {(["critical", "warning", "opportunity", "info"] as InsightSeverity[]).map((sev) => {
            const conf = SEVERITY_CONFIG[sev]
            const count = counts[sev]
            const pct = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <div key={sev} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", conf.dotColor)} />
                    <span className="font-semibold text-foreground text-[11px]">{conf.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    <span className="font-bold text-foreground">{count}</span> ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", conf.barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic Health Summary Strip to fill empty space with valuable context */}
        <div className="rounded-lg bg-muted/40 border border-border/30 px-2.5 py-1.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Health Status</span>
          {counts.critical > 0 ? (
            <span className="font-bold text-red-500 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              {counts.critical} Critical Action Needed
            </span>
          ) : counts.warning > 0 ? (
            <span className="font-bold text-amber-500 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {counts.warning} Flagged Warning{counts.warning > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="font-bold text-emerald-500 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Optimal Range
            </span>
          )}
        </div>

        {/* Priority Spotlight Callout */}
        {topSignal ? (
          <div className="rounded-xl border border-border/40 bg-muted/30 p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Flame className="size-3 text-primary" aria-hidden="true" />
                Top Priority Focus
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-bold h-4 px-1.5 rounded-sm border-primary/30 text-primary bg-primary/5"
              >
                Score {topSignal.score}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-foreground truncate">{topSignal.title}</p>
            {topSignal.actionUrl && topSignal.actionLabel && (
              <Link
                href={topSignal.actionUrl}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 self-start"
              >
                {topSignal.actionLabel}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 p-3 flex items-center gap-2 text-muted-foreground text-xs justify-center">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span>Radar is all clear</span>
          </div>
        )}
      </div>

      {/* ── Footer Strip (Matches Briefing Card on desktop at lg+) ── */}
      <div className="hidden lg:flex px-4 py-2 border-t border-border/30 bg-muted/10 items-center justify-between text-[11px] text-muted-foreground">
        <span>Active anomaly monitoring</span>
        <span className="font-semibold text-foreground">
          {counts.critical + counts.warning > 0
            ? `${counts.critical + counts.warning} action items`
            : "All clear"}
        </span>
      </div>
    </div>
  )
}
