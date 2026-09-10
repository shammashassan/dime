"use client"

import { RouteError } from "@/components/ui/route-error"

export default function TransactionDetailError({
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
      title="Failed to load Transaction Details"
      description="Could not load details for this transaction."
      backHref="/transactions"
      backLabel="Back to Transactions"
    />
  )
}
