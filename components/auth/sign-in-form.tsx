"use client"

import { useState, useEffect, useRef } from "react"
import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Eye, EyeClosed, Loader2, Key, Mail } from "lucide-react"
import { toast } from "sonner"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

export function SignInForm() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [magicLinkEmail, setMagicLinkEmail] = useState("")
  const [showMagicForm, setShowMagicForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Passkey Conditional UI / Autofill Mediation
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      window.PublicKeyCredential.isConditionalMediationAvailable
    ) {
      window.PublicKeyCredential.isConditionalMediationAvailable()
        .then((available) => {
          if (available) {
            void authClient.signIn.passkey({ autoFill: true })
          }
        })
        .catch(() => {
          // Conditional passkey mediation can fail quietly when no credential is available.
        })
    }
  }, [])

  // GSAP Entrance Animation
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

  const getAuthErrorMessage = (err: unknown, fallback = "An unexpected error occurred") => {
    if (typeof err === "string") return err
    if (!err || typeof err !== "object") return fallback

    const authError = err as {
      error?: string | { message?: unknown; code?: unknown }
      message?: unknown
      code?: unknown
    }
    const nestedMessage = typeof authError.error === "object" ? authError.error?.message : authError.error

    if (typeof nestedMessage === "string") return nestedMessage
    if (typeof authError.message === "string") return authError.message

    return fallback
  }

  const isPendingApprovalError = (err: unknown, message = getAuthErrorMessage(err)) => {
    const authError = err && typeof err === "object"
      ? err as {
          error?: { code?: unknown }
          code?: unknown
          message?: unknown
        }
      : null

    return (
      message.includes("PENDING_APPROVAL") ||
      authError?.error?.code === "PENDING_APPROVAL" ||
      authError?.code === "PENDING_APPROVAL" ||
      authError?.message === "PENDING_APPROVAL"
    )
  }

  const handleToastError = (err: unknown, fallback?: string) => {
    const errMsg = getAuthErrorMessage(err, fallback)

    if (isPendingApprovalError(err, errMsg)) {
      window.location.href = "/pending-approval"
      return "Your account is pending admin approval"
    }

    return errMsg
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const trimmedIdentifier = identifier.trim()
    const isEmail = trimmedIdentifier.includes("@")

    const signInPromise = (async () => {
      let res
      if (isEmail) {
        res = await signIn.email({
          email: trimmedIdentifier,
          password,
          callbackURL: "/",
        })
      } else {
        res = await signIn.username({
          username: trimmedIdentifier,
          password,
          callbackURL: "/",
        })
      }

      if (res.error) {
        throw res.error
      }

      if (res.data) {
        window.location.href = "/"
      }
    })().finally(() => {
      setLoading(false)
    })

    toast.promise(signInPromise, {
      loading: "Signing in...",
      success: "Signed in successfully",
      error: (err) => handleToastError(err, "Failed to sign in"),
    })
  }

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const magicLinkPromise = (async () => {
      const { error: resError } = await authClient.signIn.magicLink({
        email: magicLinkEmail.trim(),
        callbackURL: "/",
      })

      if (resError) {
        throw resError
      }
    })().finally(() => {
      setLoading(false)
    })

    toast.promise(magicLinkPromise, {
      loading: "Sending magic link...",
      success: "A magic sign-in link has been sent to your email",
      error: (err) => handleToastError(err, "Failed to send magic link"),
    })
  }

  const handlePasskeySignIn = async () => {
    setLoading(true)

    const passkeyPromise = (async () => {
      const { data, error: resError } = await authClient.signIn.passkey()

      if (resError) {
        throw resError
      }

      if (data) {
        window.location.href = "/"
      }
    })().finally(() => {
      setLoading(false)
    })

    toast.promise(passkeyPromise, {
      loading: "Checking passkey...",
      success: "Signed in with passkey",
      error: (err) => handleToastError(err, "No passkey was selected or available"),
    })
  }

  const handleGoogleSignIn = async () => {
    const googlePromise = (async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/`,
      })
    })()

    toast.promise(googlePromise, {
      loading: "Connecting to Google...",
      success: "Redirecting to Google",
      error: (err) => handleToastError(err, "Failed to continue with Google"),
    })
  }

  return (
    <Card ref={cardRef} className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl opacity-0 translate-y-4">
      <CardHeader className="flex flex-col gap-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Sign in to Dime</CardTitle>
        <CardDescription>
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="text-primary font-medium hover:underline">
            Sign up
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <FieldGroup className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="identifier">Email or Username</FieldLabel>
              <Input
                id="identifier"
                type="text"
                placeholder="name@example.com or username"
                autoComplete="username email webauthn"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 active:translate-y-[-50%]! text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeClosed className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="relative my-2 flex items-center justify-center">
          <span className="absolute w-full border-t border-border/40" />
          <span className="relative bg-background px-3 text-xs text-muted-foreground uppercase">
            Or continue with
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {/* Custom Google SVG */}
            <svg className="size-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          {!showMagicForm ? (
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handlePasskeySignIn}
                disabled={loading}
              >
                <Key className="size-4" />
                Passkey
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setShowMagicForm(true)}
                disabled={loading}
              >
                <Mail className="size-4" />
                Magic Link
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handlePasskeySignIn}
                disabled={loading}
              >
                <Key className="size-4 mr-2" />
                Sign in with Passkey
              </Button>
              <form onSubmit={handleMagicLinkSignIn} className="flex flex-col gap-2 border border-border/40 p-3 rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <label htmlFor="magic-email" className="text-xs font-semibold">Magic Link Email</label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowMagicForm(false)}
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="name@example.com"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-9 text-sm"
                  />
                  <Button type="submit" size="sm" disabled={loading} className="shrink-0">
                    {loading && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Send Link
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
