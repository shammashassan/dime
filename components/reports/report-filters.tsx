"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

export function ReportFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Retrieve current active values from URL search params
  const paramMonthsCount = searchParams.get("monthsCount")
  const paramCategoryFrom = searchParams.get("categoryFrom")
  const paramCategoryTo = searchParams.get("categoryTo")

  const defaultMonthsCount = paramMonthsCount || "6"

  // Define date range state for the Popover Calendar
  const initialDateRange: DateRange | undefined = paramCategoryFrom && paramCategoryTo
    ? { from: new Date(paramCategoryFrom), to: new Date(paramCategoryTo) }
    : undefined

  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange)

  // Quick select value helper
  const getQuickSelectValue = () => {
    if (paramCategoryFrom && paramCategoryTo) {
      // Check if it matches "Last 30 Days"
      const now = new Date()
      const from = new Date(paramCategoryFrom)
      const to = new Date(paramCategoryTo)
      const diffTime = Math.abs(to.getTime() - from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 28 && diffDays <= 32) return "last30days"
      if (from.getFullYear() === now.getFullYear() && from.getMonth() === 0 && from.getDate() === 1 && to.getMonth() === 11 && to.getDate() === 31) {
        return "thisyear"
      }
      return "custom"
    }

    if (paramMonthsCount === "3") return "3months"
    if (paramMonthsCount === "6" || !paramMonthsCount) return "6months"
    if (paramMonthsCount === "12") return "12months"
    return ""
  }

  const handleQuickSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const now = new Date()

    if (value === "3months") {
      params.set("monthsCount", "3")
      params.delete("categoryFrom")
      params.delete("categoryTo")
      setDateRange(undefined)
    } else if (value === "6months") {
      params.set("monthsCount", "6")
      params.delete("categoryFrom")
      params.delete("categoryTo")
      setDateRange(undefined)
    } else if (value === "12months") {
      params.set("monthsCount", "12")
      params.delete("categoryFrom")
      params.delete("categoryTo")
      setDateRange(undefined)
    } else if (value === "last30days") {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      params.delete("monthsCount")
      params.set("categoryFrom", from.toISOString())
      params.set("categoryTo", now.toISOString())
      setDateRange({ from, to: now })
    } else if (value === "thisyear") {
      const from = new Date(now.getFullYear(), 0, 1)
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      params.delete("monthsCount")
      params.set("categoryFrom", from.toISOString())
      params.set("categoryTo", to.toISOString())
      setDateRange({ from, to })
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange)
    if (!newRange?.from || !newRange?.to) return

    const params = new URLSearchParams(searchParams.toString())
    params.delete("monthsCount")
    params.set("categoryFrom", newRange.from.toISOString())
    params.set("categoryTo", newRange.to.toISOString())

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }


  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      {/* Date Range Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 px-3 justify-between font-medium rounded-xl border-border/40 shadow-xs hover:bg-muted/50",
              !dateRange && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                <span>Filter by date range</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from || new Date()}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Quick Select Dropdown */}
      <Select value={getQuickSelectValue()} onValueChange={handleQuickSelect}>
        <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-border/40 shadow-xs">
          <SelectValue placeholder="Quick select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last30days">Last 30 Days</SelectItem>
          <SelectItem value="3months">Last 3 Months</SelectItem>
          <SelectItem value="6months">Last 6 Months</SelectItem>
          <SelectItem value="12months">Last 12 Months</SelectItem>
          <SelectItem value="thisyear">This Year</SelectItem>
          {paramCategoryFrom && paramCategoryTo && getQuickSelectValue() === "custom" && (
            <SelectItem value="custom">Custom Range</SelectItem>
          )}
        </SelectContent>
      </Select>

    </div>
  )
}
