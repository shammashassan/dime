import { MetricCard } from "@/components/ui/metric-card"
import { getAdminStats } from "@/lib/queries/admin"
import { Users, UserCheck, UserMinus, ShieldAlert } from "lucide-react"

export async function AdminStats() {
  const stats = await getAdminStats()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={UserCheck}
          color="#10b981"
          label="Active Users"
          value={stats.totalActive}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={UserMinus}
          color="#f43f5e"
          label="Banned Users"
          value={stats.banned}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={ShieldAlert}
          color="#8b5cf6"
          label="Administrators"
          value={stats.admins}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Users}
          color="#3b82f6"
          label="Total Accounts"
          value={stats.totalActive + stats.banned}
        />
      </div>
    </div>
  )
}
