"use client"

import { useState } from "react"
import { signUp, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeClosed, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SignUpForm() {
  const [activeTab, setActiveTab] = useState<string>("email")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const getAuthErrorMessage = (err: unknown, fallback = "An unexpected error occurred") => {
    if (typeof err === "string") return err
    if (!err || typeof err !== "object") return fallback

    const authError = err as {
      error?: string | { message?: unknown }
      message?: unknown
    }
    const nestedMessage = typeof authError.error === "object" ? authError.error?.message : authError.error

    if (typeof nestedMessage === "string") return nestedMessage
    if (typeof authError.message === "string") return authError.message

    return fallback
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      setLoading(false)
      toast.error("Passwords do not match")
      return
    }

    const signUpPromise = (async () => {
      const { data, error: resError } = await signUp.email({
        email,
        name,
        password,
        username: activeTab === "username" ? username : undefined,
        callbackURL: "/pending-approval",
      })

      if (resError) {
        throw resError
      }

      if (data) {
        // Redirection should happen automatically on success via callbackURL, but let's force it to make sure we land on pending-approval.
        window.location.href = "/pending-approval"
      }
    })().finally(() => {
      setLoading(false)
    })

    toast.promise(signUpPromise, {
      loading: "Creating your account...",
      success: "Account created. Redirecting for approval",
      error: (err) => getAuthErrorMessage(err, "An error occurred during signup"),
    })
  }

  const handleGoogleSignUp = async () => {
    const googlePromise = (async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/pending-approval`,
      })
    })()

    toast.promise(googlePromise, {
      loading: "Connecting to Google...",
      success: "Redirecting to Google",
      error: (err) => getAuthErrorMessage(err, "An unexpected error occurred during Google sign-up"),
    })
  }

  return (
    <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
        <CardDescription>
          Sign up to begin tracking your finances with Dime
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertDescription>
            After signing up, your account requires admin approval before you can access the dashboard.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/60 mb-6">
            <TabsTrigger value="email">Email Sign Up</TabsTrigger>
            <TabsTrigger value="username">Username Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleSignUp} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email-name">Full Name</FieldLabel>
                  <Input
                    id="email-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email-email">Email address</FieldLabel>
                  <Input
                    id="email-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email-password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="email-password"
                      type={showPassword ? "text" : "password"}
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
                <Field>
                  <FieldLabel htmlFor="email-confirm-password">Confirm Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="email-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 active:translate-y-[-50%]! text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? <EyeClosed className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="username">
            <form onSubmit={handleSignUp} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="user-name">Full Name</FieldLabel>
                  <Input
                    id="user-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-username">Username</FieldLabel>
                  <Input
                    id="user-username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-email">Email address</FieldLabel>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="user-password"
                      type={showPassword ? "text" : "password"}
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
                <Field>
                  <FieldLabel htmlFor="user-confirm-password">Confirm Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="user-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 active:translate-y-[-50%]! text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? <EyeClosed className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
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
          onClick={handleGoogleSignUp}
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
          Already have an account?{" "}
          <a href="/sign-in" className="text-primary font-medium hover:underline">
            Sign in
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
