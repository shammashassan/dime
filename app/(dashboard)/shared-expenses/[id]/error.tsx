"use client"

import { RouteError } from "@/components/ui/route-error"

export default function SharedExpenseDetailError({
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
      title="Failed to load Group Details"
      description="An error occurred while loading this shared expense group."
      backHref="/shared-expenses"
      backLabel="Return to Shared Expenses"
    />
  )
}
