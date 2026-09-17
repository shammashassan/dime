"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Compass,
  SlidersHorizontal,
  MessageSquare,
  ShieldAlert,
} from "lucide-react"

interface CoachHeaderProps {
  currency: string
  onOpenSimulator: () => void
  onOpenChat: () => void
}

export function CoachHeader({
  currency,
  onOpenSimulator,
  onOpenChat,
}: CoachHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* ── Title & Badges ── */}
      <div className="flex items-start gap-3.5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
          <Compass className="size-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Financial Coach
            </h1>

            {/* Currency Badge */}
            <HoverCard openDelay={150}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default"
                >
                  {currency}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3"
                align="start"
                side="bottom"
              >
                Calculations, debt payoffs, and goal models are presented in your base currency ({currency}).
              </HoverCardContent>
            </HoverCard>

            {/* Educational Guidance Disclaimer — Popover for reliable mobile touch + desktop click */}
            <Popover>
              <PopoverTrigger asChild>
                <Badge
                  variant="outline"
                  className="rounded-md border-border/50 text-muted-foreground hover:text-foreground bg-muted/30 font-medium text-[10px] h-5 gap-1 cursor-pointer transition-colors"
                >
                  <ShieldAlert className="size-3 text-primary" />
                  <span>Guidance Only</span>
                </Badge>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 text-xs rounded-xl border border-border/40 shadow-lg p-3 bg-popover"
                align="start"
                side="bottom"
              >
                <div className="flex items-start gap-2.5">
                  <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="size-3.5" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="font-bold text-foreground">Educational Guidance Only</span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      Dime Coach provides automated mathematical simulations and budgeting suggestions, never formal financial, tax, or investment advice.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated optimization strategies, debt freedom modeling, and personal financial coaching.
          </p>
        </div>
      </div>

      {/* ── Action Buttons (Matching investments page: drops below header on < md, right-aligned) ── */}
      <div className="flex items-center justify-start md:justify-end gap-2.5 flex-wrap w-full md:w-auto shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSimulator}
          className="rounded-xl font-bold gap-2 text-xs border-border/60 hover:bg-muted/40 cursor-pointer h-9 shadow-xs flex-1 sm:flex-initial"
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Simulate What-If</span>
        </Button>

        <Button
          size="sm"
          onClick={onOpenChat}
          className="rounded-xl font-bold gap-2 text-xs cursor-pointer h-9 shadow-sm flex-1 sm:flex-initial"
        >
          <MessageSquare className="size-3.5" />
          <span>Ask Coach</span>
        </Button>
      </div>
    </div>
  )
}
