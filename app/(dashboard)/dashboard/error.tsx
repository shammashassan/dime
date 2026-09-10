"use client"

import { RouteError } from "@/components/ui/route-error"

export default function DashboardError({
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
      title="Failed to load Overview"
      description="An unexpected error occurred while loading your financial overview."
    />
  )
}
