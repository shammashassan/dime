"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange | undefined
  onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date: controlledDate,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(controlledDate)

  React.useEffect(() => {
    setDate(controlledDate)
  }, [controlledDate])

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate)
    if (!newDate) {
      onDateChange?.(undefined)
    } else if (newDate.from && newDate.to) {
      onDateChange?.(newDate)
    }
  }

  return (
    <Field className={cn("w-auto", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id="date-picker-range"
              className="justify-start px-2.5 font-normal h-10 rounded-xl border-border/40 bg-card text-xs font-semibold gap-2 hover:bg-muted/50 cursor-pointer shadow-sm"
            >
              <CalendarIcon className="size-4 text-muted-foreground" data-icon="inline-start" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
              {date?.from && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(undefined)
                  }}
                  className="ml-1 rounded-full hover:bg-muted p-0.5 cursor-pointer"
                  title="Clear date range"
                >
                  <X className="size-3 text-muted-foreground hover:text-foreground" />
                </span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
