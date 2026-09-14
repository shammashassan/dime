import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Financial Health",
  description: "Assess your financial health score, emergency savings, and debt-to-income ratio.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialHealthData } from "@/lib/queries/financial-health"
import { HealthClient } from "@/components/health/health-client"
import { serializeData } from "@/lib/utils"
import HealthLoading from "./loading"

async function HealthPageContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const healthData = await getFinancialHealthData(userId)
  const serializedData = serializeData(healthData)

  return <HealthClient data={serializedData} />
}

export default async function HealthPage() {
  return (
    <Suspense fallback={<HealthLoading />}>
      <HealthPageContent />
    </Suspense>
  )
}
