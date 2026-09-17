import { Suspense } from "react"
import type { Metadata } from "next"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getCoachOverviewData } from "@/lib/queries/coach"
import { CoachClient } from "@/components/coach/coach-client"
import { serializeData } from "@/lib/utils"
import CoachLoading from "./loading"

export const metadata: Metadata = {
  title: "Financial Coach",
  description: "Automated optimization strategies, debt payoff modeling, and personal financial coaching.",
}

async function CoachPageContent() {
  const session = await requireApprovedUser()
  const data = await getCoachOverviewData(session.user.id)
  const serializedData = serializeData(data)

  return <CoachClient data={serializedData} userName={session.user.name} />
}

export default async function CoachPage() {
  return (
    <Suspense fallback={<CoachLoading />}>
      <CoachPageContent />
    </Suspense>
  )
}
