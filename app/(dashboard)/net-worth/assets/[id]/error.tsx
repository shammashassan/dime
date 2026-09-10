"use client"

import { RouteError } from "@/components/ui/route-error"

export default function AssetDetailError({
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
      title="Failed to load Asset Details"
      description="An error occurred while loading this asset's valuation history."
      backHref="/net-worth"
      backLabel="Return to Net Worth"
    />
  )
}
