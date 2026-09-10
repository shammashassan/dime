"use client"

import { RouteError } from "@/components/ui/route-error"

export default function ContactDetailError({
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
      title="Failed to load Contact Details"
      description="An error occurred while loading this contact and their shared ledger."
      backHref="/contacts"
      backLabel="Return to Contacts"
    />
  )
}
