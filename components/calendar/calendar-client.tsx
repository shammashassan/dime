"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CashFlowMonthOverview, CalendarDaySummary } from "@/types"
import { CalendarHeader } from "./calendar-header"
import { CalendarMetricsRow } from "./calendar-metrics-row"
import { CalendarMonthGrid } from "./calendar-month-grid"
import { CalendarAgendaList } from "./calendar-agenda-list"
import { CalendarDaySheet } from "./calendar-day-sheet"
import { PlanEventDialog } from "./plan-event-dialog"

interface CalendarClientProps {
  data: CashFlowMonthOverview
  initialMode?: "liquid" | "all"
}

export function CalendarClient({ data, initialMode = "liquid" }: CalendarClientProps) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<CalendarDaySummary | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [addPlanDefaultDate, setAddPlanDefaultDate] = useState<string | undefined>(undefined)
  const [walletMode, setWalletMode] = useState<"liquid" | "all">(initialMode)
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid")

  useEffect(() => {
    if (initialMode && initialMode !== walletMode) {
      setWalletMode(initialMode)
    }
  }, [initialMode])

  const handleMonthChange = (newMonth: string) => {
    router.push(`/calendar?month=${newMonth}&mode=${walletMode}`)
  }

  const handleWalletModeChange = (newMode: "liquid" | "all") => {
    setWalletMode(newMode)
    router.push(`/calendar?month=${data.month}&mode=${newMode}`)
  }

  const handleSelectDay = (day: CalendarDaySummary) => {
    setSelectedDay(day)
    setIsSheetOpen(true)
  }

  const handleAddPlanForDate = (date: string) => {
    setAddPlanDefaultDate(date)
    setIsAddPlanOpen(true)
  }

  // Keep selectedDay synced with fresh data if data updates while sheet is open
  const currentSelectedDay = selectedDay
    ? data.days.find((d) => d.date === selectedDay.date) ?? selectedDay
    : null

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Header & Navigator */}
      <CalendarHeader
        currentMonth={data.month}
        onMonthChange={handleMonthChange}
        walletMode={walletMode}
        onWalletModeChange={handleWalletModeChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddPlan={() => {
          setAddPlanDefaultDate(undefined)
          setIsAddPlanOpen(true)
        }}
        currency={data.targetCurrency}
      />

      {/* 2. Top Bento Metrics Row */}
      <CalendarMetricsRow overview={data} />

      {/* 3. Main Calendar Body: Month Grid or Agenda List */}
      {viewMode === "grid" ? (
        <CalendarMonthGrid
          days={data.days}
          currency={data.targetCurrency}
          onSelectDay={handleSelectDay}
        />
      ) : (
        <CalendarAgendaList
          days={data.days}
          currency={data.targetCurrency}
          onSelectDay={handleSelectDay}
        />
      )}

      {/* 4. Day Details Sheet */}
      <CalendarDaySheet
        day={currentSelectedDay}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        currency={data.targetCurrency}
        onAddPlanForDate={handleAddPlanForDate}
      />

      {/* 5. Add Planned Event Dialog */}
      <PlanEventDialog
        open={isAddPlanOpen}
        onOpenChange={setIsAddPlanOpen}
        defaultDate={addPlanDefaultDate}
        currency={data.targetCurrency}
      />
    </div>
  )
}
