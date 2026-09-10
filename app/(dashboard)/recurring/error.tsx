"use client"

import { RouteError } from "@/components/ui/route-error"

export default function RecurringError({
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
      title="Failed to load Recurring Rules"
      description="An error occurred while loading subscriptions and automated recurring payments."
      backHref="/recurring"
      backLabel="Reload Recurring"
    />
  )
}
