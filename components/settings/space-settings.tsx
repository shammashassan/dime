"use client"

import * as React from "react"
import { useSession, authClient } from "@/lib/auth-client"
import { updateOrganizationSettings } from "@/lib/actions/organization"
import { OrganizationSettings, SpaceType } from "@/types"
import { Role, can } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup, FieldDescription, FieldContent } from "@/components/ui/field"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { lookupUserByUsername } from "@/lib/actions/user"
import { createNotification } from "@/lib/actions/notifications"
import { Popover, PopoverContent, PopoverAnchor, PopoverHeader, PopoverTitle, PopoverDescription } from "@/components/ui/popover"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Building, LogOut, ShieldAlert, Search, User, ChevronDown } from "lucide-react"

interface SpaceSettingsProps {
  initialSettings: OrganizationSettings | null
}

interface WorkspaceMember {
  id: string
  userId: string
  role: string
  createdAt: Date
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface WorkspaceInvitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: Date
  expiresAt: Date
}

const SPACE_TYPES: { value: SpaceType; label: string }[] = [
  { value: "couple", label: "Couple Budgeting" },
  { value: "family", label: "Family Finances" },
  { value: "business", label: "Business / Team Workspace" },
  { value: "roommates", label: "Roommates & Shared Living" },
  { value: "travel", label: "Travel & Shared Trips" },
  { value: "other", label: "Other Shared Spaces" },
]

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "AUD", label: "AUD ($)" },
  { value: "CAD", label: "CAD ($)" },
]

export function SpaceSettings({ initialSettings }: SpaceSettingsProps) {
  const { data: sessionData } = useSession()
  const { data: activeOrg, refetch: refetchActiveOrg } = authClient.useActiveOrganization()

  const [orgName, setOrgName] = React.useState<string | undefined>(undefined)

  // Settings states
  const [spaceType, setSpaceType] = React.useState<SpaceType>(initialSettings?.spaceType || "couple")
  const [baseCurrency, setBaseCurrency] = React.useState(initialSettings?.baseCurrency || "USD")
  const [fiscalYearStart, setFiscalYearStart] = React.useState(initialSettings?.fiscalYearStartMonth || 1)
  const [isUpdatingSettings, setIsUpdatingSettings] = React.useState(false)

  // Members & Invite states
  const [members, setMembers] = React.useState<WorkspaceMember[]>([])
  const [invitations, setInvitations] = React.useState<WorkspaceInvitation[]>([])
  const [loadingMembers, setLoadingMembers] = React.useState(true)
  const [inviteUsername, setInviteUsername] = React.useState("")
  const [searchingUser, setSearchingUser] = React.useState(false)
  const [resolvedUser, setResolvedUser] = React.useState<{ id: string; name: string; email: string; username: string; image: string | null } | null>(null)
  const [showUserPreview, setShowUserPreview] = React.useState(false)
  const [inviteRole, setInviteRole] = React.useState<Role>("member")
  const [isInviting, setIsInviting] = React.useState(false)

  // Danger states
  const [transferTargetId, setTransferTargetId] = React.useState("")
  const [transferConfirmText, setTransferConfirmText] = React.useState("")
  const [isTransferring, setIsTransferring] = React.useState(false)
  const [isLeaving, setIsLeaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const currentUserId = sessionData?.user?.id
  const activeOrgId = activeOrg?.id || null

  const fetchMembersAndInvitations = React.useCallback(async () => {
    if (!activeOrgId) return
    setLoadingMembers(true)
    try {
      const [mRes, iRes] = await Promise.all([
        authClient.organization.listMembers({ query: { organizationId: activeOrgId } }),
        authClient.organization.listInvitations({ query: { organizationId: activeOrgId } })
      ])

      if (mRes.data?.members) {
        setMembers(mRes.data.members as WorkspaceMember[])
      } else if (Array.isArray(mRes.data)) {
        setMembers(mRes.data as WorkspaceMember[])
      }

      if (Array.isArray(iRes.data)) {
        setInvitations(iRes.data as WorkspaceInvitation[])
      } else if (iRes.data && "invitations" in (iRes.data as Record<string, unknown>)) {
        const payload = iRes.data as { invitations: WorkspaceInvitation[] }
        setInvitations(payload.invitations)
      }
    } catch (err) {
      console.error("Failed to load workspace members", err)
    } finally {
      setLoadingMembers(false)
    }
  }, [activeOrgId])

  // Resolve stuttering: dependent on activeOrgId string primitive instead of activeOrg object reference
  React.useEffect(() => {
    if (activeOrgId) {
      const timer = setTimeout(() => {
        fetchMembersAndInvitations()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [activeOrgId, fetchMembersAndInvitations])

  // Debounced search user by username
  React.useEffect(() => {
    let active = true

    if (!inviteUsername.trim() || inviteUsername.trim().length < 2) {
      const timer = setTimeout(() => {
        if (active) {
          setResolvedUser(null)
          setShowUserPreview(false)
        }
      }, 0)
      return () => {
        active = false
        clearTimeout(timer)
      }
    }

    const timerSearch = setTimeout(() => {
      if (active) setSearchingUser(true)
    }, 0)

    const delayDebounce = setTimeout(async () => {
      try {
        const user = await lookupUserByUsername(inviteUsername.trim())
        if (active) {
          setResolvedUser(user)
          if (user) {
            setShowUserPreview(true)
          } else {
            setShowUserPreview(false)
          }
        }
      } catch (err) {
        console.error("Failed to search user by username", err)
        if (active) {
          setResolvedUser(null)
          setShowUserPreview(false)
        }
      } finally {
        if (active) setSearchingUser(false)
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timerSearch)
      clearTimeout(delayDebounce)
    }
  }, [inviteUsername])

  // Compute permissions
  const currentUserMember = members.find((m) => m.userId === currentUserId)
  const currentUserRole = (currentUserMember?.role as Role) || "member"

  const canManageSettings = can(currentUserRole, "manage_space_settings")
  const canInvite = can(currentUserRole, "invite_members")
  const canDelete = can(currentUserRole, "delete_space")
  const canTransfer = can(currentUserRole, "transfer_ownership")
  const canLeave = can(currentUserRole, "leave_space")

  const currentOrgName = orgName !== undefined ? orgName : (activeOrg?.name || "")

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrgId) return

    setIsUpdatingSettings(true)
    try {
      const promises: Promise<unknown>[] = []

      // If org name is changed, update it
      const finalOrgName = currentOrgName.trim()
      if (finalOrgName && finalOrgName !== activeOrg?.name) {
        promises.push(
          authClient.organization.update({
            data: { name: finalOrgName },
          }).then(({ error }) => {
            if (error) throw new Error(error.message || "Failed to update space name")
          })
        )
      }

      // Update settings
      promises.push(
        updateOrganizationSettings({
          spaceType,
          baseCurrency,
          fiscalYearStartMonth: Number(fiscalYearStart),
        }).then((res) => {
          if (!res.success) throw new Error("Failed to update financial settings")
        })
      )

      await Promise.all(promises)
      toast.success("Workspace preferences saved successfully")
      await refetchActiveOrg()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedUser || !activeOrgId) {
      toast.error("Please search and select a valid user first")
      return
    }

    setIsInviting(true)
    try {
      const { error } = await authClient.organization.inviteMember({
        email: resolvedUser.email,
        role: inviteRole as "admin" | "member" | "owner",
      })
      if (error) {
        toast.error(error.message || "Failed to send invitation")
      } else {
        toast.success(`Invitation sent successfully to @${resolvedUser.username}`)
        // Create in-app notification for the invited user
        await createNotification({
          userId: resolvedUser.id,
          title: "Workspace Invitation",
          message: `You have been invited to join the workspace "${activeOrg?.name || 'Shared Space'}" as ${inviteRole === 'admin' ? 'an Admin' : inviteRole === 'viewer' ? 'a Viewer' : 'a Member'}.`,
          type: "system",
          link: "/settings?tab=invitations",
        }).catch((nErr) => {
          console.error("Failed to trigger in-app invitation notification:", nErr)
        })
        setInviteUsername("")
        setResolvedUser(null)
        await fetchMembersAndInvitations()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId: inviteId,
      })
      if (error) {
        toast.error(error.message || "Failed to cancel invitation")
      } else {
        toast.success("Invitation canceled")
        await fetchMembersAndInvitations()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })
      if (error) {
        toast.error(error.message || "Failed to remove member")
      } else {
        toast.success("Member removed successfully")
        await fetchMembersAndInvitations()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    }
  }

  const handleChangeMemberRole = async (memberId: string, role: Role) => {
    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role: role as "admin" | "member" | "owner",
      })
      if (error) {
        toast.error(error.message || "Failed to update member role")
      } else {
        toast.success(`Role updated to ${role}`)
        await fetchMembersAndInvitations()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    }
  }

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferTargetId || transferConfirmText !== "TRANSFER" || !activeOrgId) return

    setIsTransferring(true)
    try {
      const targetMember = members.find((m) => m.id === transferTargetId)
      if (!targetMember) throw new Error("Target member not found")

      const { error: errorPromote } = await authClient.organization.updateMemberRole({
        memberId: targetMember.id,
        role: "owner",
      })

      if (errorPromote) {
        toast.error(errorPromote.message || "Failed to promote target member to owner")
        return
      }

      if (currentUserMember) {
        const { error: errorDemote } = await authClient.organization.updateMemberRole({
          memberId: currentUserMember.id,
          role: "admin",
        })
        if (errorDemote) {
          toast.warning("Promoted new owner, but failed to demote current user. Please review memberships.")
        }
      }

      toast.success("Ownership transferred successfully")
      setTransferConfirmText("")
      setTransferTargetId("")
      await fetchMembersAndInvitations()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to transfer ownership"
      toast.error(errMsg)
    } finally {
      setIsTransferring(false)
    }
  }

  const handleLeaveSpace = async () => {
    if (!activeOrgId) return
    setIsLeaving(true)
    try {
      const { error } = await authClient.organization.leave({
        organizationId: activeOrgId,
      })
      if (error) {
        toast.error(error.message || "Failed to leave space")
      } else {
        toast.success("Left the space successfully")
        window.dispatchEvent(new Event("workspace-switch-start"))
        await authClient.organization.setActive({
          organizationId: null,
        })
        window.location.reload()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    } finally {
      setIsLeaving(false)
    }
  }

  const handleDeleteSpace = async () => {
    if (!activeOrgId) return
    setIsDeleting(true)
    try {
      const { error } = await authClient.organization.delete({
        organizationId: activeOrgId,
      })
      if (error) {
        toast.error(error.message || "Failed to delete space")
      } else {
        toast.success("Space deleted successfully")
        window.dispatchEvent(new Event("workspace-switch-start"))
        await authClient.organization.setActive({
          organizationId: null,
        })
        window.location.reload()
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error(errMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!activeOrgId) {
    return (
      <Card className="border border-dashed border-border/60 bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Building className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-bold text-lg">No Active Shared Space</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Space Settings are only available when you have selected a shared workspace.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSavePreferences}>
        <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Space Preferences</CardTitle>
            <CardDescription>
              Configure the display name, category, currency, and fiscal configurations for this shared workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-name">Workspace Name</FieldLabel>
                <Input
                  id="org-name"
                  type="text"
                  value={currentOrgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Couples Shared Ledger"
                  required
                  disabled={!canManageSettings || isUpdatingSettings}
                />
                <FieldDescription>This name will be displayed in the sidebar switcher for all members.</FieldDescription>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel htmlFor="space-type">Space Category</FieldLabel>
                  <Select
                    value={spaceType}
                    onValueChange={(val) => setSpaceType(val as SpaceType)}
                    disabled={!canManageSettings || isUpdatingSettings}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select space category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPACE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="currency">Base Currency</FieldLabel>
                  <Select
                    value={baseCurrency}
                    onValueChange={(val) => setBaseCurrency(val)}
                    disabled={!canManageSettings || isUpdatingSettings}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Base Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel htmlFor="fiscal-year">Fiscal Year Start</FieldLabel>
                  <Select
                    value={String(fiscalYearStart)}
                    onValueChange={(val) => setFiscalYearStart(Number(val))}
                    disabled={!canManageSettings || isUpdatingSettings}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select starting month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
          {canManageSettings && (
            <CardFooter className="justify-end border-t">
              <Button type="submit" disabled={isUpdatingSettings}>
                {isUpdatingSettings && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* 2. Members Management Card */}
      <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Space Members & Invitations</CardTitle>
          <CardDescription>
            Invite collaborators to this space and manage their permission levels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canInvite && (
            <Collapsible className="rounded-xl border border-border/30 bg-muted/5 p-4 space-y-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between group/collapsible">
                  <span className="flex items-center gap-2">
                    <Plus data-icon="inline-start" /> Invite Collaborator
                  </span>
                  <ChevronDown className="inline-end transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <form onSubmit={handleInviteMember}>
                  <FieldGroup>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3.5 w-full">
                      <Field className="flex-[2] min-w-0">
                        <FieldLabel htmlFor="invite-username">Username</FieldLabel>
                        <FieldContent>
                          <Popover open={showUserPreview} onOpenChange={setShowUserPreview}>
                            <PopoverAnchor asChild>
                              <InputGroup>
                                <InputGroupAddon align="inline-start">
                                  <Search />
                                </InputGroupAddon>
                                <InputGroupInput
                                  id="invite-username"
                                  type="text"
                                  value={inviteUsername}
                                  onChange={(e) => setInviteUsername(e.target.value)}
                                  placeholder="partner"
                                  required
                                  disabled={isInviting}
                                />
                                {resolvedUser && (
                                  <InputGroupButton
                                    type="button"
                                    onClick={() => setShowUserPreview(!showUserPreview)}
                                    variant="ghost"
                                    size="icon-sm"
                                  >
                                    <User />
                                  </InputGroupButton>
                                )}
                                {searchingUser && (
                                  <InputGroupAddon align="inline-end">
                                    <Loader2 className="animate-spin" />
                                  </InputGroupAddon>
                                )}
                              </InputGroup>
                            </PopoverAnchor>
                            <PopoverContent side="top" align="center" sideOffset={6} className="w-[calc(100vw-2rem)] sm:w-[var(--radix-popover-trigger-width)] max-w-sm">
                              {searchingUser ? (
                                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                                  <Loader2 className="animate-spin text-primary" />
                                  <span className="text-xs font-medium">Searching user...</span>
                                </div>
                              ) : resolvedUser ? (
                                <>
                                  <PopoverHeader>
                                    <PopoverTitle className="text-sm font-bold flex items-center gap-1.5">
                                      Found User
                                    </PopoverTitle>
                                    <PopoverDescription className="text-xs text-muted-foreground">
                                      Verify details before sending invitation
                                    </PopoverDescription>
                                  </PopoverHeader>
                                  <div className="flex gap-3 pt-1">
                                    <Avatar className="h-10 w-10 shrink-0 border border-border/40">
                                      <AvatarImage src={resolvedUser.image || ""} />
                                      <AvatarFallback className="font-bold">{resolvedUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5 text-left text-foreground min-w-0">
                                      <h4 className="text-sm font-bold truncate leading-snug">{resolvedUser.name}</h4>
                                      <p className="text-xs text-muted-foreground truncate">@{resolvedUser.username}</p>
                                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{resolvedUser.email}</p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <PopoverHeader>
                                    <PopoverTitle className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                                      Not Found
                                    </PopoverTitle>
                                    <PopoverDescription className="text-xs text-muted-foreground">
                                      No user matches this username
                                    </PopoverDescription>
                                  </PopoverHeader>
                                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                    We couldn&apos;t find any user with the username &quot;{inviteUsername}&quot;. Please double check the spelling and try again.
                                  </p>
                                </>
                              )}
                            </PopoverContent>
                          </Popover>
                        </FieldContent>
                      </Field>
                      <Field className="flex-1 min-w-0">
                        <FieldLabel>Role</FieldLabel>
                        <FieldContent>
                          <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as Role)} disabled={isInviting}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                      <Button type="submit" disabled={isInviting || !resolvedUser} className="w-full sm:w-auto">
                        {isInviting && <Loader2 className="animate-spin" data-icon="inline-start" />}
                        Send Invite
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Active Members Table */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Active Members</h4>
            {loadingMembers ? (
              <div className="flex justify-center p-4">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {currentUserRole === "owner" && <TableHead className="w-24 text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={member.user?.image || ""} />
                            <AvatarFallback>{member.user ? member.user.name.substring(0, 2).toUpperCase() : "?"}</AvatarFallback>
                          </Avatar>
                          <span>{member.user ? member.user.name : "Pending User"}</span>
                        </TableCell>
                        <TableCell>{member.user ? member.user.email : "-"}</TableCell>
                        <TableCell>
                          {currentUserRole === "owner" && member.userId !== currentUserId ? (
                            <Select
                              value={member.role}
                              onValueChange={(val) => handleChangeMemberRole(member.id, val as Role)}
                            >
                              <SelectTrigger className="h-7 w-28 rounded-lg text-xs">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={member.role === "owner" ? "default" : "outline"} className="capitalize">
                              {member.role}
                            </Badge>
                          )}
                        </TableCell>
                        {currentUserRole === "owner" && (
                          <TableCell className="text-right">
                            {member.userId !== currentUserId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pending Invitations Table */}
          {(() => {
            const pending = invitations.filter((invite) => invite.status === "pending")
            if (pending.length === 0) return null
            return (
              <div className="space-y-2 pt-4 border-t border-border/10">
                <h4 className="text-sm font-semibold">Pending Invitations</h4>
                <div className="rounded-xl border border-border/40 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email Address</TableHead>
                        <TableHead>Invited Role</TableHead>
                        <TableHead>Status</TableHead>
                        {canInvite && <TableHead className="w-24 text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell className="capitalize">{invite.role}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="animate-pulse">
                              Pending
                            </Badge>
                          </TableCell>
                          {canInvite && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs"
                                onClick={() => handleCancelInvitation(invite.id)}
                              >
                                Cancel
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* 3. Danger Zone Card */}
      <Card className="border border-rose-500/20 bg-card shadow-md rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
            <ShieldAlert className="size-5" /> Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions regarding ownership and deletion of this space ledger.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Transfer Ownership */}
          {canTransfer && members.filter((m) => m.userId !== currentUserId).length > 0 && (
            <div className="space-y-3 pb-6 border-b border-border/10">
              <h4 className="text-sm font-bold">Transfer Space Ownership</h4>
              <p className="text-xs text-muted-foreground max-w-xl">
                Select a member to transfer ownership of this workspace ledger. This will grant them full administrative access and revoke your privileges to delete the space.
              </p>
              <form onSubmit={handleTransferOwnership} className="flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
                <div className="flex-1 w-full space-y-1.5">
                  <Label htmlFor="transfer-member" className="text-xs">New Owner</Label>
                  <Select value={transferTargetId} onValueChange={setTransferTargetId} disabled={isTransferring}>
                    <SelectTrigger className="rounded-xl border border-border/40">
                      <SelectValue placeholder="Select new owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.userId !== currentUserId)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.user ? m.user.name : "Pending Member"} ({m.user ? m.user.email : "-"})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48 space-y-1.5">
                  <Label htmlFor="transfer-confirm" className="text-xs">Type &quot;TRANSFER&quot;</Label>
                  <Input
                    id="transfer-confirm"
                    value={transferConfirmText}
                    onChange={(e) => setTransferConfirmText(e.target.value)}
                    placeholder="TRANSFER"
                    required
                    disabled={isTransferring || !transferTargetId}
                    className="rounded-xl border-border/40"
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isTransferring || transferConfirmText !== "TRANSFER" || !transferTargetId}
                  className="rounded-xl font-bold w-full sm:w-auto"
                >
                  {isTransferring && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Transfer
                </Button>
              </form>
            </div>
          )}

          {/* Leave Workspace */}
          {canLeave && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 pb-6 border-b border-border/10">
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Leave Workspace Space</h4>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Remove yourself as a collaborator on this shared space ledger. You will immediately lose access to all wallets, transactions, and budgets.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isLeaving} variant="outline" className="rounded-xl text-rose-500 border-rose-500/20 hover:bg-rose-500/5 hover:text-rose-600 font-bold">
                    <LogOut className="mr-2 size-4" /> Leave Space
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Workspace Space?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave this space? You will lose access to all transaction ledgers immediately and can only re-join if re-invited by a workspace administrator.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={isLeaving} onClick={handleLeaveSpace} className="bg-rose-500 hover:bg-rose-600">
                      Yes, Leave Space
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete Workspace */}
          {canDelete && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-500">Delete Shared Workspace Space</h4>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Permanently delete this organization shared space. This action will immediately purge all wallets, transactions, budgets, and settings, and cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isDeleting} variant="destructive" className="rounded-xl font-bold">
                    <Trash2 className="mr-2 size-4" /> Delete Space
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Shared Workspace Space?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Warning: This action is permanent and irreversible. All ledger history, active members, category configurations, and settings for this workspace will be deleted forever.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={isDeleting} onClick={handleDeleteSpace} className="bg-rose-500 hover:bg-rose-600">
                      Yes, Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
