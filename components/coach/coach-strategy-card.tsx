"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Target,
  Sparkles,
  Repeat,
  PiggyBank,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CoachStrategy } from "@/types"

interface CoachStrategyCardProps {
  strategy: CoachStrategy
}

const CATEGORY_STYLES: Record<string, string> = {
  emergency_fund: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  debt_payoff: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  goal_acceleration: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  subscription_trim: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  budget_tuning: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
}

export function CoachStrategyCard({ strategy }: CoachStrategyCardProps) {
  const getCategoryIcon = () => {
    switch (strategy.category) {
      case "emergency_fund":
        return ShieldAlert
      case "debt_payoff":
        return TrendingDown
      case "goal_acceleration":
        return Target
      case "subscription_trim":
        return Repeat
      case "budget_tuning":
        return PiggyBank
      default:
        return Sparkles
    }
  }

  const Icon = getCategoryIcon()
  const categoryStyle = CATEGORY_STYLES[strategy.category] || "text-primary bg-primary/10 border-primary/20"

  const getImpactBadgeVariant = () => {
    switch (strategy.impact) {
      case "high":
        return "border-rose-500/30 bg-rose-500/10 text-rose-500"
      case "easy_win":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
      default:
        return "border-amber-500/30 bg-amber-500/10 text-amber-500"
    }
  }

  const getCategoryLabel = () => {
    switch (strategy.category) {
      case "emergency_fund":
        return "Safety Net"
      case "debt_payoff":
        return "Debt Payoff"
      case "goal_acceleration":
        return "Goal Velocity"
      case "subscription_trim":
        return "Recurring Trim"
      case "budget_tuning":
        return "Budget Tuning"
      default:
        return "Wealth Strategy"
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between overflow-hidden group">
      {/* ── Header Strip ── */}
      <div className="px-3.5 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 bg-muted/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("size-6 rounded-md flex items-center justify-center shrink-0 border", categoryStyle)}>
            <Icon className="size-3.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {getCategoryLabel()}
          </span>
        </div>

        <Badge
          variant="outline"
          className={cn("text-[9px] font-bold px-1.5 py-0 h-4.5 rounded-sm shrink-0 uppercase tracking-wider", getImpactBadgeVariant())}
        >
          {strategy.impact.replace("_", " ")}
        </Badge>
      </div>

      {/* ── Body Content ── */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug wrap-break-word group-hover:text-primary transition-colors">
            {strategy.title}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {strategy.description}
          </p>
        </div>

        {/* Packed Metric Strip */}
        <div className="px-2.5 py-2 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {strategy.primaryMetric.label}
            </span>
            <span className="text-sm sm:text-base font-black tabular-nums text-foreground">
              {strategy.primaryMetric.value}
            </span>
          </div>

          {strategy.primaryMetric.delta && (
            <span className="text-[10px] font-bold text-primary text-right truncate bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
              {strategy.primaryMetric.delta}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer Action Strip ── */}
      <div className="px-3.5 py-2 border-t border-border/20 bg-muted/5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-muted-foreground truncate">
          {strategy.subtitle}
        </span>
        <Link
          href={strategy.actionUrl}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0 group/link"
        >
          <span>{strategy.actionLabel}</span>
          <ArrowUpRight className="size-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  )
}
