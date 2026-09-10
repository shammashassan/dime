"use client"

import { RouteError } from "@/components/ui/route-error"

export default function InsightsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Failed to load AI Spending Insights"
      description="An unexpected error occurred while analyzing your spending signals and baseline anomalies."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
