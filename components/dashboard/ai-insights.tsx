import React from "react"
import Link from "next/link"
import { getFinancialInsightsData } from "@/lib/queries/insights"
import type { SpendingInsight, InsightSeverity, InsightCategory } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { cn, formatCurrency } from "@/lib/utils"
import {
  ItemGroup,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
import {
  Sparkles,
  AlertTriangle,
  Flame,
  PiggyBank,
  Repeat,
  ArrowUpRight,
  TrendingDown,
  Info,
} from "lucide-react"

interface AIInsightsProps {
  userId: string
  className?: string
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
      return ins.description.length > 55 ? `${ins.description.slice(0, 52)}…` : ins.description
  }
}

export async function AIInsights({ userId, className = "" }: AIInsightsProps) {
  const data = await getFinancialInsightsData(userId)
  const topInsights = data.insights.slice(0, 3)

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            actionable insights
          </span>
          {data.insights.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground">
              {data.insights.length} {data.insights.length === 1 ? "signal" : "signals"}
            </span>
          )}
        </div>
        <Link
          href="/insights"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0"
        >
          <span>View hub</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* ── Content List ── */}
      <div className="p-4 flex-1">
        {topInsights.length > 0 ? (
          <ScrollArea className="h-48 sm:h-[216px] pr-3.5">
            <ItemGroup className="gap-2">
              {topInsights.map((ins) => {
                const Icon = CATEGORY_ICONS[ins.category] || Info
                const iconColor = CATEGORY_STYLES[ins.category] || "text-primary bg-primary/10 border-primary/20"
                const sevBadge = SEVERITY_BADGES[ins.severity] || SEVERITY_BADGES.info
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
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-between p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors w-full min-w-0 cursor-pointer no-underline group overflow-hidden"
                      >
                        <Link href={href} className="flex items-center justify-between w-full min-w-0 gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <ItemMedia
                              className={cn(
                                "size-8.5 rounded-xl flex items-center justify-center shrink-0 border border-border/50",
                                iconColor
                              )}
                            >
                              <Icon className="size-4" />
                            </ItemMedia>
                            <ItemContent className="min-w-0 flex-1 gap-0">
                              <div className="flex items-center gap-1.5 min-w-0 w-full">
                                <ItemTitle className="text-xs font-bold text-foreground truncate block min-w-0 shrink group-hover:text-primary transition-colors">
                                  {cleanTitle}
                                </ItemTitle>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider h-3.5 shrink-0",
                                    sevBadge.className
                                  )}
                                >
                                  {sevBadge.label}
                                </Badge>
                              </div>
                              <ItemDescription className="text-[10px] text-muted-foreground truncate block min-w-0 mt-0.5">
                                {shortDesc}
                              </ItemDescription>
                            </ItemContent>
                          </div>
                          <ItemActions className="flex flex-col items-end shrink-0 text-right gap-0 ml-2">
                            <p className="text-xs font-semibold text-foreground tabular-nums">
                              {ins.metricLabel || "Signal"}
                            </p>
                            <Badge
                              variant="outline"
                              className="rounded-full px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider h-3.5 mt-1 bg-muted/40 text-muted-foreground border-border/60"
                            >
                              {ins.category}
                            </Badge>
                          </ItemActions>
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
                            {ins.metricImpact ? formatCurrency(ins.metricImpact, data.currency) : ins.metricLabel}
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
          <div className="flex flex-col items-center justify-center h-[168px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">All clear</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Spending is running in line with your 90-day baseline.
            </p>
            <Link
              href="/insights"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View insights hub</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}
