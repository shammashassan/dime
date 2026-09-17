"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DatePickerWithRange } from "./date-picker-with-range"
import {
  History,
  Download,
  FileJson,
  FileSpreadsheet,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

interface TimelineHeaderProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  totalCount: number
  onExport: (format: "json" | "csv") => void
}

export function TimelineHeader({
  dateRange,
  onDateRangeChange,
  totalCount,
  onExport,
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* Title & Badge */}
      <div className="flex items-start gap-3.5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
          <History className="size-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Financial Timeline
            </h1>
            <HoverCard openDelay={150}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  tabIndex={0}
                  className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {totalCount} event{totalCount !== 1 ? "s" : ""}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3"
                align="start"
                side="top"
              >
                Chronological ledger tracking {totalCount} money movements, milestones, and transactions across all financial modules.
              </HoverCardContent>
            </HoverCard>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comprehensive chronological ledger of all money movements and milestones.
          </p>
        </div>
      </div>

      {/* Controls: Date Filter, Export (goes below header earlier on smaller/medium screens) */}
      <div className="flex items-center gap-2.5 w-full xl:w-auto shrink-0 justify-start xl:justify-end flex-wrap sm:flex-nowrap">
        {/* Date Range Picker (2-month calendar) */}
        <DatePickerWithRange
          date={dateRange}
          onDateChange={onDateRangeChange}
        />

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 text-xs font-semibold rounded-xl border-border/40 bg-card hover:bg-muted/50 cursor-pointer shadow-sm"
            >
              <Download className="size-4 text-muted-foreground" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border border-border/40 rounded-xl shadow-md">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">Export Timeline</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport("csv")} className="text-xs gap-2 cursor-pointer">
                <FileSpreadsheet className="size-4 text-emerald-500" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("json")} className="text-xs gap-2 cursor-pointer">
                <FileJson className="size-4 text-blue-500" />
                <span>Export as JSON</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
