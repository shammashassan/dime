"use client"

import { RouteError } from "@/components/ui/route-error"

export default function InvestmentAccountError({
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
      title="Failed to load Account Holdings"
      description="Could not load holdings for this brokerage account."
      backHref="/investments"
      backLabel="Back to Investments"
    />
  )
}
