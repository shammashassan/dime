import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const getCachedSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() })
})

export const requireAuth = cache(async () => {
  const session = await getCachedSession()
  if (!session) redirect("/sign-in")
  return session
})

export const requireApprovedUser = requireAuth

export const requireAdmin = cache(async () => {
  const session = await requireApprovedUser()
  if (session.user.role !== "admin") redirect("/")
  return session
})
