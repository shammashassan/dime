"use client"

import { RouteError } from "@/components/ui/route-error"

export default function DashboardSegmentError({
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
      title="Dashboard Error"
      description="An error occurred while loading this dashboard view. Your session and sidebar remain active."
      backHref="/dashboard"
      backLabel="Overview"
    />
  )
}
