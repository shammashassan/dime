"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { refreshAiMonthlyReviewAction } from "@/lib/actions/monthly-review"

export interface MonthlyReviewFiltersProps {
  availableMonths: { monthKey: string; label: string }[]
  currentMonth: string
}

export function MonthlyReviewFilters({
  availableMonths,
  currentMonth,
}: MonthlyReviewFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isAiLoading, setIsAiLoading] = React.useState(false)

  const handleMonthChange = (newMonth: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "review")
    params.set("month", newMonth)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleRefreshAi = async () => {
    setIsAiLoading(true)
    try {
      const res = await refreshAiMonthlyReviewAction({ month: currentMonth })
      if (res.success && res.brief) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dime:monthly-review-ai-refreshed", {
              detail: { monthKey: currentMonth, brief: res.brief },
            })
          )
        }
        toast.success("Executive review refreshed with Gemini AI analysis")
      } else {
        toast.error(res.error || "Failed to generate AI review")
      }
    } catch {
      toast.error("An unexpected error occurred while refreshing AI analysis")
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Month Selector Dropdown */}
      <div className="flex items-center">
        <Select value={currentMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-40">
            <Calendar className="text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {availableMonths.map((m) => (
                <SelectItem key={m.monthKey} value={m.monthKey}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Refresh with AI Button */}
      <Button
        variant="secondary"
        onClick={handleRefreshAi}
        disabled={isAiLoading}
      >
        {isAiLoading ? (
          <Loader2 className="animate-spin text-primary" />
        ) : (
          <Sparkles className="text-primary" />
        )}
        <span className="hidden sm:inline">Refresh AI</span>
      </Button>
    </div>
  )
}
