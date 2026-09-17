"use client"

import { Button } from "@/components/ui/button"
import { History, RotateCcw } from "lucide-react"

interface TimelineEmptyStateProps {
  hasFilters: boolean
  onResetFilters: () => void
}

export function TimelineEmptyState({ hasFilters, onResetFilters }: TimelineEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 rounded-2xl bg-card/40 my-6">
      <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-xs">
        <History className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">No timeline events found</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
        {hasFilters
          ? "No activity matches your current filters. Try changing your category, search query, or date range."
          : "Your financial timeline will populate automatically as you record transactions, create goals, loans, and bills."}
      </p>
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-4 gap-1.5 text-xs h-8"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset Filters</span>
        </Button>
      )}
    </div>
  )
}
