import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Goal Details",
  description: "View savings goal progress, contribution history, and projected completion.",
}
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getGoalById, getGoalContributions } from "@/lib/queries/goals"
import { getWallets } from "@/lib/queries/wallets"
import { GoalDetails } from "@/components/goals/goal-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { GoalDetailSkeleton } from "./loading"

interface PageProps {
  params: Promise<{ id: string }>
}

async function GoalDetailContent({ params }: PageProps) {
  const { id } = await params
  const session = await requireApprovedUser()
  const userId = session.user.id

  const [goal, contributions, wallets] = await Promise.all([
    getGoalById(userId, id),
    getGoalContributions(id),
    getWallets(userId),
  ])

  if (!goal) {
    notFound()
  }

  return (
    <GoalDetails
      goal={serializeData(goal)}
      contributions={serializeData(contributions) as any}
      wallets={serializeData(wallets)}
    />
  )
}

export default function GoalDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<GoalDetailSkeleton />}>
      <GoalDetailContent {...props} />
    </Suspense>
  )
}