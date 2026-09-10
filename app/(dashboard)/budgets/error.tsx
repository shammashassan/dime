"use client"

import { RouteError } from "@/components/ui/route-error"

export default function BudgetsError({
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
      title="Failed to load Budgets"
      description="An error occurred while calculating budget limits and spending progress."
      backHref="/budgets"
      backLabel="Reload Budgets"
    />
  )
}
