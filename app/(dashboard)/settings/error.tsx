"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Settings page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
      <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
        <AlertCircle className="size-10" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        An error occurred while loading your account settings. Please try again.
      </p>
      <Button
        onClick={() => reset()}
        className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95"
      >
        Try Again
      </Button>
    </div>
  )
}
