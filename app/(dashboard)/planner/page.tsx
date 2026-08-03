import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getPlannerBaselineData, getPlannerScenarios } from "@/lib/queries/planner"
import { PlannerClient } from "@/components/planner/planner-client"
import { serializeData } from "@/lib/utils"
import PlannerLoading from "./loading"

async function PlannerContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const [baseline, savedScenarios] = await Promise.all([
    getPlannerBaselineData(userId),
    getPlannerScenarios(userId),
  ])

  const serializedBaseline = serializeData(baseline)
  const serializedScenarios = serializeData(savedScenarios)

  return (
    <PlannerClient
      baseline={serializedBaseline}
      savedScenarios={serializedScenarios}
    />
  )
}

export default async function PlannerPage() {
  return (
    <Suspense fallback={<PlannerLoading />}>
      <PlannerContent />
    </Suspense>
  )
}
