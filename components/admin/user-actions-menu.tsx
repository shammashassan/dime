"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { AdminUser } from "@/lib/queries/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
import { UserDetailsModal } from "./user-details-modal"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Shield, User, Ban, ShieldAlert, Key, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

interface UserActionsMenuProps {
  user: AdminUser
  currentUserRole: string
  currentUserId: string
}

export function UserActionsMenu({ user, currentUserRole, currentUserId }: UserActionsMenuProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  // Dialog & Sheet States
  const [showProfile, setShowProfile] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isSelf = user.id === currentUserId

  const handleSetRole = async (role: "admin" | "user") => {
    setIsPending(true)

    const rolePromise = new Promise(async (resolve, reject) => {
      try {
        await authClient.admin.setRole({
          userId: user.id,
          role,
        })
        router.refresh()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(rolePromise, {
      loading: "Updating user role...",
      success: `User role updated to ${role}`,
      error: "Failed to update user role",
    })

    try {
      await rolePromise
    } catch (err) {
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  const handleBan = async () => {
    setIsPending(true)

    const banPromise = new Promise(async (resolve, reject) => {
      try {
        await authClient.admin.banUser({
          userId: user.id,
          banReason: banReason || undefined,
        })
        setShowBanDialog(false)
        setBanReason("")
        router.refresh()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(banPromise, {
      loading: "Banning user...",
      success: "User banned successfully",
      error: "Failed to ban user",
    })

    try {
      await banPromise
    } catch (err) {
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  const handleUnban = async () => {
    setIsPending(true)

    const unbanPromise = new Promise(async (resolve, reject) => {
      try {
        await authClient.admin.unbanUser({
          userId: user.id,
        })
        router.refresh()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(unbanPromise, {
      loading: "Unbanning user...",
      success: "User unbanned successfully",
      error: "Failed to unban user",
    })

    try {
      await unbanPromise
    } catch (err) {
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  const handleImpersonate = async () => {
    setIsPending(true)

    const impersonatePromise = new Promise(async (resolve, reject) => {
      try {
        await authClient.admin.impersonateUser({
          userId: user.id,
        })
        router.push("/")
        router.refresh()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(impersonatePromise, {
      loading: "Impersonating user...",
      success: "Impersonating user now",
      error: "Failed to impersonate user",
    })

    try {
      await impersonatePromise
    } catch (err) {
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  const handleRevokeSessions = async () => {
    setIsPending(true)

    const revokePromise = new Promise(async (resolve, reject) => {
      try {
        await authClient.admin.revokeUserSessions({
          userId: user.id,
        })
        router.refresh()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(revokePromise, {
      loading: "Revoking sessions...",
      success: "User sessions revoked successfully",
      error: "Failed to revoke sessions",
    })

    try {
      await revokePromise
    } catch (err) {
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    setIsPending(true)

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await authClient.admin.removeUser({
          userId: user.id,
        })
        setShowDeleteDialog(false)
        router.refresh()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(deletePromise, {
      loading: "Deleting user...",
      success: "User deleted successfully",
      error: "Failed to delete user",
    })

    try {
      await deletePromise
    } catch (err) {
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 p-0" disabled={isPending}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover border border-border/40 shadow-lg">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowProfile(true)} className="gap-2 text-xs">
            <Eye className="size-3.5" /> View Profile
          </DropdownMenuItem>

          {!isSelf && (
            <>
              <DropdownMenuSeparator className="border-border/40" />
              <DropdownMenuGroup>
                {user.role === "admin" ? (
                  <DropdownMenuItem onClick={() => handleSetRole("user")} className="gap-2 text-xs">
                    <User className="size-3.5" /> Demote to User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleSetRole("admin")} className="gap-2 text-xs">
                    <Shield className="size-3.5" /> Promote to Admin
                  </DropdownMenuItem>
                )}

                {user.banned ? (
                  <DropdownMenuItem onClick={handleUnban} className="gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <Ban className="size-3.5" /> Unban User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowBanDialog(true)} className="gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <Ban className="size-3.5" /> Ban User
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleImpersonate} className="gap-2 text-xs">
                  <ShieldAlert className="size-3.5" /> Impersonate
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator className="border-border/40" />
          <DropdownMenuItem onClick={handleRevokeSessions} className="gap-2 text-xs">
            <Key className="size-3.5" /> Revoke Sessions
          </DropdownMenuItem>

          {!isSelf && (
            <>
              <DropdownMenuSeparator className="border-border/40" />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 text-xs text-rose-600 dark:text-rose-400 focus:bg-destructive/15 focus:text-destructive"
              >
                <Trash2 className="size-3.5" /> Delete User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Detail Modal */}
      <UserDetailsModal
        user={user}
        open={showProfile}
        onOpenChange={setShowProfile}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onSetRole={handleSetRole}
        onBanClick={() => setShowBanDialog(true)}
        onUnban={handleUnban}
        onRevokeSessions={handleRevokeSessions}
        onDeleteClick={() => setShowDeleteDialog(true)}
        isPending={isPending}
      />

      {/* Ban User AlertDialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-amber-600 dark:text-amber-400">Ban User</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to ban {user.name}? This will revoke current sessions and restrict application access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">Reason for Ban</FieldLabel>
              <Input
                placeholder="Violating Terms of Service, abuse, etc."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="mt-1"
              />
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBan}>Ban User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently delete {user.name}? This action is irreversible and deletes all user configuration and files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
