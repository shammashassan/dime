"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Loader2, RefreshCw } from "lucide-react"

export function PendingApprovalView() {
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<string>("")

  const checkStatus = async (isManual = false) => {
    if (isManual) {
      setChecking(true)
    }
    try {
      const { data: session } = await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      })
      
      setLastChecked(new Date().toLocaleTimeString())

      if (session?.user && (session.user as any).approved) {
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("Error checking approval status:", err)
    } finally {
      if (isManual) {
        setChecking(false)
      }
    }
  }

  useEffect(() => {
    // Initial check on mount
    void checkStatus()

    // Poll every 15 seconds
    const interval = setInterval(() => void checkStatus(), 15000)

    // Check on tab visibility change (e.g. returning to tab after asking admin to approve)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void checkStatus()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/sign-in"
          },
        },
      })
    } catch (err) {
      console.error("Sign out error:", err)
      window.location.href = "/sign-in"
    }
  }

  return (
    <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <ShieldAlert className="size-12 text-amber-500 animate-pulse" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Approval Pending</CardTitle>
        <CardDescription>Your account requires administrator authorization</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account is pending administrator approval. Please contact the administrator{" "}
          <strong className="text-foreground">shammas</strong> or check back later.
        </p>

        <div className="flex flex-col items-center justify-center gap-1.5 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
            </span>
            <span>Real-time status check active</span>
          </div>
          {lastChecked && (
            <span className="text-[10px] text-muted-foreground/60">
              Last checked: {lastChecked}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/40 pt-4">
        <Button 
          className="w-full" 
          onClick={() => void checkStatus(true)} 
          disabled={checking}
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 size-4" />
              Check Status
            </>
          )}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground hover:text-foreground" 
          onClick={handleSignOut} 
          disabled={checking}
        >
          Sign Out & Return
        </Button>
      </CardFooter>
    </Card>
  )
}
