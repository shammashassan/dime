import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAdminStats } from "@/lib/queries/admin"
import { Users, UserCheck, UserMinus, ShieldAlert, AlertTriangle } from "lucide-react"

export async function AdminStats() {
  const stats = await getAdminStats()

  return (
    <div className="flex flex-col gap-6">
      {stats.pendingApproval > 0 && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4 text-amber-500" />
          <AlertTitle className="font-bold">Pending Approvals</AlertTitle>
          <AlertDescription className="text-xs">
            There {stats.pendingApproval === 1 ? "is 1 user" : `are ${stats.pendingApproval} users`} waiting for approval. Please review their applications under the "Pending Approval" tab.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Approved Users */}
        <Card className="border border-border/40 shadow-md bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Approved Users
            </CardDescription>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalApproved}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active registered accounts</p>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card className="border border-border/40 shadow-md bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Pending Approval
            </CardDescription>
            <Users className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendingApproval}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Awaiting administrator review</p>
          </CardContent>
        </Card>

        {/* Banned Users */}
        <Card className="border border-border/40 shadow-md bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Banned Users
            </CardDescription>
            <UserMinus className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.banned}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Suspended user accounts</p>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card className="border border-border/40 shadow-md bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Administrators
            </CardDescription>
            <ShieldAlert className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.admins}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Privileged admin accounts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
