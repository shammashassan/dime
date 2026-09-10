"use client"

import { RouteError } from "@/components/ui/route-error"

export default function NotificationsError({
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
      title="Failed to load Notifications"
      description="An unexpected error occurred while loading your notification center."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
