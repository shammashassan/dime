"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AdminUser } from "@/lib/queries/admin"
import { approveUser, rejectUser, bulkApproveUsers, bulkRejectUsers } from "@/lib/actions/admin"
import { formatDate } from "@/lib/utils"
import { Check, X, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
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

interface PendingTableProps {
  users: AdminUser[]
}

export function PendingTable({ users }: PendingTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null)
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false)

  const pendingUsers = users.filter((u) => !u.approved && !u.banned)

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingUsers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingUsers.map((u) => u.id))
    }
  }

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleApprove = (userId: string) => {
    const approvePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await approveUser(userId)
          setSelectedIds((prev) => prev.filter((id) => id !== userId))
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(approvePromise, {
      loading: "Approving user...",
      success: "User approved successfully",
      error: "Failed to approve user",
    })
  }

  const handleReject = async () => {
    if (!rejectingUserId) return

    const rejectPromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await rejectUser(rejectingUserId)
          setSelectedIds((prev) => prev.filter((id) => id !== rejectingUserId))
          setRejectingUserId(null)
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(rejectPromise, {
      loading: "Rejecting user...",
      success: "User registration rejected",
      error: "Failed to reject user",
    })
  }

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return

    const approvePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await bulkApproveUsers(selectedIds)
          setSelectedIds([])
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(approvePromise, {
      loading: `Approving ${selectedIds.length} user(s)...`,
      success: "Selected users approved successfully",
      error: "Failed to approve selected users",
    })
  }

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return

    const rejectPromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await bulkRejectUsers(selectedIds)
          setSelectedIds([])
          setShowBulkRejectDialog(false)
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(rejectPromise, {
      loading: `Rejecting ${selectedIds.length} user(s)...`,
      success: "Selected user registrations rejected",
      error: "Failed to reject selected users",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/60 border border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-xs font-semibold text-muted-foreground">
            {selectedIds.length} user{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkApprove}
              disabled={isPending}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
              Approve Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkRejectDialog(true)}
              disabled={isPending}
              className="gap-1 font-semibold text-xs h-8"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={pendingUsers.length > 0 && selectedIds.length === pendingUsers.length}
                    onCheckedChange={toggleSelectAll}
                    disabled={pendingUsers.length === 0}
                  />
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">User</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Username</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Requested At</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs">
                    No pending approval requests.
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map((u) => {
                  const isSelected = selectedIds.includes(u.id)
                  return (
                    <TableRow
                      key={u.id || u._id}
                      className={`border-border/40 transition-colors ${
                        isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                      }`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(u.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-xs border border-border/40 shadow-xs">
                            {u.name ? u.name[0].toUpperCase() : "U"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate text-foreground">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {u.username ? `@${u.username}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(u.id)}
                            disabled={isPending}
                            className="size-8 text-emerald-600 hover:bg-emerald-600/10 dark:text-emerald-400"
                            title="Approve User"
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRejectingUserId(u.id)}
                            disabled={isPending}
                            className="size-8 text-rose-600 hover:bg-rose-600/10 dark:text-rose-400"
                            title="Reject User"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectingUserId} onOpenChange={(open) => !open && setRejectingUserId(null)}>
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">Reject User</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to reject this registration request? Rejecting will remove their account permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleReject}>Reject User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject Dialog */}
      <AlertDialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-500" />
              Reject Selected Users
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to reject the {selectedIds.length} selected users? This action is irreversible and will delete their registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBulkReject}>Reject Selected</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
