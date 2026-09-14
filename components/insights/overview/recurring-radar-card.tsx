"use client"

import * as React from "react"
import Link from "next/link"
import type { SpendingInsight } from "@/types"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"
import { Repeat, CheckCircle2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface RecurringRadarCardProps {
  insights: SpendingInsight[]
  currency?: string
}

export function RecurringRadarCard({ insights, currency = "USD" }: RecurringRadarCardProps) {
  const subscriptions = React.useMemo(() => {
    return insights.filter((i) => i.category === "subscriptions")
  }, [insights])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="size-3.5 text-purple-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Subscriptions Radar
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4.5 rounded-md">
          {subscriptions.length} {subscriptions.length === 1 ? "alert" : "alerts"}
        </Badge>
      </div>

      {/* ── Body (No extra top spacing, starts immediately below header) ── */}
      <div className="flex-1 min-h-0">
        {subscriptions.length > 0 ? (
          <ScrollArea className="max-h-[220px] pr-3 pl-2.5">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2 w-full min-w-0">
              {subscriptions.map((sub) => {
                const href = sub.actionUrl || "/recurring"
                const isCritical = sub.severity === "critical"

                // Clean, punchy title
                const cleanTitle = sub.title
                  .replace(/\s*detected\b/i, "")
                  .replace(/\s*subscription\b/i, "")
                  .replace(/\s*alert\b/i, "")
                  .trim() || sub.title

                // Crisp subtitle that never gets cut off
                const cleanDesc = isCritical
                  ? "Price increase alert"
                  : sub.description.toLowerCase().includes("duplicate")
                  ? "Duplicate charge alert"
                  : "Recurring monthly rule"

                const displayValue = sub.metricImpact
                  ? formatCurrency(sub.metricImpact, currency)
                  : sub.metricLabel || "Active"
                const secondaryLabel = "monthly"

                return (
                  <HoverCard key={sub.id} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Item
                        asChild
                        className="cursor-pointer px-2.5 py-2 hover:bg-muted/60 transition-colors rounded-xl"
                      >
                        <Link href={href} className="w-full flex items-start 2xl:items-center justify-between gap-2.5 min-w-0">
                          <ItemMedia className="size-7 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 mt-0.5 2xl:mt-0">
                            <Repeat className="size-3.5" />
                          </ItemMedia>
                          <ItemContent className="min-w-0 flex-1">
                            <ItemTitle className="font-bold text-xs text-foreground leading-snug line-clamp-2 break-words">
                              {cleanTitle}
                            </ItemTitle>
                            <ItemDescription className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mt-0.5 block break-words">
                              {cleanDesc}
                            </ItemDescription>

                            {/* Amount & Label below title and description on smaller/narrow widths (< 2xl) */}
                            <div className="flex 2xl:hidden items-center justify-between gap-2 pt-1 mt-1 border-t border-border/10">
                              <span className="font-bold text-xs tabular-nums text-purple-500">
                                {displayValue}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {secondaryLabel}
                              </span>
                            </div>
                          </ItemContent>

                          {/* Amount & Label on right for wide 2xl+ screens */}
                          <ItemActions className="hidden 2xl:flex text-right shrink-0 pl-1.5 flex-col items-end gap-0.5">
                            <span className="font-bold text-xs tabular-nums text-purple-500 block leading-tight">
                              {displayValue}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight block">
                              {secondaryLabel}
                            </span>
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
                        <div className="size-6 rounded-md border bg-purple-500/10 border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Repeat className="size-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground leading-snug break-words">{sub.title}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0 h-4 rounded-sm shrink-0 ${
                            isCritical
                              ? "border-red-500/30 bg-red-500/10 text-red-500"
                              : "border-purple-500/30 bg-purple-500/10 text-purple-500"
                          }`}
                        >
                          {sub.severity}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground leading-snug text-[11px] mb-2 break-words">
                        {sub.description}
                      </p>

                      {sub.metricImpact ? (
                        <div className="flex items-center justify-between text-[11px] border-t border-border/20 pt-1.5 text-muted-foreground font-medium">
                          <span>Cost Impact</span>
                          <span className="font-bold font-mono text-purple-500">
                            {formatCurrency(sub.metricImpact, currency)}/mo
                          </span>
                        </div>
                      ) : null}
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-8 text-center flex flex-col items-center justify-center gap-1.5 h-[180px]">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <span className="font-medium text-foreground text-xs">Subscriptions Optimized</span>
            <span className="text-[11px] text-muted-foreground max-w-[200px]">
              No duplicate charges, orphan renewals, or unexpected price hikes detected.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
