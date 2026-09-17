"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { BarChart3, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

export function ReportsNavTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTab = searchParams.get("tab") === "heatmap" ? "heatmap" : "overview"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "heatmap") {
      params.set("tab", "heatmap")
    } else {
      params.delete("tab")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
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
    </div>
  )
}
