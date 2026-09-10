"use client"

import { RouteError } from "@/components/ui/route-error"

export default function RecurringDetailError({
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
      title="Failed to load Recurring Rule Details"
      description="Could not load schedule and history for this recurring rule."
      backHref="/recurring"
      backLabel="Back to Recurring"
    />
  )
}
