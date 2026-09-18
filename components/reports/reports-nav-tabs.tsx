"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { BarChart3, CalendarDays, FileText, ClipboardList, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export function ReportsNavTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawTab = searchParams.get("tab")
  const currentTab =
    rawTab === "review"
      ? "review"
      : rawTab === "heatmap"
      ? "heatmap"
      : rawTab === "quarterly"
      ? "quarterly"
      : rawTab === "annual"
      ? "annual"
      : "overview"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "overview") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs overflow-x-auto max-w-full">
      <button
        onClick={() => handleTabChange("overview")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
          currentTab === "overview"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BarChart3 className="size-3.5 text-primary" />
        <span>Overview & Trends</span>
      </button>
      <button
        onClick={() => handleTabChange("heatmap")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
          currentTab === "heatmap"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarDays className="size-3.5 text-rose-500" />
        <span>Activity Heatmap</span>
      </button>
      <button
        onClick={() => handleTabChange("review")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
          currentTab === "review"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <FileText className="size-3.5 text-amber-500" />
        <span>Monthly Review</span>
      </button>
      <button
        onClick={() => handleTabChange("quarterly")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
          currentTab === "quarterly"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ClipboardList className="size-3.5 text-violet-500" />
        <span>Quarterly Review</span>
      </button>
      <button
        onClick={() => handleTabChange("annual")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
          currentTab === "annual"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Calendar className="size-3.5 text-blue-500" />
        <span>Annual Review</span>
      </button>
    </div>
  )
}
