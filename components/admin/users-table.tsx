"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AdminUser } from "@/lib/queries/admin"
import { UserActionsMenu } from "./user-actions-menu"
import { formatDate } from "@/lib/utils"
import { Search } from "lucide-react"

interface UsersTableProps {
  users: AdminUser[]
  currentUserRole: string
  currentUserId: string
}

export function UsersTable({ users, currentUserRole, currentUserId }: UsersTableProps) {
  const [search, setSearch] = useState("")

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.username && u.username.toLowerCase().includes(s))
    )
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search name, email, username..."
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
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Role</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Joined</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <TableRow key={u.id || u._id} className="border-border/40 hover:bg-muted/40 transition-colors">
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
                      <TableCell>
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                            u.role === "admin" ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.banned ? (
                          <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            Banned
                          </Badge>
                        ) : u.approved ? (
                          <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 text-amber-500 border-amber-500/20 bg-amber-500/5">
                            Pending Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActionsMenu
                          user={u}
                          currentUserRole={currentUserRole}
                          currentUserId={currentUserId}
                        />
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
