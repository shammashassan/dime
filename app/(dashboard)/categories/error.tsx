"use client"

import { RouteError } from "@/components/ui/route-error"

export default function CategoriesError({
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
      title="Failed to load Categories"
      description="An unexpected error occurred while loading your transaction categories."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
