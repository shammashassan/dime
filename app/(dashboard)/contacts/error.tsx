"use client"

import { RouteError } from "@/components/ui/route-error"

export default function ContactsError({
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
      title="Failed to load Contacts"
      description="An unexpected error occurred while loading your contacts list."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
