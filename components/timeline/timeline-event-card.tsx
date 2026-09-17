"use client"

import React from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { formatCurrency, cn } from "@/lib/utils"
import type { TimelineEvent } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
import {
  Trophy,
  Target,
  HandCoins,
  CheckCheck,
  CheckCircle2,
  Receipt,
  Repeat,
  Sparkles,
  TrendingUp,
  Users2,
  Building2,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  ExternalLink,
  Milestone,
} from "lucide-react"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Target,
  HandCoins,
  CheckCheck,
  CheckCircle2,
  Receipt,
  Repeat,
  Sparkles,
  TrendingUp,
  Users2,
  Building2,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  Milestone,
}

interface TimelineEventCardProps {
  event: TimelineEvent
}

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  const IconComponent = ICON_MAP[event.iconName] || History

  const isMilestone = event.isMilestone
  const dateObj = parseISO(event.date)
  const formattedTime = format(dateObj, "h:mm a")

  let iconStyle = "bg-muted text-muted-foreground border-border/40"
  if (isMilestone) {
    iconStyle = "bg-amber-500/10 text-amber-500 border-amber-500/30 ring-2 ring-amber-500/20"
  } else if (event.impact === "inflow") {
    iconStyle = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
  } else if (event.impact === "outflow") {
    iconStyle = "bg-rose-500/10 text-rose-500 border-rose-500/30"
  }

  return (
    <Item
      variant="outline"
      className={cn(
        "relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl transition-all duration-150 shadow-2xs",
        isMilestone
          ? "bg-gradient-to-r from-amber-500/5 via-card to-card border-amber-500/30 hover:border-amber-500/50"
          : "bg-card border-border/50 hover:border-border/80 hover:bg-muted/15"
      )}
    >
      {/* Left: Icon, Title, Description, Badges */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <ItemMedia
          className={cn(
            "size-10 rounded-xl flex items-center justify-center border shrink-0 shadow-xs transition-transform duration-150 group-hover:scale-105",
            iconStyle
          )}
        >
          <IconComponent className="size-5" />
        </ItemMedia>

        <ItemContent className="gap-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ItemTitle
              className={cn(
                "text-sm font-semibold tracking-tight line-clamp-1",
                isMilestone ? "text-amber-600 dark:text-amber-400 font-bold" : "text-foreground"
              )}
            >
              {event.title}
            </ItemTitle>

            {event.badge && (
              <Badge
                variant={event.badge.variant === "success" ? "outline" : event.badge.variant || "outline"}
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-semibold shrink-0 uppercase tracking-wider",
                  event.badge.variant === "success" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                  isMilestone && "border-amber-500/40 text-amber-600 bg-amber-500/15 font-bold"
                )}
              >
                {event.badge.label}
              </Badge>
            )}

            {isMilestone && (
              <span className="text-[10px] inline-flex items-center text-amber-500 font-bold">
                ⭐
              </span>
            )}
          </div>

          <ItemDescription className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
            {event.description}
          </ItemDescription>

          <span className="text-[10px] font-mono text-muted-foreground/60">
            {formattedTime} • {format(dateObj, "MMM d, yyyy")}
          </span>
        </ItemContent>
      </div>

      {/* Right: Amount & Action Link */}
      <ItemActions className="flex items-center justify-between sm:justify-end gap-3 shrink-0 sm:border-l sm:border-border/30 sm:pl-4 pt-2 sm:pt-0 border-t border-border/20 sm:border-t-0">
        {event.amount !== undefined && (
          <div className="flex flex-col sm:items-end">
            <span
              className={cn(
                "text-sm font-bold font-mono tracking-tight tabular-nums",
                event.impact === "inflow" && "text-emerald-600 dark:text-emerald-400",
                event.impact === "outflow" && "text-foreground",
                event.impact === "neutral" && "text-muted-foreground",
                event.impact === "milestone" && "text-amber-600 dark:text-amber-400"
              )}
            >
              {event.impact === "inflow" ? "+" : event.impact === "outflow" ? "-" : ""}
              {formatCurrency(event.amount, event.currency || "USD")}
            </span>
          </div>
        )}

        {event.href && (
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            <Link href={event.href} className="flex items-center gap-1">
              <span className="hidden sm:inline">Details</span>
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        )}
      </ItemActions>
    </Item>
  )
}
