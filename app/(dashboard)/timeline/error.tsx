"use client"

import { RouteError } from "@/components/ui/route-error"

export default function TimelineError({
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
      title="Failed to load Financial Timeline"
      description="An error occurred while compiling your chronological activity feed and financial milestones."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
