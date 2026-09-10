"use client"

import { RouteError } from "@/components/ui/route-error"

export default function GoalDetailError({
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
      title="Failed to load Goal Details"
      description="An error occurred while loading this savings target and its contributions."
      backHref="/goals"
      backLabel="Back to Goals"
    />
  )
}
