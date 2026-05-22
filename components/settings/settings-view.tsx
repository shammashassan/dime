"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { useSession, authClient } from "@/lib/auth-client"
import { updatePreferences } from "@/lib/actions/preferences"
import { deleteUserAccount, getUserExportData } from "@/lib/actions/user"
import { UserPreferences } from "@/lib/queries/preferences"
import { Wallet } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldLabel, FieldGroup, FieldError, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import {
  User,
  Shield,
  Settings as SettingsIcon,
  Database,
  Loader2,
  Key,
  Smartphone,
  Copy,
  Check,
  Trash2,
  Download,
  AlertTriangle,
  LogOut,
  Laptop
} from "lucide-react"

interface SettingsViewProps {
  preferences: UserPreferences
  wallets: Wallet[]
}

export function SettingsView({ preferences: initialPreferences, wallets }: SettingsViewProps) {
  const { data: sessionData, refetch: refreshSession } = useSession()
  const user = sessionData?.user
  const [activeTab, setActiveTab] = useState("profile")
  const [isPending, startTransition] = useTransition()
  const contentRef = useRef<HTMLDivElement>(null)

  // GSAP animation on tab change
  useGSAP(
    () => {
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.querySelectorAll('[data-slot="tabs-content"]'),
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.1 }
        )
      }
    },
    { dependencies: [activeTab] }
  )

  // ----------------------------------------------------
  // PROFILE TAB STATE & ACTIONS
  // ----------------------------------------------------
  const [profileName, setProfileName] = useState(user?.name || "")
  const [profileUsername, setProfileUsername] = useState(user?.username || "")
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Track original values to determine dirty state
  const [originalProfileName, setOriginalProfileName] = useState(user?.name || "")
  const [originalProfileUsername, setOriginalProfileUsername] = useState(user?.username || "")
  const isProfileDirty = profileName !== originalProfileName || profileUsername !== originalProfileUsername

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "")
      setProfileUsername(user.username || "")
      setOriginalProfileName(user.name || "")
      setOriginalProfileUsername(user.username || "")
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setProfileError(null)

    startTransition(async () => {
      try {
        const { error } = await authClient.updateUser({
          name: profileName,
          username: profileUsername,
        })
        if (error) {
          setProfileError(error.message || "Failed to update profile")
        } else {
          setProfileMessage("Profile updated successfully")
          setOriginalProfileName(profileName)
          setOriginalProfileUsername(profileUsername)
          await refreshSession()
        }
      } catch (err: any) {
        setProfileError(err.message || "An unexpected error occurred")
      }
    })
  }

  // ----------------------------------------------------
  // SECURITY STATE & MUTATIONS (Passkeys, 2FA, Sessions)
  // ----------------------------------------------------
  const [sessions, setSessions] = useState<any[]>([])
  const [passkeys, setPasskeys] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)

  // 2FA Enrollment States
  const [twoFactorPassword, setTwoFactorPassword] = useState("")
  const [showTotpEnrollment, setShowTotpEnrollment] = useState(false)
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [totpCode, setTotpCode] = useState("")
  const [totpVerifyError, setTotpVerifyError] = useState<string | null>(null)
  const [totpVerifySuccess, setTotpVerifySuccess] = useState(false)

  // Disable 2FA States
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [disableError, setDisableError] = useState<string | null>(null)

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Passkey Dialog
  const [showAddPasskey, setShowAddPasskey] = useState(false)
  const [passkeyName, setPasskeyName] = useState("")
  const [passkeyError, setPasskeyError] = useState<string | null>(null)

  // Fetch security data on mount / active tab change
  const fetchSecurityData = async () => {
    setSecurityLoading(true)
    try {
      const [sessionsRes, passkeysRes, accountsRes] = await Promise.all([
        authClient.listSessions(),
        authClient.passkey.listUserPasskeys(),
        authClient.listAccounts()
      ])
      if (sessionsRes.data) setSessions(sessionsRes.data)
      if (passkeysRes.data) setPasskeys(passkeysRes.data)
      if (accountsRes.data) setAccounts(accountsRes.data)
    } catch (err) {
      console.error("Failed to fetch security metadata", err)
    } finally {
      setSecurityLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "security") {
      fetchSecurityData()
    }
  }, [activeTab])

  const hasCredentials = accounts.some((acc) => acc.providerId === "email")

  // Change Password Action
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    startTransition(async () => {
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        setPasswordError(error.message || "Failed to change password")
      } else {
        setPasswordSuccess("Password changed successfully. Other sessions revoked.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    })
  }

  // Passkeys Action
  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasskeyError(null)

    startTransition(async () => {
      const { error } = await authClient.passkey.addPasskey({
        name: passkeyName || `${user?.name || "User"}'s Passkey`,
      })

      if (error) {
        setPasskeyError(error.message || "Failed to register passkey")
      } else {
        setShowAddPasskey(false)
        setPasskeyName("")
        await fetchSecurityData()
      }
    })
  }

  const handleDeletePasskey = async (id: string) => {
    startTransition(async () => {
      const { error } = await authClient.passkey.deletePasskey({ id })
      if (!error) {
        await fetchSecurityData()
      }
    })
  }

  // 2FA Actions
  const handleStart2FAEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    setTotpVerifyError(null)

    startTransition(async () => {
      const { data, error } = await authClient.twoFactor.enable({
        password: hasCredentials ? twoFactorPassword : undefined,
      })

      if (error) {
        setTotpVerifyError(error.message || "Failed to generate 2FA credentials")
      } else if (data) {
        setTotpUri(data.totpURI)
        setBackupCodes(data.backupCodes)
        setShowTotpEnrollment(true)
        setTwoFactorPassword("")
      }
    })
  }

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setTotpVerifyError(null)

    startTransition(async () => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice: true,
      })

      if (error) {
        setTotpVerifyError(error.message || "Invalid verification code")
      } else {
        setTotpVerifySuccess(true)
        await refreshSession()
        await fetchSecurityData()
      }
    })
  }

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisableError(null)

    startTransition(async () => {
      const { error } = await authClient.twoFactor.disable({
        password: hasCredentials ? disablePassword : undefined,
      })

      if (error) {
        setDisableError(error.message || "Failed to disable 2FA")
      } else {
        setShowDisable2FA(false)
        setDisablePassword("")
        await refreshSession()
        await fetchSecurityData()
      }
    })
  }

  // Revoke Sessions
  const handleRevokeSession = async (token: string) => {
    startTransition(async () => {
      const { error } = await authClient.revokeSession({ token })
      if (!error) {
        await fetchSecurityData()
        await refreshSession()
      }
    })
  }

  const handleRevokeOtherSessions = async () => {
    startTransition(async () => {
      const { error } = await authClient.revokeOtherSessions()
      if (!error) {
        await fetchSecurityData()
      }
    })
  }

  // ----------------------------------------------------
  // PREFERENCES TAB STATE & ACTIONS
  // ----------------------------------------------------
  const [prefCurrency, setPrefCurrency] = useState(initialPreferences.defaultCurrency)
  const [prefWallet, setPrefWallet] = useState(initialPreferences.defaultWalletId || "none")
  const [prefDateFormat, setPrefDateFormat] = useState(initialPreferences.dateFormat)
  const [prefMessage, setPrefMessage] = useState<string | null>(null)

  // Track dirty state for preferences
  const isPreferencesDirty =
    prefCurrency !== initialPreferences.defaultCurrency ||
    prefWallet !== (initialPreferences.defaultWalletId || "none") ||
    prefDateFormat !== initialPreferences.dateFormat

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setPrefMessage(null)

    startTransition(async () => {
      try {
        const res = await updatePreferences({
          defaultCurrency: prefCurrency,
          defaultWalletId: prefWallet === "none" ? undefined : prefWallet,
          dateFormat: prefDateFormat,
        })
        if (res.success) {
          setPrefMessage("Preferences saved successfully")
        }
      } catch (err: any) {
        console.error(err)
      }
    })
  }

  // ----------------------------------------------------
  // DATA MANAGEMENT TAB ACTIONS (Export, Delete Account)
  // ----------------------------------------------------
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  const handleExportJSON = async () => {
    try {
      const data = await getUserExportData()
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", jsonString)
      downloadAnchor.setAttribute("download", `dime-data-export-${new Date().toISOString().split("T")[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      console.error("Export JSON failed:", err)
    }
  }

  const handleExportCSV = async () => {
    try {
      const data = await getUserExportData()
      const txs = data.transactions
      
      const headersList = ["ID", "Type", "Amount", "Category", "Wallet", "Date", "Description", "Recurring"]
      const csvRows = [headersList.join(",")]

      txs.forEach((tx: any) => {
        const categoryName = (data.categories.find((c: any) => c._id === tx.categoryId) as any)?.name || "Uncategorized"
        const walletName = (data.wallets.find((w: any) => w._id === tx.walletId) as any)?.name || "Unknown"
        const amount = (tx.amount / 100).toFixed(2)
        const dateStr = tx.date.split("T")[0]
        const desc = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : ""
        
        csvRows.push([
          tx._id,
          tx.type,
          amount,
          categoryName,
          walletName,
          dateStr,
          desc,
          tx.isRecurring ? "Yes" : "No"
        ].join(","))
      })

      const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows.join("\n"))}`
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", csvContent)
      downloadAnchor.setAttribute("download", `dime-transactions-export-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      console.error("Export CSV failed:", err)
    }
  }

  const handleDeleteAccount = async () => {
    startTransition(async () => {
      try {
        await deleteUserAccount()
        await authClient.signOut()
        window.location.href = "/sign-up"
      } catch (err) {
        console.error("Failed to delete account", err)
      }
    })
  }

  const copyBackupCodesToClipboard = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  const parseUserAgent = (ua: string) => {
    if (!ua) return "Unknown Device"
    if (ua.includes("Firefox/")) return "Firefox"
    if (ua.includes("Chrome/") && ua.includes("Safari/")) return "Chrome"
    if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari"
    if (ua.includes("Edge/")) return "Edge"
    return ua.split(" ")[0] || "Unknown Client"
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
          <SettingsIcon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personalize your profile, configure currency and wallet preferences, and protect your account with advanced credentials.
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start w-full"
      >
        {/* Navigation Tabs List */}
        <TabsList className="md:col-span-1 border border-border/40 bg-card rounded-2xl p-1.5 shadow-md flex-col w-full text-left space-y-0.5">
          <TabsTrigger value="profile" className="flex items-center gap-2 justify-start w-full">
            <User className="size-4" />
            Profile Details
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 justify-start w-full">
            <Shield className="size-4" />
            Security & Login
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 justify-start w-full">
            <SettingsIcon className="size-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2 justify-start w-full text-rose-500 hover:text-rose-600 dark:hover:text-rose-400">
            <Database className="size-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        {/* Tabs Contents Panel */}
        <div className="md:col-span-3 w-full">
          {/* PROFILE DETAILS */}
          <TabsContent value="profile" className="outline-none">
            <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Profile Details</CardTitle>
                <CardDescription>
                  Modify the display name and user handle for your Dime profile.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-5">
                  {profileMessage && (
                    <Alert className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
                      <AlertDescription>{profileMessage}</AlertDescription>
                    </Alert>
                  )}
                  {profileError && (
                    <Alert className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="profile-email">Email Address</FieldLabel>
                      <Input
                        id="profile-email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="rounded-xl border-border/40 bg-muted/40 cursor-not-allowed opacity-70"
                      />
                      <FieldDescription>Email address is linked to authentication and cannot be updated directly.</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="profile-name">Display Name</FieldLabel>
                      <Input
                        id="profile-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Enter your name"
                        className="rounded-xl border-border/40 focus-visible:ring-primary"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="profile-username">Username Handle</FieldLabel>
                      <Input
                        id="profile-username"
                        type="text"
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        placeholder="Enter your username handle"
                        className="rounded-xl border-border/40 focus-visible:ring-primary"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="border-t border-border/10 bg-muted/10 px-6 py-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending || !isProfileDirty}
                    className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-md shadow-primary/10"
                  >
                    {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* SECURITY & LOGIN */}
          <TabsContent value="security" className="outline-none space-y-6">
            {/* 2FA Card */}
            <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Two-Factor Authentication (2FA)</CardTitle>
                  <CardDescription>
                    Provide a secondary authentication code when logging in to safeguard your funds.
                  </CardDescription>
                </div>
                <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"} className="rounded-full font-bold px-3 py-0.5">
                  {user?.twoFactorEnabled ? "ACTIVE" : "DISABLED"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Time-based One-Time Passwords (TOTP) generate dynamic, offline codes on your phone. Highly recommended to keep your account safe from hijacking.
                </p>

                {user?.twoFactorEnabled ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDisable2FA(true)}
                      className="rounded-xl border-border/40 hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      Disable 2FA
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleStart2FAEnrollment} className="space-y-4 max-w-sm">
                    {hasCredentials && (
                      <Field>
                        <FieldLabel htmlFor="2fa-setup-password">Confirm Password to Setup 2FA</FieldLabel>
                        <Input
                          id="2fa-setup-password"
                          type="password"
                          placeholder="Your account password"
                          value={twoFactorPassword}
                          onChange={(e) => setTwoFactorPassword(e.target.value)}
                          className="rounded-xl border-border/40 focus-visible:ring-primary"
                          required
                        />
                      </Field>
                    )}
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95"
                    >
                      {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Enable 2FA
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Passkeys Card */}
            <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Passkeys</CardTitle>
                  <CardDescription>
                    Sign in seamlessly using secure cryptographic keys (Touch ID, Face ID, or PIN).
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddPasskey(true)}
                  className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 flex items-center gap-1.5 text-xs py-1.5 px-3 h-auto"
                >
                  <Key className="size-3.5" />
                  Add Passkey
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {passkeys.length > 0 ? (
                  <div className="space-y-2">
                    {passkeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-muted/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Key className="size-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{pk.name || "Unnamed Passkey"}</div>
                            <div className="text-xs text-muted-foreground">
                              Registered on {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString() : "Unknown date"} • {pk.deviceType}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePasskey(pk.id)}
                          className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          disabled={isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border/60 rounded-xl p-6 text-center text-muted-foreground text-sm">
                    No passkeys configured. Add a passkey to skip password prompts on your trusted devices.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password Card */}
            {hasCredentials && (
              <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Change Password</CardTitle>
                  <CardDescription>
                    Update the credentials used to log in to your account.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                  <CardContent className="space-y-4">
                    {passwordError && (
                      <Alert className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}
                    {passwordSuccess && (
                      <Alert className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
                        <AlertDescription>{passwordSuccess}</AlertDescription>
                      </Alert>
                    )}

                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="current-pw">Current Password</FieldLabel>
                        <Input
                          id="current-pw"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="rounded-xl border-border/40 focus-visible:ring-primary"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="new-pw">New Password</FieldLabel>
                        <Input
                          id="new-pw"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="rounded-xl border-border/40 focus-visible:ring-primary"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="confirm-pw">Confirm New Password</FieldLabel>
                        <Input
                          id="confirm-pw"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="rounded-xl border-border/40 focus-visible:ring-primary"
                          required
                        />
                      </Field>
                    </FieldGroup>
                  </CardContent>
                  <CardFooter className="border-t border-border/10 bg-muted/10 px-6 py-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-md"
                    >
                      {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Update Password
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {/* Active Sessions Card */}
            <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Active Sessions</CardTitle>
                  <CardDescription>
                    Manage and sign out of other active browser and app environments.
                  </CardDescription>
                </div>
                {sessions.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleRevokeOtherSessions}
                    className="rounded-xl border-border/40 text-xs py-1.5 px-3 h-auto hover:bg-rose-500/10 hover:text-rose-500"
                    disabled={isPending}
                  >
                    Revoke Other Sessions
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.map((s) => {
                  const isCurrent = s.token === sessionData?.session?.token
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between p-3.5 border rounded-xl bg-muted/5 ${
                        isCurrent ? "border-primary/20 bg-primary/5 dark:bg-primary/10" : "border-border/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          <Laptop className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {parseUserAgent(s.userAgent || "")}
                            </span>
                            {isCurrent && (
                              <Badge className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[9px] hover:bg-primary/30 border-none font-bold">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            IP: {s.ipAddress || "Unknown"} • Active {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "Just now"}
                          </div>
                        </div>
                      </div>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeSession(s.token)}
                          className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          disabled={isPending}
                        >
                          <LogOut className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREFERENCES */}
          <TabsContent value="preferences" className="outline-none">
            <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">App Preferences</CardTitle>
                <CardDescription>
                  Configure defaults and layouts to align with your logging workflow.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdatePreferences}>
                <CardContent className="space-y-5">
                  {prefMessage && (
                    <Alert className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
                      <AlertDescription>{prefMessage}</AlertDescription>
                    </Alert>
                  )}

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="pref-currency">Default Currency</FieldLabel>
                      <Select value={prefCurrency} onValueChange={setPrefCurrency}>
                        <SelectTrigger className="rounded-xl border-border/40 focus:ring-primary">
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 bg-popover">
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="AUD">AUD ($)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>Main currency used for calculations and overall reports dashboard.</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="pref-wallet">Default Active Wallet</FieldLabel>
                      <Select value={prefWallet} onValueChange={setPrefWallet}>
                        <SelectTrigger className="rounded-xl border-border/40 focus:ring-primary">
                          <SelectValue placeholder="Select Default Wallet" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 bg-popover">
                          <SelectItem value="none">None (Always prompt)</SelectItem>
                          {wallets.map((w) => (
                            <SelectItem key={w._id.toString()} value={w._id.toString()}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>Preset wallet automatically selected during transaction creation.</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="pref-date">Date Format</FieldLabel>
                      <ToggleGroup
                        type="single"
                        value={prefDateFormat}
                        onValueChange={(val) => val && setPrefDateFormat(val)}
                        className="justify-start gap-2"
                      >
                        <ToggleGroupItem value="DD/MM/YYYY" className="rounded-xl border border-border/40">
                          DD/MM/YYYY
                        </ToggleGroupItem>
                        <ToggleGroupItem value="MM/DD/YYYY" className="rounded-xl border border-border/40">
                          MM/DD/YYYY
                        </ToggleGroupItem>
                        <ToggleGroupItem value="YYYY-MM-DD" className="rounded-xl border border-border/40">
                          YYYY-MM-DD
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <FieldDescription>Display format for dates and transactions across layouts.</FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter className="border-t border-border/10 bg-muted/10 px-6 py-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending || !isPreferencesDirty}
                    className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-md"
                  >
                    {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Preferences
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* DATA MANAGEMENT */}
          <TabsContent value="data" className="outline-none space-y-6">
            {/* Export Card */}
            <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Export Personal Data</CardTitle>
                <CardDescription>
                  Download a copy of your financial records in structured formats.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You can download your entire history of transactions, wallets, budgets, and categories. Back up your records or transfer them to local analytics engines.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="rounded-xl border-border/40 flex items-center gap-1.5"
                  >
                    <Download className="size-4" />
                    Export CSV (Transactions Only)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportJSON}
                    className="rounded-xl border-border/40 flex items-center gap-1.5"
                  >
                    <Download className="size-4" />
                    Export JSON (Complete Dump)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-rose-500/20 bg-rose-500/5 shadow-md rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="size-5 shrink-0" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-rose-500/70">
                  Actions in this area have severe consequences and cannot be reverted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Delete Dime Account</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Wipes all associated wallets, transaction entries, recurring settings, and categories. Your credentials and auth settings will be completely deleted from the database.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/95"
                >
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* 2FA Totp QR Code Enrollment Dialog */}
      <Dialog open={showTotpEnrollment} onOpenChange={(open) => !open && setShowTotpEnrollment(false)}>
        <DialogContent className="max-w-md bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Configure 2FA Authenticator</DialogTitle>
            <DialogDescription>
              Scan the code below with Google Authenticator, Authy, or your password manager.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center gap-5 py-4">
            {/* QR Code */}
            {totpUri && (
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                  alt="2FA QR Code"
                  className="size-[200px]"
                />
              </div>
            )}

            {/* Backup Codes Section */}
            {backupCodes.length > 0 && (
              <div className="w-full space-y-2 border border-border/40 rounded-xl p-3 bg-muted/10">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Recovery Backup Codes (Single Use Only)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyBackupCodesToClipboard}
                    className="h-7 text-xs flex items-center gap-1"
                  >
                    {copiedCodes ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    Copy Codes
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs text-muted-foreground max-h-24 overflow-y-auto">
                  {backupCodes.map((code, index) => (
                    <span key={index} className="bg-muted/30 py-1 rounded border border-border/10">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Form */}
            {totpVerifySuccess ? (
              <Alert className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl w-full">
                <AlertDescription className="font-semibold text-center">
                  Two-Factor Authentication activated successfully!
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleVerifyTotp} className="w-full space-y-3">
                {totpVerifyError && (
                  <Alert className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
                    <AlertDescription>{totpVerifyError}</AlertDescription>
                  </Alert>
                )}
                <Field>
                  <FieldLabel htmlFor="totp-code">6-Digit Authenticator Code</FieldLabel>
                  <Input
                    id="totp-code"
                    type="text"
                    placeholder="e.g. 123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="rounded-xl border-border/40 text-center font-bold tracking-widest text-lg focus-visible:ring-primary"
                    required
                    maxLength={6}
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowTotpEnrollment(false)}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95"
                  >
                    {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Confirm Code
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FA} onOpenChange={(open) => !open && setShowDisable2FA(false)}>
        <DialogContent className="max-w-md bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Confirm your password (if applicable) to deactivate secondary verification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisable2FA} className="space-y-4 py-2">
            {disableError && (
              <Alert className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
                <AlertDescription>{disableError}</AlertDescription>
              </Alert>
            )}

            {hasCredentials && (
              <Field>
                <FieldLabel htmlFor="disable-2fa-pw">Password</FieldLabel>
                <Input
                  id="disable-2fa-pw"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Verify account password"
                  className="rounded-xl border-border/40 focus-visible:ring-primary"
                  required
                />
              </Field>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDisable2FA(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-destructive text-destructive-foreground font-bold hover:bg-destructive/95"
              >
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Deactivate 2FA
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Passkey Dialog */}
      <Dialog open={showAddPasskey} onOpenChange={(open) => !open && setShowAddPasskey(false)}>
        <DialogContent className="max-w-md bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Add New Passkey</DialogTitle>
            <DialogDescription>
              Name your passkey to easily identify it later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterPasskey} className="space-y-4 py-2">
            {passkeyError && (
              <Alert className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
                <AlertDescription>{passkeyError}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="passkey-friendly-name">Passkey Label</FieldLabel>
              <Input
                id="passkey-friendly-name"
                type="text"
                placeholder="e.g. MacBook Pro TouchID, YubiKey"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                className="rounded-xl border-border/40 focus-visible:ring-primary"
                required
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddPasskey(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 flex items-center gap-1"
              >
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Register Key
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Alert Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background border border-border/40 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold tracking-tight text-rose-500">
              Delete Dime Account permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure? This action is absolute. All logged transactions, budgets, custom wallets, preferences, and credential details will be deleted from our systems. There is no backup or recovery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/40">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/95"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Wipe Everything & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
