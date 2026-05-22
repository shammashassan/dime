"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function TwoFactorForm() {
  const [code, setCode] = useState("")
  const [isBackup, setIsBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isBackup) {
        const { data, error: resError } = await authClient.twoFactor.verifyBackupCode({
          code,
        })
        if (resError) {
          setError(resError?.message || "Invalid backup code")
        } else if (data) {
          window.location.href = "/"
        }
      } else {
        const { data, error: resError } = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: true,
        })
        if (resError) {
          setError(resError?.message || "Invalid two-factor code")
        } else if (data) {
          window.location.href = "/"
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Two-Factor Authentication</CardTitle>
        <CardDescription>
          {isBackup
            ? "Enter one of your emergency backup codes to access your account"
            : "Enter the verification code from your authenticator app"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code-input">
                {isBackup ? "Backup Code" : "Verification Code"}
              </FieldLabel>
              <Input
                id="code-input"
                type="text"
                placeholder={isBackup ? "e.g. abcde-12345" : "e.g. 123456"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                autoFocus
                className="text-center font-mono text-lg tracking-wider"
              />
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Verify
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsBackup(!isBackup)
              setCode("")
              setError(null)
            }}
            disabled={loading}
          >
            {isBackup ? "Use Authenticator Code" : "Use Backup Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
