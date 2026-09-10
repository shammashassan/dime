"use client"

import { RouteError } from "@/components/ui/route-error"

export default function GoalsError({
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
      title="Failed to load Goals"
      description="An error occurred while loading your savings goals."
      backHref="/goals"
      backLabel="Reload Goals"
    />
  )
}
