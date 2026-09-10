"use client"

import { RouteError } from "@/components/ui/route-error"

export default function HoldingDetailError({
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
      title="Failed to load Holding Details"
      description="Could not load transaction history and price data for this holding."
      backHref="/investments"
      backLabel="Back to Investments"
    />
  )
}
