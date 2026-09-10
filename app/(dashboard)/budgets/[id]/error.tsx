"use client"

import { RouteError } from "@/components/ui/route-error"

export default function BudgetDetailError({
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
      title="Failed to load Budget Details"
      description="An error occurred while loading this budget's spending history."
      backHref="/budgets"
      backLabel="Back to Budgets"
    />
  )
}
