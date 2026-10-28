"use client"

import { RouteError } from "@/components/shared/route-error"

export default function AuthError({
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
      title="Authentication Error"
      description="An error occurred during authentication. Please try again."
      backHref="/sign-in"
      backLabel="Back to Sign In"
    />
  )
}
