import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accept Invitation",
  description: "Accept an invitation to join an organization on Dime.",
}

export default function AcceptInvitationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
