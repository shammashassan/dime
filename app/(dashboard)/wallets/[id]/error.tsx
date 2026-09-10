"use client"

import { RouteError } from "@/components/ui/route-error"

export default function WalletDetailError({
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
      title="Failed to load Wallet Details"
      description="Could not load balance history and transactions for this wallet."
      backHref="/wallets"
      backLabel="Back to Wallets"
    />
  )
}
