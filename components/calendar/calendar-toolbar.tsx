"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { addMonths, format, parseISO } from "date-fns"

interface CalendarToolbarProps {
  currentMonth: string // YYYY-MM
  onMonthChange: (month: string) => void
  walletMode: "liquid" | "all"
  onWalletModeChange: (mode: "liquid" | "all") => void
  viewMode: "grid" | "agenda"
  onViewModeChange: (view: "grid" | "agenda") => void
}

export function CalendarToolbar({
  currentMonth,
  onMonthChange,
  walletMode,
  onWalletModeChange,
  viewMode,
  onViewModeChange,
}: CalendarToolbarProps) {
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
      {/* ── Left: Month Navigator & Today ── */}
      <div className="flex items-center gap-2">
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

          <span className="text-xs font-bold px-3 min-w-[120px] text-center select-none text-foreground">
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
      </div>

      {/* ── Right: Cash Mode & View Toggle Pills ── */}
      <div className="flex items-center gap-2">
        {/* Liquid vs All Accounts Toggle */}
        <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <button
            onClick={() => onWalletModeChange("liquid")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
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
              "rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
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
      </div>
    </div>
  )
}
