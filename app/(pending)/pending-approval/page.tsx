import { PendingApprovalView } from "@/components/auth/pending-approval-view"

export const metadata = {
  title: "Pending Approval",
  description: "Your Dime account registration is pending administrator authorization.",
}

export default function PendingApprovalPage() {
  return <PendingApprovalView />
}
