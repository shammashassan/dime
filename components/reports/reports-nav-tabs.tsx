"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { BarChart3, CalendarDays, FileText, ClipboardList, Calendar } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    <div className="w-full sm:w-auto min-w-0">
      <Tabs value={currentTab} onValueChange={(v) => { if (v) handleTabChange(v) }}>
        <TabsList className="w-full sm:w-auto overflow-x-auto scrollbar-hide flex items-center justify-start gap-1">
          <TabsTrigger value="overview">
            <BarChart3 className="size-3.5 text-primary" />
            <span>Overview &amp; Trends</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap">
            <CalendarDays className="size-3.5 text-rose-500" />
            <span>Activity Heatmap</span>
          </TabsTrigger>
          <TabsTrigger value="review">
            <FileText className="size-3.5 text-amber-500" />
            <span>Monthly Review</span>
          </TabsTrigger>
          <TabsTrigger value="quarterly">
            <ClipboardList className="size-3.5 text-violet-500" />
            <span>Quarterly Review</span>
          </TabsTrigger>
          <TabsTrigger value="annual">
            <Calendar className="size-3.5 text-blue-500" />
            <span>Annual Review</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
