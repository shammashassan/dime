"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
} from "lucide-react"
import { cn } from "cn"
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

          <span className="text-xs font-semibold px-3 min-w-[120px] text-center select-none text-foreground">
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
          className="rounded-xl font-medium text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9 px-3"
        >
          Today
        </Button>
      </div>

      {/* ── Right: Cash Mode & View Toggle Pills ── */}
      <div className="flex items-center gap-2">
        {/* Liquid vs All Accounts Toggle */}
        <Tabs value={walletMode} onValueChange={(v) => { if (v) onWalletModeChange(v as "liquid" | "all") }}>
          <TabsList>
            <TabsTrigger value="liquid">Liquid Cash</TabsTrigger>
            <TabsTrigger value="all">All Accounts</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Grid vs Agenda Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => { if (v) onViewModeChange(v as "grid" | "agenda") }}>
          <TabsList>
            <TabsTrigger value="grid" aria-label="Calendar Grid View" className="size-7 p-0 flex-none">
              <Calendar className="size-3.5" />
            </TabsTrigger>
            <TabsTrigger value="agenda" aria-label="Agenda Feed View" className="size-7 p-0 flex-none">
              <List className="size-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
