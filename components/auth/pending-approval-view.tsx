"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export function PendingApprovalView() {
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
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/40 pt-4">
        <Button variant="ghost" className="w-full" onClick={handleSignOut}>
          Sign Out & Return
        </Button>
      </CardFooter>
    </Card>
  )
}
