"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { CalendarDays, Plus } from "lucide-react"

interface CalendarHeaderProps {
  onOpenAddPlan: () => void
  currency: string
}

export function CalendarHeader({
  onOpenAddPlan,
  currency,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* ── Title & Meta ── */}
      <div className="flex items-start gap-3.5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
          <CalendarDays className="size-6" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cash Flow Calendar
            </h1>
            <HoverCard openDelay={150}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  tabIndex={0}
                  className="rounded-md border-primary/30 text-primary bg-primary/5 font-medium text-[10px] h-5 cursor-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {currency}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3"
                align="start"
                side="top"
              >
                All projections and daily running balances are normalized in {currency}.
              </HoverCardContent>
            </HoverCard>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize day-by-day cash trajectory, upcoming bills, subscriptions, and liquidity.
          </p>
        </div>
      </div>

      {/* ── Primary Action Button ── */}
      <div className="flex items-center gap-2 self-start md:self-center">
        <Button
          onClick={onOpenAddPlan}
          size="sm"
          className="rounded-xl font-medium gap-1.5 text-xs h-9 cursor-pointer shadow-sm"
        >
          <Plus className="size-3.5" />
          Add Planned
        </Button>
      </div>
    </div>
  )
}
