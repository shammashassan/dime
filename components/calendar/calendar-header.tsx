"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { addMonths, format, parseISO } from "date-fns"

interface CalendarHeaderProps {
  currentMonth: string // YYYY-MM
  onMonthChange: (month: string) => void
  walletMode: "liquid" | "all"
  onWalletModeChange: (mode: "liquid" | "all") => void
  viewMode: "grid" | "agenda"
  onViewModeChange: (view: "grid" | "agenda") => void
  onOpenAddPlan: () => void
  currency: string
}

export function CalendarHeader({
  currentMonth,
  onMonthChange,
  walletMode,
  onWalletModeChange,
  viewMode,
  onViewModeChange,
  onOpenAddPlan,
  currency,
}: CalendarHeaderProps) {
  const currentDate = parseISO(`${currentMonth}-01`)
  const monthLabel = format(currentDate, "MMMM yyyy")

  const handlePrev = () => {
    onMonthChange(format(addMonths(currentDate, -1), "yyyy-MM"))
  }

  const handleNext = () => {
    onMonthChange(format(addMonths(currentDate, 1), "yyyy-MM"))
  }

  const handleToday = () => {
    onMonthChange(format(new Date(), "yyyy-MM"))
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* ── Title & Meta ── */}
      <div className="flex items-start gap-3.5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
          <CalendarDays className="size-6" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Cash Flow Calendar
            </h1>
            <HoverCard openDelay={150}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  tabIndex={0}
                  className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
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

      {/* ── Month & Action Controls ── */}
      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
        {/* Month Navigator */}
        <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-2xl border border-border/40 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            aria-label="Previous month"
            className="size-7 rounded-xl hover:bg-background cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="text-xs font-bold px-2 min-w-[100px] text-center select-none">
            {monthLabel}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            aria-label="Next month"
            className="size-7 rounded-xl hover:bg-background cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="rounded-xl font-bold text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9 px-3"
        >
          Today
        </Button>

        {/* Liquid vs All Toggle */}
        <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <button
            onClick={() => onWalletModeChange("liquid")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              walletMode === "liquid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Liquid Cash
          </button>
          <button
            onClick={() => onWalletModeChange("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              walletMode === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Accounts
          </button>
        </div>

        {/* Grid vs Agenda Toggle */}
        <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <button
            onClick={() => onViewModeChange("grid")}
            aria-label="Calendar Grid View"
            className={cn(
              "size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="size-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("agenda")}
            aria-label="Agenda Feed View"
            className={cn(
              "size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
              viewMode === "agenda"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3.5" />
          </button>
        </div>

        {/* Add Plan Button */}
        <Button
          onClick={onOpenAddPlan}
          size="sm"
          className="rounded-xl font-bold gap-1.5 text-xs h-9 cursor-pointer shadow-sm"
        >
          <Plus className="size-3.5" />
          Add Planned
        </Button>
      </div>
    </div>
  )
}
