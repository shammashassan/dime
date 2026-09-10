"use client"

import { RouteError } from "@/components/ui/route-error"

export default function SharedExpensesError({
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
      title="Failed to load Shared Expenses"
      description="An unexpected error occurred while loading your shared groups and splits."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
