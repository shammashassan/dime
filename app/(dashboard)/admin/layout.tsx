import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth-guard"

async function AdminGuard() {
  await requireAdmin()
  return null
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AdminGuard />
      </Suspense>
      {children}
    </>
  )
}
