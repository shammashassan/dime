"use client"

import { RouteError } from "@/components/ui/route-error"

export default function SettingsError({
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
      title="Failed to load Account Settings"
      description="An unexpected error occurred while loading your account settings."
      backHref="/dashboard"
      backLabel="Return to Dashboard"
    />
  )
}
