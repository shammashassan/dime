"use client"

import { authClient } from "@/lib/auth-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export function ImpersonationBanner() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending || !session) return null

  // Check if impersonated
  const impersonatedBy = (session.session as any)?.impersonatedBy

  if (!impersonatedBy) return null

  const handleStopImpersonation = async () => {
    try {
      await authClient.admin.stopImpersonating()
      window.location.reload()
    } catch (err) {
      console.error("Failed to stop impersonation:", err)
    }
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-destructive/15 backdrop-blur-md border-b border-destructive/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-destructive dark:text-red-400">
          <ShieldAlert className="size-5 animate-pulse shrink-0" />
          <p className="text-sm font-medium">
            You are currently impersonating <span className="font-bold underline">{session.user.name}</span> ({session.user.email}).
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStopImpersonation}
          className="h-8 text-xs font-semibold px-3"
        >
          Stop Impersonation
        </Button>
      </div>
    </div>
  )
}
