"use client"

import React from "react"
import type { SpendingInsight, InsightCategory, InsightSeverity } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
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
  critical: "border-red-500/30 bg-red-500/5 text-red-500",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-500",
  opportunity: "border-purple-500/30 bg-purple-500/5 text-purple-500",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-500",
}

const CATEGORY_ICONS: Record<InsightCategory, React.ElementType> = {
  spikes: Flame,
  outliers: AlertTriangle,
  subscriptions: Repeat,
  savings: PiggyBank,
  cashflow: TrendingDown,
  income: Info,
}

export function InsightCard({ insight, onDismiss, onToggleBookmark }: InsightCardProps) {
  const Icon = CATEGORY_ICONS[insight.category] || Info

  return (
    <Card className="rounded-2xl border border-border/40 bg-card hover:border-border/80 transition-all p-5 flex flex-col justify-between gap-4 shadow-xs">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`rounded-md font-semibold text-[10px] h-5 capitalize ${SEVERITY_STYLES[insight.severity]}`}
            >
              {insight.severity}
            </Badge>

            {insight.metricLabel && (
              <Badge
                variant="outline"
                className="rounded-md font-semibold text-[10px] h-5 border-border/60 bg-muted/40 text-foreground"
              >
                {insight.metricLabel}
              </Badge>
            )}
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleBookmark(insight.id, !!insight.isBookmarked)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Star
                      className={`size-3.5 ${insight.isBookmarked ? "fill-amber-500 text-amber-500" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {insight.isBookmarked ? "Remove Bookmark" : "Bookmark Insight"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDismiss(insight.id)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-red-500"
                  >
                    <X className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Dismiss</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center shrink-0 text-foreground mt-0.5">
            <Icon className="size-4.5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-snug">{insight.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
          </div>
        </div>
      </div>

      {insight.actionUrl && insight.actionLabel && (
        <div className="pt-2 border-t border-border/30 flex justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl font-bold gap-1.5 text-xs h-8 border-border/40 hover:bg-muted/40"
          >
            <Link href={insight.actionUrl}>
              {insight.actionLabel}
              <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
      )}
    </Card>
  )
}
