"use client"

import { RouteError } from "@/components/ui/route-error"

export default function AdminError({
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
      title="Failed to load Admin Panel"
      description="An unexpected error occurred while loading the administrator dashboard."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
