"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Loader2, Building, Mail, AlertTriangle, LogOut, Check, X } from "lucide-react"

interface AcceptInvitationPageProps {
  params: Promise<{ id: string }>
}

interface InvitationDetails {
  id: string
  email: string
  role: string
  status: string
  organizationId: string
  organizationName: string
  inviterId: string
  inviterEmail: string
  expiresAt: Date
  createdAt: Date
}

export default function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  const { data: sessionData, isPending: sessionLoading } = useSession()
  
  const [invitation, setInvitation] = React.useState<InvitationDetails | null>(null)
  const [loadingInvite, setLoadingInvite] = React.useState(true)
  const [inviteError, setInviteError] = React.useState<string | null>(null)
  
  const [isAccepting, setIsAccepting] = React.useState(false)
  const [isDeclining, setIsDeclining] = React.useState(false)
  
  const cardRef = React.useRef<HTMLDivElement>(null)

  // GSAP entrance animation
  useGSAP(
    () => {
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
        )
      }
    },
    { scope: cardRef }
  )

  React.useEffect(() => {
    let active = true
    
    async function fetchInvitation() {
      if (!sessionData) return
      setLoadingInvite(true)
      setInviteError(null)
      try {
        const { data, error } = await authClient.organization.getInvitation({ query: { id } })
        if (!active) return
        
        if (error) {
          setInviteError(error.message || "Failed to load invitation details.")
        } else if (!data) {
          setInviteError("Invitation not found or has expired.")
        } else {
          setInvitation(data as InvitationDetails)
        }
      } catch (err: unknown) {
        if (active) {
          const errMsg = err instanceof Error ? err.message : "An error occurred."
          setInviteError(errMsg)
        }
      } finally {
        if (active) setLoadingInvite(false)
      }
    }

    const timer = setTimeout(() => {
      if (!sessionLoading) {
        if (sessionData) {
          fetchInvitation()
        } else {
          setLoadingInvite(false)
        }
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [id, sessionData, sessionLoading])

  const handleAccept = async () => {
    if (!invitation) return
    setIsAccepting(true)
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId: id,
      })
      if (error) {
        toast.error(error.message || "Failed to accept invitation")
      } else {
        toast.success(`Joined ${invitation.organizationName} successfully!`)
        // Auto-activate the accepted organization space
        window.dispatchEvent(new Event("workspace-switch-start"))
        await authClient.organization.setActive({
          organizationId: invitation.organizationId,
        })
        window.location.href = "/dashboard"
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!invitation) return
    setIsDeclining(true)
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId: id,
      })
      if (error) {
        toast.error(error.message || "Failed to decline invitation")
      } else {
        toast.info("Invitation declined")
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    } finally {
      setIsDeclining(false)
    }
  }

  const handleSignOutAndRetry = async () => {
    try {
      await authClient.signOut()
      window.location.href = `/sign-in?callbackUrl=/accept-invitation/${id}`
    } catch {
      toast.error("Failed to sign out")
    }
  }

  // SKELETON / LOADING SESSION STATE
  if (sessionLoading || (sessionData && loadingInvite)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading invitation...</p>
        </div>
      </div>
    )
  }

  // NOT LOGGED IN STATE
  if (!sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card ref={cardRef} className="w-full max-w-md border border-border/40 bg-card shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight">You&apos;ve Been Invited!</CardTitle>
            <CardDescription>
              A shared workspace invitation has been sent to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground space-y-4 py-2">
            <p>
              Collaborate on transactions, balance statements, and monthly budgets in real-time.
            </p>
            <Alert className="bg-primary/5 border-primary/10 text-left rounded-xl">
              <AlertDescription className="text-xs">
                Please sign in to your Dime account or create a new one to accept and join the workspace.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-4 px-6 pb-6">
            <Button
              className="w-full rounded-xl font-bold"
              onClick={() => router.push(`/sign-in?callbackUrl=/accept-invitation/${id}`)}
            >
              Sign In to View Invitation
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => router.push(`/sign-up?callbackUrl=/accept-invitation/${id}`)}
            >
              Create Account
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ERROR STATE
  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card ref={cardRef} className="w-full max-w-md border border-rose-500/20 bg-card shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-rose-500">Invalid Invitation</CardTitle>
            <CardDescription>
              We were unable to resolve this shared space invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground py-2">
            <Alert className="bg-rose-500/5 border-rose-500/10 text-left rounded-xl text-rose-500">
              <AlertDescription className="text-xs font-semibold">
                {inviteError}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center pt-4 px-6 pb-6">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ACTIVE INVITATION STATE
  if (invitation) {
    const userEmail = sessionData.user.email
    const emailMismatch = invitation.email.toLowerCase() !== userEmail.toLowerCase()

    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card ref={cardRef} className="w-full max-w-md border border-border/40 bg-card shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Building className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight">Join {invitation.organizationName}?</CardTitle>
            <CardDescription>
              Shared Financial Workspace Invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-2">
            <p className="text-center text-sm text-muted-foreground">
              Collaborate in their space as a <span className="capitalize font-semibold text-foreground">{invitation.role}</span> (invited by <strong>{invitation.inviterEmail}</strong>).
            </p>

            {emailMismatch ? (
              <Alert className="bg-amber-500/5 border-amber-500/20 rounded-xl text-amber-600">
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-left text-xs">
                    <p className="font-semibold leading-none">Email Address Mismatch</p>
                    <p className="text-muted-foreground leading-normal">
                      This invite was sent to <strong>{invitation.email}</strong>, but you are signed in as <strong>{userEmail}</strong>.
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSignOutAndRetry}
                      className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 rounded-lg px-2 flex items-center gap-1 mt-1 font-bold"
                    >
                      <LogOut className="size-3" />
                      Sign in with correct account
                    </Button>
                  </div>
                </div>
              </Alert>
            ) : (
              <Alert className="bg-primary/5 border-primary/10 text-left rounded-xl">
                <AlertDescription className="text-xs text-muted-foreground leading-normal">
                  Accepting this invite will link your transactions ledger context to this space. You can easily switch back to your Personal space at any time from the sidebar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 px-6 pb-6">
            <Button
              variant="outline"
              disabled={isAccepting || isDeclining}
              onClick={handleDecline}
              className="w-full sm:w-1/2 rounded-xl text-muted-foreground"
            >
              {isDeclining ? <Loader2 className="mr-2 size-4 animate-spin" /> : <X className="mr-2 size-4" />}
              Decline
            </Button>
            <Button
              disabled={isAccepting || isDeclining || emailMismatch}
              onClick={handleAccept}
              className="w-full sm:w-1/2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10"
            >
              {isAccepting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
              Accept & Join
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return null
}
