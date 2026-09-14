"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { SpendingInsight, InsightCategory, InsightSeverity } from "@/types"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
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
  currency?: string
  onDismiss: (id: string) => void
  onToggleBookmark: (id: string, current: boolean) => void
}

const CATEGORY_ICONS: Record<InsightCategory, React.ElementType> = {
  spikes: Flame,
  outliers: AlertTriangle,
  subscriptions: Repeat,
  savings: PiggyBank,
  cashflow: TrendingDown,
  income: Info,
}

const CATEGORY_COLORS: Record<InsightCategory, string> = {
  spikes: "#f43f5e",
  outliers: "#f59e0b",
  subscriptions: "#a855f7",
  savings: "#10b981",
  cashflow: "#0ea5e9",
  income: "#6366f1",
}

const SEVERITY_COLORS: Record<InsightSeverity, string> = {
  critical: "#f43f5e",
  warning: "#f59e0b",
  opportunity: "#a855f7",
  info: "#3b82f6",
}

export function InsightCard({
  insight,
  currency = "USD",
  onDismiss,
  onToggleBookmark,
}: InsightCardProps) {
  const router = useRouter()
  const Icon = CATEGORY_ICONS[insight.category] || Info

  const accentColor =
    insight.severity === "critical"
      ? "#f43f5e"
      : CATEGORY_COLORS[insight.category] || "#8b5cf6"

  const isCritical = insight.severity === "critical"
  const isPositive = insight.category === "savings" || insight.category === "income"

  return (
    <Card
      onClick={() => {
        if (insight.actionUrl) {
          router.push(insight.actionUrl)
        }
      }}
      className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      {/* Top Accent Strip */}
      <div
        className="h-0.75 w-full shrink-0 transition-all duration-300"
        style={{ backgroundColor: accentColor }}
      />

      {/* ── Card Header ── */}
      <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: accentColor + "18",
              color: accentColor,
            }}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
              {insight.title}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-transparent capitalize"
                style={{
                  backgroundColor: accentColor + "18",
                  color: accentColor,
                }}
              >
                {insight.severity}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
              >
                {insight.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Controls (Star & Dismiss) */}
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleBookmark(insight.id, !!insight.isBookmarked)
                }}
                aria-label={insight.isBookmarked ? "Remove bookmark" : "Bookmark signal"}
                className="size-8 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer"
              >
                <Star
                  className={cn(
                    "size-3.5",
                    insight.isBookmarked ? "fill-amber-500 text-amber-500" : ""
                  )}
                  aria-hidden="true"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-xl font-medium">
              {insight.isBookmarked ? "Remove Bookmark" : "Bookmark Signal"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(insight.id)
                }}
                aria-label="Dismiss signal"
                className="size-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-xl font-medium">
              Dismiss Signal
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      {/* ── Card Content ── */}
      <CardContent className="px-4 pb-3 flex flex-col gap-3 flex-1">
        {/* Metric / Hero Display */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
              {insight.metricImpact ? "Estimated Impact" : "Metric"}
            </p>
            <p
              className={cn(
                "text-[1.5rem] font-black tabular-nums leading-none select-all",
                isCritical
                  ? "text-rose-500"
                  : isPositive
                  ? "text-emerald-500"
                  : "text-foreground"
              )}
            >
              {insight.metricImpact
                ? `${isCritical ? "+" : isPositive ? "" : ""}${formatCurrency(insight.metricImpact, currency)}`
                : insight.metricLabel || "Detected"}
            </p>
          </div>
          {insight.metricImpact && insight.metricLabel && (
            <div className="text-right">
              <Badge
                variant="outline"
                className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-lg border-border/50 bg-muted/20"
              >
                {insight.metricLabel}
              </Badge>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {insight.description}
        </p>

        {/* Inset 2-Col Detail Box */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/20 border border-border/20 rounded-xl px-3 py-2.5 mt-auto">
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Priority Score
            </p>
            <p className="text-[11px] font-bold text-foreground/90 mt-0.5 flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              {insight.score} / 100
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Detected
            </p>
            <p className="text-[11px] font-bold text-foreground/90 mt-0.5">
              {formatDate(insight.detectedAt)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {insight.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-semibold text-muted-foreground/70 bg-muted/40 border border-border/25 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <Separator className="bg-border/20" />

      {/* ── Card Footer ── */}
      <CardFooter className="px-3 py-2.5 mt-auto bg-muted/20">
        {insight.actionUrl && insight.actionLabel ? (
          <Button
            asChild
            variant="outline"
            onClick={(e) => e.stopPropagation()}
            className="w-full h-8 rounded-xl text-xs font-bold gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          >
            <Link href={insight.actionUrl}>
              <span>{insight.actionLabel}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            className="w-full h-8 rounded-xl text-xs font-medium gap-2 border-border/40 opacity-70"
          >
            Informational Signal
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
