"use client"

import React from "react"
import { CalendarDaySummary } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { AlertCircle, ChevronRight } from "lucide-react"

interface CalendarAgendaListProps {
  days: CalendarDaySummary[]
  currency: string
  onSelectDay: (day: CalendarDaySummary) => void
}

export function CalendarAgendaList({ days, currency, onSelectDay }: CalendarAgendaListProps) {
  // Only show days that have events or are today
  const activeDays = days.filter((d) => d.events.length > 0 || d.isToday)

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/50 bg-card">
        <p className="text-sm font-semibold text-foreground">No events scheduled this month</p>
        <p className="text-xs text-muted-foreground mt-1">Use &quot;+ Add Planned&quot; to simulate future expenses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {activeDays.map((day) => {
        const dateObj = parseISO(day.date)
        const dateHeader = format(dateObj, "EEE, MMM d")

        return (
          <div
            key={day.date}
            role="button"
            tabIndex={0}
            onClick={() => onSelectDay(day)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelectDay(day)
              }
            }}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all cursor-pointer gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  day.isToday
                    ? "size-10 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0 font-extrabold text-xs"
                    : "size-10 rounded-xl bg-muted text-foreground flex flex-col items-center justify-center shrink-0 font-bold text-xs"
                }
              >
                <span>{day.dayOfMonth}</span>
              </div>

              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  {dateHeader}
                  {day.isToday && (
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-bold">
                      Today
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {day.events.length} {day.events.length === 1 ? "event" : "events"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Projected Balance
                </div>
                <div
                  className={
                    day.isDeficit
                      ? "text-xs font-black text-rose-500 flex items-center gap-0.5 justify-end"
                      : "text-xs font-black text-foreground"
                  }
                >
                  {day.isDeficit && <AlertCircle className="size-3" />}
                  {formatCurrency(day.closingBalance, currency)}
                </div>
              </div>

              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
