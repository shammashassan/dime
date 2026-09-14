import { Suspense } from "react"
import type { Metadata } from "next"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialInsightsData } from "@/lib/queries/insights"
import { InsightsClient } from "@/components/insights/insights-client"
import { serializeData } from "@/lib/utils"
import InsightsLoading from "./loading"

export const metadata: Metadata = {
  title: "AI Spending Insights",
  description: "Automated anomaly detection, subscription tracking, and intelligent spending optimization.",
}

async function InsightsPageContent() {
  const session = await requireApprovedUser()
  const data = await getFinancialInsightsData(session.user.id)
  const serialized = serializeData(data)

  return <InsightsClient data={serialized} />
}

export default async function InsightsPage() {
  return (
    <Suspense fallback={<InsightsLoading />}>
      <InsightsPageContent />
    </Suspense>
  )
}
