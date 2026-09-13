"use client"

import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  CalendarDaySummary,
  CalendarEventItem,
} from "@/types"
import {
  CheckCircle2,
  Trash2,
  Plus,
  AlertCircle,
  Receipt,
  Repeat,
  Sparkles,
  CreditCard,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { deleteCalendarPlanAction } from "@/lib/actions/calendar"

interface CalendarDaySheetProps {
  day: CalendarDaySummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  onAddPlanForDate: (date: string) => void
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

export function CalendarDaySheet({
  day,
  open,
  onOpenChange,
  currency,
  onAddPlanForDate,
}: CalendarDaySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!day) return null

  const dateObj = parseISO(day.date)
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy")

  const handleDeletePlan = async (id: string) => {
    try {
      setDeletingId(id)
      await deleteCalendarPlanAction(id)
      toast.success("Planned event removed")
    } catch {
      toast.error("Failed to delete event")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-lg font-bold">{formattedDate}</SheetTitle>
            {day.isToday && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                Today
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs mt-1">
            Projected End-of-Day Balance:{" "}
            <span
              className={
                day.isDeficit
                  ? "font-extrabold text-rose-500"
                  : "font-extrabold text-foreground"
              }
            >
              {formatCurrency(day.closingBalance, currency)}
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* Day Flow Banner */}
        <div className="grid grid-cols-2 gap-2 p-4 bg-muted/40 border-b border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Total Inflow
            </span>
            <span className="text-emerald-500 font-extrabold text-sm">
              +{formatCurrency(day.totalInflow, currency)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Total Outflow
            </span>
            <span className="text-rose-500 font-extrabold text-sm">
              -{formatCurrency(day.totalOutflow, currency)}
            </span>
          </div>
        </div>

        {/* Events Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {day.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground">
              <CheckCircle2 className="size-8 stroke-[1.5] mb-2 opacity-50 text-emerald-500" />
              <p className="text-xs font-semibold">No scheduled commitments</p>
              <p className="text-[11px] mt-0.5">Your cash flow is steady on this day.</p>
            </div>
          ) : (
            day.events.map((evt) => {
              const Icon = getEventIcon(evt.type)
              const isInflow = evt.flow === "inflow"
              const isDeleting = deletingId === evt.sourceId

              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={
                        isInflow
                          ? "size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
                          : "size-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"
                      }
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-foreground">
                        {evt.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="capitalize">{evt.type}</span>
                        {evt.walletName && <span>• {evt.walletName}</span>}
                        {evt.status === "overdue" && (
                          <span className="text-rose-500 font-bold flex items-center gap-0.5">
                            <AlertCircle className="size-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={
                        isInflow
                          ? "text-xs font-black text-emerald-500"
                          : "text-xs font-black text-rose-500"
                      }
                    >
                      {isInflow ? "+" : "-"}
                      {formatCurrency(evt.convertedAmount, currency)}
                    </span>

                    {evt.type === "plan" && evt.sourceId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePlan(evt.sourceId!)}
                        disabled={isDeleting}
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 cursor-pointer"
                        title="Delete planned event"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-card flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddPlanForDate(day.date)}
            className="w-full rounded-xl font-bold text-xs gap-1.5 h-9 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Add Planned Event on this Day
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
