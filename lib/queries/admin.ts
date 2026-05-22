import { cache } from "react"
import { getCollection } from "@/lib/db/collections"

export interface AdminUser {
  _id: any
  id: string
  name: string
  email: string
  username?: string
  role: string
  banned?: boolean
  banReason?: string
  banExpires?: any
  approved: boolean
  createdAt: Date
  image?: string
}

export const getAdminStats = cache(async () => {
  const usersColl = await getCollection<AdminUser>("user")

  const [totalApproved, pendingApproval, banned, admins] = await Promise.all([
    usersColl.countDocuments({ approved: true, $or: [{ banned: false }, { banned: { $exists: false } }] }),
    usersColl.countDocuments({ approved: false, $or: [{ banned: false }, { banned: { $exists: false } }] }),
    usersColl.countDocuments({ banned: true }),
    usersColl.countDocuments({ role: "admin" }),
  ])

  return {
    totalApproved,
    pendingApproval,
    banned,
    admins,
  }
})

export const getAdminUsers = cache(async (): Promise<AdminUser[]> => {
  const usersColl = await getCollection<AdminUser>("user")
  const users = await usersColl.find().sort({ createdAt: -1 }).toArray()
  return users.map((user) => ({
    ...user,
    id: user.id || (user as any)._id?.toString() || "",
  }))
})
