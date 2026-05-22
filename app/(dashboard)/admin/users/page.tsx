import { Suspense } from "react"
import { Users } from "lucide-react"
import { requireAdmin } from "@/lib/auth-guard"
import { getAdminUsers } from "@/lib/queries/admin"
import { AdminStats } from "@/components/admin/admin-stats"
import { UsersTable } from "@/components/admin/users-table"
import { PendingTable } from "@/components/admin/pending-table"
import { BannedTable } from "@/components/admin/banned-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { serializeData } from "@/lib/utils"


function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default async function AdminUsersPage() {
  const session = await requireAdmin()
  const rawUsers = await getAdminUsers()

  const currentUserId = session.user.id
  const currentUserRole = session.user.role || "user"

  const users = serializeData(rawUsers)
  const adminUsers = users.filter((u: any) => u.role === "admin")

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="flex items-center gap-3.5">
        <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
          <Users className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review pending registrations, assign administrative privileges, and manage banned users.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>

      {/* Tabs list */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full border-b border-border/40 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="banned">Banned Users</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Suspense fallback={<TableSkeleton />}>
            <UsersTable
              users={users}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Suspense fallback={<TableSkeleton />}>
            <PendingTable users={users} />
          </Suspense>
        </TabsContent>

        <TabsContent value="banned" className="mt-4">
          <Suspense fallback={<TableSkeleton />}>
            <BannedTable users={users} />
          </Suspense>
        </TabsContent>

        <TabsContent value="admins" className="mt-4">
          <Suspense fallback={<TableSkeleton />}>
            <UsersTable
              users={adminUsers}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
