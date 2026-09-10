"use client"

import { RouteError } from "@/components/ui/route-error"

export default function WalletsError({
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
      title="Failed to load Wallets"
      description="An error occurred while fetching your bank accounts and digital wallets."
      backHref="/wallets"
      backLabel="Reload Wallets"
    />
  )
}
