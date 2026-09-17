"use client"

import { RouteError } from "@/components/ui/route-error"

export default function CoachError({
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
      title="Failed to load Financial Coach"
      description="An unexpected error occurred while analyzing your financial playbooks."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
