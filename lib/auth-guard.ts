import { auth }      from "@/lib/auth"
import { headers }   from "next/headers"
import { redirect }  from "next/navigation"

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")
  return session
}

export async function requireApprovedUser() {
  const session = await requireAuth()
  if (!(session.user as any).approved) redirect("/pending-approval")
  return session
}

export async function requireAdmin() {
  const session = await requireApprovedUser()
  if (session.user.role !== "admin") redirect("/")
  return session
}
