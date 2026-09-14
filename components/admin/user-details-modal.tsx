"use client"

import { useState } from "react"
import { AdminUser } from "@/lib/queries/admin"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  User,
  Mail,
  Key,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Calendar,
  Copy,
  Check,
  Ban,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface UserDetailsModalProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string
  currentUserRole?: string
  onSetRole?: (role: "admin" | "user") => void
  onBanClick?: () => void
  onUnban?: () => void
  onRevokeSessions?: () => void
  onDeleteClick?: () => void
  isPending?: boolean
}

export function UserDetailsModal({
  user,
  open,
  onOpenChange,
  currentUserId,
  currentUserRole = "admin",
  onSetRole,
  onBanClick,
  onUnban,
  onRevokeSessions,
  onDeleteClick,
  isPending = false,
}: UserDetailsModalProps) {
  const [copiedId, setCopiedId] = useState(false)

  if (!user) return null

  const isSelf = user.id === currentUserId

  const handleCopyId = () => {
    if (!user.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    toast.success("User ID copied to clipboard")
    setTimeout(() => setCopiedId(false), 2000)
  }

  function InfoRow({
    icon: RowIcon,
    label,
    children,
  }: {
    icon: React.ElementType
    label: string
    children: React.ReactNode
  }) {
    return (
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/40 transition-colors min-w-0">
        <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
          <RowIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            {label}
          </span>
          <div className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl p-0 min-w-0">
        <DialogHeader className="px-6 pt-6 pb-0 min-w-0">
          <DialogTitle className="text-xl font-extrabold tracking-tight truncate">
            User Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Detailed account registration and status details
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-3 min-w-0 flex flex-col gap-4 text-sm">
          {/* Hero Header */}
          <div className="flex items-start gap-3.5 sm:gap-4 pb-4 border-b border-border/20 min-w-0">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-extrabold text-xl border border-border/40 shadow-xs shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-full rounded-2xl object-cover"
                />
              ) : user.name ? (
                user.name[0].toUpperCase()
              ) : (
                "U"
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1 gap-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground break-words [overflow-wrap:anywhere] leading-snug">
                {user.name}
              </h2>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className={`text-[10px] font-bold rounded-full capitalize px-2 py-0.5 shrink-0 ${
                    user.role === "admin" ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {user.role}
                </Badge>

                {user.approved ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold rounded-full text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400 shrink-0"
                  >
                    <CheckCircle2 className="size-3 mr-1" /> Approved
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold rounded-full text-amber-600 border-amber-500/20 bg-amber-500/10 dark:text-amber-400 shrink-0"
                  >
                    <Clock className="size-3 mr-1" /> Pending Review
                  </Badge>
                )}

                {user.banned ? (
                  <Badge
                    variant="destructive"
                    className="text-[10px] font-bold rounded-full shrink-0"
                  >
                    <Ban className="size-3 mr-1" /> Banned
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold rounded-full text-muted-foreground shrink-0 border-border/40"
                  >
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Core Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1.5 rounded-2xl border border-border/40 bg-card/40">
            <InfoRow icon={User} label="Username">
              {user.username ? `@${user.username}` : "—"}
            </InfoRow>

            <InfoRow icon={Key} label="User ID">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="truncate max-w-[120px]" title={user.id}>
                  {user.id}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyId}
                  className="size-5 p-0 hover:bg-accent shrink-0"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </InfoRow>

            <InfoRow icon={Mail} label="Email Address">
              <a
                href={`mailto:${user.email}`}
                className="hover:underline text-foreground truncate"
              >
                {user.email}
              </a>
            </InfoRow>

            <InfoRow icon={Shield} label="Role">
              <span className="capitalize">{user.role}</span>
            </InfoRow>

            <InfoRow icon={user.approved ? CheckCircle2 : Clock} label="Approval Status">
              <span className={user.approved ? "text-emerald-500" : "text-amber-500"}>
                {user.approved ? "Approved" : "Pending Review"}
              </span>
            </InfoRow>

            <InfoRow icon={Calendar} label="Joined On">
              <span className="font-medium text-foreground">
                {formatDate(user.createdAt)}
              </span>
            </InfoRow>
          </div>

          {/* Conditional Ban Alert */}
          {user.banned && (
            <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <ShieldAlert className="size-3.5 shrink-0" /> Account Banned
              </div>
              <p className="text-xs font-medium leading-relaxed">
                Reason: {user.banReason || "No reason specified."}
              </p>
              {user.banExpires && (
                <span className="text-[10px] opacity-80">
                  Expires: {formatDate(user.banExpires)}
                </span>
              )}
            </div>
          )}

          {/* Conditional Pending Alert */}
          {!user.approved && !user.banned && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-bold">Pending Approval</span>
                <span className="text-muted-foreground dark:text-amber-400/80">
                  This user account is waiting for administrative review before receiving full platform access.
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions Footer (Only if actions provided and not viewing self) */}
          {!isSelf && (onSetRole || onBanClick || onUnban || onRevokeSessions || onDeleteClick) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {onSetRole && (
                  user.role === "admin" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetRole("user")}
                      disabled={isPending}
                      className="text-xs h-8 rounded-xl border-border/40"
                    >
                      <User className="size-3.5 mr-1" /> Demote to User
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetRole("admin")}
                      disabled={isPending}
                      className="text-xs h-8 rounded-xl border-border/40"
                    >
                      <Shield className="size-3.5 mr-1" /> Promote to Admin
                    </Button>
                  )
                )}

                {user.banned && onUnban ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUnban}
                    disabled={isPending}
                    className="text-xs h-8 rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    <Ban className="size-3.5 mr-1" /> Unban User
                  </Button>
                ) : onBanClick ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBanClick}
                    disabled={isPending}
                    className="text-xs h-8 rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                  >
                    <Ban className="size-3.5 mr-1" /> Ban User
                  </Button>
                ) : null}

                {onRevokeSessions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRevokeSessions}
                    disabled={isPending}
                    className="text-xs h-8 rounded-xl border-border/40"
                  >
                    <Key className="size-3.5 mr-1" /> Revoke Sessions
                  </Button>
                )}

                {onDeleteClick && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteClick}
                    disabled={isPending}
                    className="text-xs h-8 rounded-xl ml-auto"
                  >
                    Delete User
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
