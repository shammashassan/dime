"use client"

import { useState, useEffect } from "react"
import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Eye, EyeClosed, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SignInForm() {
  const [activeTab, setActiveTab] = useState<string>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [magicLinkEmail, setMagicLinkEmail] = useState("")
  const [loading, setLoading] = useState(false)

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const signInPromise = (async () => {
      const { data, error: resError } = await signIn.email({
        email,
        password,
        callbackURL: "/",
      })

      if (resError) {
        throw resError
      }

      if (data) {
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

  const handleUsernameSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const signInPromise = (async () => {
      const { data, error: resError } = await signIn.username({
        username,
        password,
        callbackURL: "/",
      })

      if (resError) {
        throw resError
      }

      if (data) {
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
        email: magicLinkEmail,
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
    <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Sign in to Dime</CardTitle>
        <CardDescription>
          Enter your credentials or choose your preferred sign-in method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/60 mb-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="username">User</TabsTrigger>
            <TabsTrigger value="magic">Magic</TabsTrigger>
            <TabsTrigger value="passkey">Key</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email webauthn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
          </TabsContent>

          <TabsContent value="username">
            <form onSubmit={handleUsernameSignIn} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    type="text"
                    placeholder="yourusername"
                    autoComplete="username webauthn"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="username-password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="username-password"
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
          </TabsContent>

          <TabsContent value="magic">
            <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="magic-email">Email address</FieldLabel>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="name@example.com"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send Link
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="passkey">
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Authenticate quickly using your device biometrics, PIN, or security key.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handlePasskeySignIn}
                disabled={loading}
              >
                Sign in with Passkey
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="relative my-4 flex items-center justify-center">
          <span className="absolute w-full border-t border-border/40" />
          <span className="relative bg-background px-3 text-xs text-muted-foreground uppercase">
            Or continue with
          </span>
        </div>

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
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/40 pt-4">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="text-primary font-medium hover:underline">
            Sign up
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
