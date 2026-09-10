"use client"

import React from "react"
import type { SpendingInsight, InsightCategory, InsightSeverity } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertTriangle,
  Flame,
  PiggyBank,
  Repeat,
  ArrowUpRight,
  Star,
  X,
  TrendingDown,
  Info,
} from "lucide-react"

interface InsightCardProps {
  insight: SpendingInsight
  onDismiss: (id: string) => void
  onToggleBookmark: (id: string, current: boolean) => void
}

const SEVERITY_STYLES: Record<InsightSeverity, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-500",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  opportunity: "border-purple-500/30 bg-purple-500/10 text-purple-500",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-500",
}

const SEVERITY_DOTS: Record<InsightSeverity, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  opportunity: "bg-purple-500",
  info: "bg-blue-500",
}

const CATEGORY_ICONS: Record<InsightCategory, React.ElementType> = {
  spikes: Flame,
  outliers: AlertTriangle,
  subscriptions: Repeat,
  savings: PiggyBank,
  cashflow: TrendingDown,
  income: Info,
}

const CATEGORY_ICON_STYLES: Record<InsightCategory, string> = {
  spikes: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  outliers: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  subscriptions: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  savings: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cashflow: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  income: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
}

export function InsightCard({ insight, onDismiss, onToggleBookmark }: InsightCardProps) {
  const Icon = CATEGORY_ICONS[insight.category] || Info

  return (
    <Card className="rounded-2xl border border-border/40 bg-card hover:border-border/80 hover:shadow-md transition-all shadow-xs overflow-hidden flex flex-col justify-between h-full group">
      {/* ── Card Header Strip ── */}
      <div className="px-4 py-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md font-bold text-[10px] h-5 capitalize px-2 tracking-wide border flex items-center gap-1",
              SEVERITY_STYLES[insight.severity]
            )}
          >
            <span className={cn("size-1.5 rounded-full shrink-0", SEVERITY_DOTS[insight.severity])} />
            {insight.severity}
          </Badge>

          <span className="text-[11px] font-semibold text-muted-foreground capitalize truncate">
            {insight.category}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleBookmark(insight.id, !!insight.isBookmarked)}
                aria-label={insight.isBookmarked ? "Remove bookmark" : "Bookmark insight"}
                className="size-6 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Star
                  className={cn(
                    "size-3",
                    insight.isBookmarked ? "fill-amber-500 text-amber-500" : ""
                  )}
                  aria-hidden="true"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {insight.isBookmarked ? "Remove Bookmark" : "Bookmark Insight"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(insight.id)}
                aria-label="Dismiss insight"
                className="size-6 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <X className="size-3" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Dismiss</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Card Body ── */}
      <CardContent className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "size-9 rounded-xl border shrink-0 flex items-center justify-center mt-0.5 shadow-2xs",
              CATEGORY_ICON_STYLES[insight.category] || "bg-primary/10 text-primary border-primary/20"
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                {insight.title}
              </h3>
              {insight.metricLabel && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold px-1.5 py-0 h-4.5 rounded-md shrink-0 bg-muted text-foreground border border-border/40"
                >
                  {insight.metricLabel}
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {insight.description}
            </p>

            {insight.tags && insight.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {insight.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-semibold text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded-sm border border-border/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Card Footer ── */}
        <div className="pt-2.5 border-t border-border/20 flex items-center justify-between gap-2 mt-auto">
          <span className="text-[10px] font-medium text-muted-foreground">
            Priority Score: <span className="font-bold text-foreground">{insight.score}</span>/100
          </span>

          {insight.actionUrl && insight.actionLabel ? (
            <Button
              asChild
              variant="outline"
              size="xs"
              className="rounded-lg font-bold gap-1 text-[11px] h-7 px-2.5 border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
            >
              <Link href={insight.actionUrl}>
                {insight.actionLabel}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic">Informational</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
