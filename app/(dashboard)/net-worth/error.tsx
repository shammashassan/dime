"use client"

import { RouteError } from "@/components/ui/route-error"

export default function NetWorthError({
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
      title="Failed to load Net Worth"
      description="An unexpected error occurred while calculating your net worth overview."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
