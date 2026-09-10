"use client"

import { RouteError } from "@/components/ui/route-error"

export default function PlannerError({
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
      title="Failed to load Financial Planner"
      description="An error occurred while aggregating your financial forecast. Please try again."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
