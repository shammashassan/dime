"use client"

import { RouteError } from "@/components/ui/route-error"

export default function LoansError({
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
      title="Failed to load Loans"
      description="An error occurred while fetching loans and debt records."
      backHref="/loans"
      backLabel="Reload Loans"
    />
  )
}
