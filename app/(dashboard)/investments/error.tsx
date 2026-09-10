"use client"

import { RouteError } from "@/components/ui/route-error"

export default function InvestmentsError({
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
      title="Failed to load Investments"
      description="An error occurred while calculating portfolio holdings and asset performance."
      backHref="/investments"
      backLabel="Reload Investments"
    />
  )
}
