"use client"

import React from "react"
import { CalendarDaySummary, CalendarEventItem } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  ChevronRight,
  Receipt,
  Repeat,
  Sparkles,
  CreditCard,
  CheckCircle2,
} from "lucide-react"

interface CalendarAgendaListProps {
  days: CalendarDaySummary[]
  currency: string
  onSelectDay: (day: CalendarDaySummary) => void
}

function getEventIcon(type: CalendarEventItem["type"]) {
  switch (type) {
    case "bill":
      return Receipt
    case "subscription":
    case "recurring":
      return Repeat
    case "plan":
      return Sparkles
    case "loan":
      return CreditCard
    default:
      return Receipt
  }
}

export function CalendarAgendaList({ days, currency, onSelectDay }: CalendarAgendaListProps) {
  // Only show days that have events or are today
  const activeDays = days.filter((d) => d.events.length > 0 || d.isToday)

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/50 bg-card">
        <CheckCircle2 className="size-8 text-emerald-500 mb-2 opacity-70" />
        <p className="text-sm font-semibold text-foreground">No events scheduled this month</p>
        <p className="text-xs text-muted-foreground mt-1">Use &quot;+ Add Planned&quot; to pencil in future expenses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {activeDays.map((day) => {
        const dateObj = parseISO(day.date)
        const dateHeader = format(dateObj, "EEEE, MMMM d")

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
            className="flex flex-col p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all cursor-pointer gap-3 shadow-xs"
          >
            {/* ── Day Header ── */}
            <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={
                    day.isToday
                      ? "size-9 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0 font-extrabold text-xs shadow-xs"
                      : "size-9 rounded-xl bg-muted text-foreground flex flex-col items-center justify-center shrink-0 font-bold text-xs"
                  }
                >
                  <span>{day.dayOfMonth}</span>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
                    {dateHeader}
                    {day.isToday && (
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {day.events.length} {day.events.length === 1 ? "commitment" : "commitments"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground">
                    Projected Balance
                  </div>
                  <div
                    className={cn(
                      "text-xs sm:text-sm font-black tabular-nums flex items-center gap-1 justify-end",
                      day.isDeficit ? "text-rose-500" : "text-foreground"
                    )}
                  >
                    {day.isDeficit && <AlertCircle className="size-3 text-rose-500" />}
                    {formatCurrency(day.closingBalance, currency)}
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/60 shrink-0 hidden sm:block" />
              </div>
            </div>

            {/* ── Day Events Stream (Fully Visible on Mobile & Desktop) ── */}
            {day.events.length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic py-1 px-1">
                No scheduled commitments on this day.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {day.events.map((evt) => {
                  const Icon = getEventIcon(evt.type)
                  const isInflow = evt.flow === "inflow"

                  return (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "size-8 rounded-lg flex items-center justify-center shrink-0",
                            isInflow
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {evt.title}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                            <span className="capitalize font-semibold">{evt.type}</span>
                            {evt.category?.name && (
                              <span className="text-muted-foreground/80">• {evt.category.name}</span>
                            )}
                            {evt.walletName && (
                              <span className="text-muted-foreground/80">• {evt.walletName}</span>
                            )}
                            {evt.status === "overdue" && (
                              <span className="text-rose-500 font-bold inline-flex items-center gap-0.5">
                                <AlertCircle className="size-2.5" /> Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "text-xs sm:text-sm font-black tabular-nums",
                            isInflow
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {isInflow ? "+" : "-"}
                          {formatCurrency(evt.convertedAmount, currency)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
