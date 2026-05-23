"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminUser } from "@/lib/queries/admin"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Search, ShieldAlert, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface BannedTableProps {
  users: AdminUser[]
}

export function BannedTable({ users }: BannedTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [unbanningUserId, setUnbanningUserId] = useState<string | null>(null)

  const bannedUsers = users.filter((u) => u.banned)

  const filteredUsers = bannedUsers.filter((u) => {
    const s = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.username && u.username.toLowerCase().includes(s))
    )
  })

  const handleUnban = (userId: string) => {
    setUnbanningUserId(userId)

    const unbanPromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await authClient.admin.unbanUser({
            userId,
          })
          router.refresh()
          resolve(true)
        } catch (err) {
          reject(err)
        } finally {
          setUnbanningUserId(null)
        }
      })
    })

    toast.promise(unbanPromise, {
      loading: "Unbanning user...",
      success: "User unbanned successfully",
      error: "Failed to unban user",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search banned users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-semibold">User</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Username</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Reason</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Banned Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs">
                    No banned users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const isUnbanning = unbanningUserId === u.id
                  return (
                    <TableRow key={u.id || u._id} className="border-border/40 hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive font-semibold text-xs border border-destructive/20 shadow-xs">
                            <ShieldAlert className="size-4" />
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
                      <TableCell className="text-xs font-medium text-destructive max-w-[200px] truncate">
                        {u.banReason || "No reason provided"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {u.banExpires ? formatDate(u.banExpires) : "Permanent"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(u.id)}
                          disabled={isPending}
                          className="h-8 text-xs font-semibold"
                        >
                          {isUnbanning && <Loader2 className="size-3 animate-spin mr-1.5" />}
                          Unban User
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
