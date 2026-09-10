"use client"

import { RouteError } from "@/components/ui/route-error"

export default function LoanDetailError({
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
      title="Failed to load Loan Details"
      description="Could not load repayments and amortization schedule for this loan."
      backHref="/loans"
      backLabel="Back to Loans"
    />
  )
}
