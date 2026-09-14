import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin",
  description: "Dime administrative management.",
}

export default function AdminRootPage() {
  redirect("/admin/users")
}
