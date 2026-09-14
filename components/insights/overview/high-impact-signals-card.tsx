"use client"

import * as React from "react"
import Link from "next/link"
import type { SpendingInsight, InsightCategory, InsightSeverity } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/components/ui/item"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { cn, formatCurrency } from "@/lib/utils"
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  PiggyBank,
  Repeat,
  TrendingDown,
  Info,
  Star,
  X,
} from "lucide-react"

interface HighImpactSignalsCardProps {
  insights: SpendingInsight[]
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

const CATEGORY_STYLES: Record<InsightCategory, string> = {
  spikes: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  outliers: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  subscriptions: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  savings: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  cashflow: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  income: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
}

const SEVERITY_BADGES: Record<InsightSeverity, { label: string; className: string }> = {
  critical: { label: "Critical", className: "border-red-500/30 bg-red-500/10 text-red-500" },
  warning: { label: "Warning", className: "border-amber-500/30 bg-amber-500/10 text-amber-500" },
  opportunity: { label: "Opportunity", className: "border-purple-500/30 bg-purple-500/10 text-purple-500" },
  info: { label: "Info", className: "border-blue-500/30 bg-blue-500/10 text-blue-500" },
}

function formatShortDescription(ins: SpendingInsight): string {
  switch (ins.category) {
    case "spikes":
      return ins.metricLabel ? `${ins.metricLabel} vs 90d baseline` : "Spending surge vs baseline"
    case "outliers":
      return "Outlier transaction alert"
    case "subscriptions":
      if (ins.description.toLowerCase().includes("duplicate")) return "Duplicate charge detected"
      if (ins.description.toLowerCase().includes("increase") || ins.description.toLowerCase().includes("hike")) return "Subscription price increase"
      return "Recurring subscription renewal"
    case "savings":
      if (ins.description.toLowerCase().includes("surplus")) return "Budget surplus reserve"
      return "Discretionary spend win"
    case "cashflow":
      return "Elevated weekly burn rate"
    case "income":
      return "Income variance alert"
    default:
      return ins.description.length > 50 ? `${ins.description.slice(0, 48)}…` : ins.description
  }
}

export function HighImpactSignalsCard({
  insights,
  currency = "USD",
  onDismiss,
  onToggleBookmark,
}: HighImpactSignalsCardProps) {
  // Take top priority items (score >= 60 or top 6 sorted)
  const priorityItems = React.useMemo(() => {
    return [...insights]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [insights])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            High-Impact Actionable Insights
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 bg-muted text-foreground border border-border/40">
          {priorityItems.length} Priority {priorityItems.length === 1 ? "Signal" : "Signals"}
        </Badge>
      </div>

      {/* ── Content List (No extra top spacing, starts immediately below header) ── */}
      <div className="flex-1 min-h-0">
        {priorityItems.length > 0 ? (
          <ScrollArea className="h-64 sm:h-72 pr-3 pl-2.5">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2 w-full min-w-0">
              {priorityItems.map((ins) => {
                const Icon = CATEGORY_ICONS[ins.category] || Info
                const iconColor = CATEGORY_STYLES[ins.category] || "text-primary bg-primary/10 border-primary/20"
                const sevBadge = SEVERITY_BADGES[ins.severity]
                const isCritical = ins.severity === "critical"

                // Clean concise title: strip redundant words like "Spike (+...%)" or "Outlier Surge"
                const cleanTitle = ins.title
                  .replace(/\s*spike\b/i, "")
                  .replace(/\s*outlier\b/i, "")
                  .replace(/\s*surge\b/i, "")
                  .replace(/\s*\(.*?\)\s*/g, "")
                  .trim() || ins.title

                // Short, punchy descriptor
                const shortDesc = formatShortDescription(ins)

                const href = ins.actionUrl || "/insights"

                return (
                  <HoverCard key={ins.id} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Item
                        asChild
                        className="cursor-pointer p-2.5 hover:bg-muted/40 transition-colors rounded-xl border-transparent group overflow-hidden"
                      >
                        <Link href={href} className="flex items-start gap-2.5 w-full min-w-0">
                          {/* Media Icon */}
                          <ItemMedia className={cn("size-7.5 rounded-lg border shrink-0 mt-0.5", iconColor)}>
                            <Icon className="size-4" />
                          </ItemMedia>

                          {/* Content */}
                          <ItemContent className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="text-xs font-bold text-foreground leading-snug wrap-break-word line-clamp-2 group-hover:text-primary transition-colors">
                                {cleanTitle}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] font-bold px-1.5 py-0 h-4 rounded-sm shrink-0", sevBadge.className)}
                              >
                                {sevBadge.label}
                              </Badge>
                            </div>
                            <ItemDescription className="text-[10px] text-muted-foreground leading-tight line-clamp-2 mt-0.5 block wrap-break-word">
                              {shortDesc}
                            </ItemDescription>

                            {/* Metric & Utility Actions on the same line */}
                            <div className="mt-1 flex items-center justify-between gap-1.5 w-full min-w-0">
                              <div className="flex items-center gap-1 min-w-0">
                                {ins.metricLabel ? (
                                  <span className="text-[11px] font-bold font-mono text-foreground/90 truncate">
                                    {ins.metricLabel}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-muted-foreground/70 capitalize truncate">
                                    {ins.category} signal
                                  </span>
                                )}
                              </div>

                              {/* Action controls: Star & Dismiss */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="size-6.5 rounded-md text-muted-foreground hover:text-amber-500 cursor-pointer shrink-0"
                                    >
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label={ins.isBookmarked ? "Remove bookmark" : "Bookmark signal"}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          onToggleBookmark(ins.id, !!ins.isBookmarked)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            onToggleBookmark(ins.id, !!ins.isBookmarked)
                                          }
                                        }}
                                      >
                                        <Star
                                          className={cn("size-3.5", ins.isBookmarked ? "fill-amber-500 text-amber-500" : "")}
                                        />
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {ins.isBookmarked ? "Remove Bookmark" : "Bookmark Signal"}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="size-6.5 rounded-md text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                                    >
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Dismiss signal"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          onDismiss(ins.id)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            onDismiss(ins.id)
                                          }
                                        }}
                                      >
                                        <X className="size-3.5" />
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    Dismiss Signal
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </ItemContent>
                        </Link>
                      </Item>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-72 max-w-[calc(100vw-2rem)] text-xs rounded-xl border border-border/40 shadow-lg p-3 bg-popover"
                      align="start"
                      side="top"
                    >
                      <div className="flex items-start gap-2 mb-1.5">
                        <div className={cn("size-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5", iconColor)}>
                          <Icon className="size-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground leading-snug wrap-break-word">{ins.title}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] font-bold px-1.5 py-0 h-4 rounded-sm shrink-0", sevBadge.className)}
                        >
                          {sevBadge.label}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground leading-snug text-[11px] mb-2 wrap-break-word">
                        {ins.description}
                      </p>

                      {(ins.metricImpact || ins.metricLabel) && (
                        <div className="flex items-center justify-between text-[11px] border-t border-border/20 pt-1.5 text-muted-foreground font-medium">
                          <span>{ins.metricLabel ? "Metric" : "Impact"}</span>
                          <span className={cn("font-bold font-mono", isCritical ? "text-rose-500" : "text-emerald-500")}>
                            {ins.metricImpact ? formatCurrency(ins.metricImpact, currency) : ins.metricLabel}
                          </span>
                        </div>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <Empty className="py-10">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
              <CheckCircle2 className="size-6" />
            </div>
            <EmptyHeader>
              <EmptyTitle className="text-sm">No Urgent Signals</EmptyTitle>
              <EmptyDescription className="text-xs max-w-sm">
                All spending categories, subscriptions, and cashflow patterns are within normal baselines.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}
