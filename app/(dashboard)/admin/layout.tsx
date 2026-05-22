import { requireAdmin } from "@/lib/auth-guard"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Enforce session presence and admin user status for all subroutes
  await requireAdmin()

  return <>{children}</>
}
