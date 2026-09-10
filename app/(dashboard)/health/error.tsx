"use client"

import { RouteError } from "@/components/ui/route-error"

export default function HealthError({
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
      title="Failed to load Financial Health"
      description="An unexpected error occurred while analyzing your financial wellness score."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
