"use client"

import { RouteError } from "@/components/ui/route-error"

export default function AdminUsersError({
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
      title="Failed to load User Management"
      description="An error occurred while loading the user directory."
      backHref="/admin"
      backLabel="Return to Admin Panel"
    />
  )
}
