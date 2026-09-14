"use client"

import React from "react"
import { CalendarDaySummary, CalendarEventItem } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface CalendarMonthGridProps {
  days: CalendarDaySummary[]
  currency: string
  onSelectDay: (day: CalendarDaySummary) => void
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarMonthGrid({ days, currency, onSelectDay }: CalendarMonthGridProps) {
  return (
    <div className="flex flex-col w-full rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/40 text-center py-2 sm:py-2.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {w}
          </div>
        ))}
      </div>

      {/* 7-Col Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/40">
        {days.map((day) => {
          const visibleEvents: CalendarEventItem[] = day.events.slice(0, 3)
          const overflowCount = Math.max(0, day.events.length - 3)

          const hasInflow = day.events.some((e) => e.flow === "inflow")
          const hasOutflow = day.events.some((e) => e.flow === "outflow")
          const hasOverdue = day.events.some((e) => e.status === "overdue")

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
              className={cn(
                "min-h-[62px] sm:min-h-[85px] md:min-h-[105px] p-1 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-muted/30 relative text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                !day.isCurrentMonth && "bg-muted/10 opacity-40",
                day.isToday && "ring-2 ring-primary/40 bg-primary/[0.02]",
                day.isDeficit && "bg-rose-500/[0.04]"
              )}
            >
              {/* Day Header: Day Number & Balance */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className={cn(
                    "text-[11px] sm:text-xs font-bold size-5 sm:size-6 flex items-center justify-center rounded-full transition-colors",
                    day.isToday
                      ? "bg-primary text-primary-foreground font-black"
                      : "text-foreground group-hover:text-primary"
                  )}
                >
                  {day.dayOfMonth}
                </span>

                {/* Desktop: Full Currency String */}
                <span
                  className={cn(
                    "hidden sm:inline-flex text-[10px] font-black tabular-nums truncate items-center gap-0.5",
                    day.isDeficit
                      ? "text-rose-500"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {day.isDeficit && <AlertCircle className="size-2.5 shrink-0" />}
                  {formatCurrency(day.closingBalance, currency)}
                </span>

                {/* Mobile: Micro Deficit Indicator only */}
                {day.isDeficit && (
                  <span className="sm:hidden text-rose-500 inline-flex items-center" title="Projected deficit">
                    <AlertCircle className="size-3 shrink-0" />
                  </span>
                )}
              </div>

              {/* ── Desktop View: Full-Text Event Chips (>= md) ── */}
              <div className="hidden md:flex flex-col gap-1 my-1 flex-1 justify-start">
                {visibleEvents.map((evt) => {
                  const isInflow = evt.flow === "inflow"

                  return (
                    <div
                      key={evt.id}
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate flex items-center justify-between gap-1",
                        isInflow
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      )}
                    >
                      <span className="truncate">{evt.title}</span>
                      <span className="font-bold shrink-0 tabular-nums">
                        {isInflow ? "+" : "-"}{formatCurrency(evt.convertedAmount, currency)}
                      </span>
                    </div>
                  )
                })}

                {overflowCount > 0 && (
                  <span className="text-[9px] font-bold text-muted-foreground px-1">
                    +{overflowCount} more
                  </span>
                )}
              </div>

              {/* ── Mobile View: Compact Event Dots (< md) ── */}
              <div className="flex md:hidden items-center justify-center gap-1 my-1 flex-wrap min-h-[12px]">
                {day.events.slice(0, 4).map((evt, idx) => {
                  const isInflow = evt.flow === "inflow"
                  const isOverdue = evt.status === "overdue"

                  return (
                    <span
                      key={evt.id || idx}
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        isOverdue
                          ? "bg-amber-500 ring-1 ring-amber-500/50 animate-pulse"
                          : isInflow
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      )}
                    />
                  )
                })}
                {day.events.length > 4 && (
                  <span className="text-[8px] font-black text-muted-foreground leading-none">
                    +{day.events.length - 4}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
