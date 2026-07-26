import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
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

      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={UserCheck}
          color="#10b981"
          label="Approved Users"
          value={stats.totalApproved}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={Users}
          color="#f59e0b"
          label="Pending Approval"
          value={stats.pendingApproval}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={UserMinus}
          color="#f43f5e"
          label="Banned Users"
          value={stats.banned}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={ShieldAlert}
          color="#8b5cf6"
          label="Administrators"
          value={stats.admins}
        />
      </div>
    </div>
  )
}
