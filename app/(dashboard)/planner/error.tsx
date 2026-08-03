"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Planner page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-card rounded-2xl border border-border/50">
      <div className="p-3 rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-1">Failed to load Financial Planner</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        An error occurred while aggregating your financial forecast. Please try again.
      </p>
      <Button onClick={reset} className="rounded-xl gap-2">
        <RotateCcw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}
