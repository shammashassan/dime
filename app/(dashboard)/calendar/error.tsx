"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Calendar error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/50 bg-card">
      <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Failed to load Cash Flow Calendar</h2>
      <p className="text-xs text-muted-foreground mt-1 max-w-md">
        An unexpected error occurred while projecting your cash flow.
      </p>
      <Button
        onClick={() => reset()}
        variant="outline"
        className="rounded-xl font-bold text-xs mt-4 cursor-pointer"
      >
        Try Again
      </Button>
    </div>
  )
}
