"use client"

import { RouteError } from "@/components/ui/route-error"

export default function ReportsError({
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
      title="Failed to load Reports & Analytics"
      description="An error occurred while compiling your monthly reports and spending breakdown."
      backHref="/reports"
      backLabel="Reload Reports"
    />
  )
}
