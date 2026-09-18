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
import { refreshAiQuarterlyReviewAction, refreshAiAnnualReviewAction } from "@/lib/actions/annual-review"

export interface PeriodReviewFiltersProps {
  period: "quarterly" | "annual"
  currentYear: number
  currentQuarter?: 1 | 2 | 3 | 4
  availableYears?: number[]
  availableQuarters?: { year: number; quarter: 1 | 2 | 3 | 4; label: string }[]
}

export function PeriodReviewFilters({
  period,
  currentYear,
  currentQuarter = 1,
  availableYears = [currentYear],
  availableQuarters = [],
}: PeriodReviewFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isAiLoading, setIsAiLoading] = React.useState(false)

  const handleYearChange = (newYearStr: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", period)
    params.set("year", newYearStr)
    if (period === "quarterly" && currentQuarter) {
      params.set("quarter", String(currentQuarter))
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleQuarterChange = (newQuarterVal: string) => {
    if (!newQuarterVal) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "quarterly")
    params.set("year", String(currentYear))
    params.set("quarter", newQuarterVal)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleRefreshAi = async () => {
    setIsAiLoading(true)
    try {
      if (period === "quarterly") {
        const res = await refreshAiQuarterlyReviewAction({
          year: currentYear,
          quarter: currentQuarter,
        })
        if (res.success && res.brief) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("dime:period-review-ai-refreshed", {
                detail: { period: "quarterly", brief: res.brief },
              })
            )
          }
          toast.success("Executive review refreshed with Gemini AI analysis")
        } else {
          toast.error(res.error || "Failed to generate AI quarterly review")
        }
      } else {
        const res = await refreshAiAnnualReviewAction({ year: currentYear })
        if (res.success && res.brief) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("dime:period-review-ai-refreshed", {
                detail: { period: "annual", brief: res.brief },
              })
            )
          }
          toast.success("Executive review refreshed with Gemini AI analysis")
        } else {
          toast.error(res.error || "Failed to generate AI annual review")
        }
      }
    } catch {
      toast.error("An unexpected error occurred while refreshing AI analysis")
    } finally {
      setIsAiLoading(false)
    }
  }

  // Derive unique years from availableYears or availableQuarters
  const years = React.useMemo(() => {
    if (availableYears.length > 0) return availableYears
    if (availableQuarters.length > 0) {
      return Array.from(new Set(availableQuarters.map((q) => q.year))).sort((a, b) => b - a)
    }
    return [currentYear]
  }, [availableYears, availableQuarters, currentYear])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Year Dropdown */}
      <Select value={String(currentYear)} onValueChange={handleYearChange}>
        <SelectTrigger className="w-28">
          <Calendar className="text-muted-foreground shrink-0 size-4" />
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Quarter Dropdown (only for quarterly review) */}
      {period === "quarterly" && (
        <Select value={String(currentQuarter)} onValueChange={handleQuarterChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectItem value="1">Q1 (Jan – Mar)</SelectItem>
              <SelectItem value="2">Q2 (Apr – Jun)</SelectItem>
              <SelectItem value="3">Q3 (Jul – Sep)</SelectItem>
              <SelectItem value="4">Q4 (Oct – Dec)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {/* AI Refresh Button */}
      <Button variant="secondary" size="sm" onClick={handleRefreshAi} disabled={isAiLoading}>
        {isAiLoading ? (
          <Loader2 className="animate-spin text-primary size-4" />
        ) : (
          <Sparkles className="text-primary size-4" />
        )}
        <span className="hidden sm:inline">Refresh AI</span>
      </Button>
    </div>
  )
}
