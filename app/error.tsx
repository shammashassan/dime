"use client"

import { RouteError } from "@/components/ui/route-error"

export default function RootError({
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
      title="Application Error"
      description="An unexpected error interrupted this view. You can try reloading or returning to the dashboard."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
