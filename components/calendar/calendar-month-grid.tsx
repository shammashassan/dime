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

function formatGridBalance(amountInCents: number, currency: string = "USD") {
  const abs = Math.abs(amountInCents) / 100
  const isNegative = amountInCents < 0
  const prefix = isNegative ? "-" : ""

  if (abs >= 1_000_000) {
    return `${prefix}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(abs)}`
  }
  if (abs >= 10_000) {
    return `${prefix}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(abs)}`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amountInCents / 100)
}

export function CalendarMonthGrid({ days, currency, onSelectDay }: CalendarMonthGridProps) {
  return (
    <div className="flex flex-col w-full rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30 text-center py-2 sm:py-2.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {w}
          </div>
        ))}
      </div>

      {/* 7-Col Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/40">
        {days.map((day) => {
          const visibleEvents: CalendarEventItem[] = day.events.slice(0, 3)
          const overflowCount = Math.max(0, day.events.length - 3)

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
                "min-h-[68px] sm:min-h-[92px] md:min-h-[114px] p-1.5 sm:p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer group relative text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring select-none overflow-hidden",
                !day.isCurrentMonth
                  ? "bg-muted/15 dark:bg-muted/5 opacity-40 hover:opacity-75"
                  : "bg-card hover:bg-muted/30 dark:hover:bg-muted/20",
                day.isToday && "bg-primary/[0.03]",
                day.isDeficit && "bg-rose-500/[0.03]"
              )}
            >
              {/* ── Day Header: Day Number & Responsive Balance Pill ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 w-full min-w-0">
                <span
                  className={cn(
                    "text-xs size-5 sm:size-6 flex items-center justify-center rounded-full transition-colors shrink-0",
                    day.isToday
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-foreground/80 font-medium group-hover:text-foreground group-hover:bg-muted/60"
                  )}
                >
                  {day.dayOfMonth}
                </span>

                {/* Responsive Balance Display: Stacks on mobile, side-by-side on sm+ */}
                {day.isDeficit ? (
                  <span
                    className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-semibold tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 px-1 sm:px-1.5 py-0.5 rounded-md border border-rose-500/20 leading-none min-w-0 max-w-full truncate"
                    title={`Projected Deficit: ${formatCurrency(day.closingBalance, currency)}`}
                  >
                    <AlertCircle className="size-2 sm:size-2.5 shrink-0 text-rose-500" />
                    <span className="truncate">{formatGridBalance(day.closingBalance, currency)}</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex text-[9px] sm:text-[10px] font-mono tabular-nums text-muted-foreground/70 group-hover:text-foreground transition-colors leading-none min-w-0 max-w-full truncate"
                    title={`Projected Balance: ${formatCurrency(day.closingBalance, currency)}`}
                  >
                    <span className="truncate">{formatGridBalance(day.closingBalance, currency)}</span>
                  </span>
                )}
              </div>

              {/* ── Desktop View: Linear-Style Event Chips (>= md) ── */}
              <div className="hidden md:flex flex-col gap-1 my-1.5 flex-1 justify-start">
                {visibleEvents.map((evt) => {
                  const isInflow = evt.flow === "inflow"
                  const isPlan = evt.type === "plan"
                  const isOverdue = evt.status === "overdue"

                  return (
                    <div
                      key={evt.id}
                      className={cn(
                        "group/chip text-[10px] px-1.5 py-0.5 rounded-md truncate flex items-center justify-between gap-1.5 transition-all duration-100 shadow-2xs",
                        isPlan
                          ? "bg-violet-500/5 hover:bg-violet-500/10 border border-dashed border-violet-500/30 text-foreground"
                          : isInflow
                          ? "bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-foreground"
                          : "bg-muted/40 hover:bg-muted/70 border border-border/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            isOverdue
                              ? "bg-amber-500 ring-2 ring-amber-500/40 animate-pulse"
                              : isPlan
                              ? "bg-violet-500"
                              : isInflow
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          )}
                        />
                        <span className="truncate font-normal text-foreground/90">
                          {evt.title}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "font-medium tabular-nums shrink-0 text-[9px]",
                          isPlan
                            ? "text-violet-600 dark:text-violet-400"
                            : isInflow
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground group-hover/chip:text-foreground"
                        )}
                      >
                        {isInflow ? "+" : "-"}
                        {formatCurrency(evt.convertedAmount, currency)}
                      </span>
                    </div>
                  )
                })}

                {overflowCount > 0 && (
                  <span className="text-[9px] font-medium text-muted-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted px-1.5 py-0.5 rounded-md w-fit transition-colors leading-tight">
                    +{overflowCount} more
                  </span>
                )}
              </div>

              {/* ── Mobile View: Compact Event Dots (< md) ── */}
              <div className="flex md:hidden items-center justify-center gap-1 my-1 flex-wrap min-h-[12px]">
                {day.events.slice(0, 4).map((evt, idx) => {
                  const isInflow = evt.flow === "inflow"
                  const isPlan = evt.type === "plan"
                  const isOverdue = evt.status === "overdue"

                  return (
                    <span
                      key={evt.id || idx}
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        isOverdue
                          ? "bg-amber-500 ring-1 ring-amber-500/50 animate-pulse"
                          : isPlan
                          ? "bg-violet-500 ring-1 ring-violet-500/40"
                          : isInflow
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      )}
                    />
                  )
                })}
                {day.events.length > 4 && (
                  <span className="text-[8px] font-medium text-muted-foreground bg-muted/60 px-1 py-0.2 rounded-full leading-none">
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
