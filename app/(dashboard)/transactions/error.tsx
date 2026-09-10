"use client"

import { RouteError } from "@/components/ui/route-error"

export default function TransactionsError({
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
      title="Failed to load Transactions"
      description="An error occurred while loading your transactions. Please try again."
    />
  )
}
