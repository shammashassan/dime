import React, { Suspense } from "react"
import { Target } from "lucide-react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getGoals } from "@/lib/queries/goals"
import { getWallets } from "@/lib/queries/wallets"
import { GoalList } from "@/components/goals/goal-list"
import { Skeleton } from "@/components/ui/skeleton"
import { serializeData } from "@/lib/utils"

import { GoalsSkeleton } from "./loading"

async function GoalsContent({ userId }: { userId: string }) {
  const [goals, wallets] = await Promise.all([
    getGoals(userId),
    getWallets(userId),
  ])

  return <GoalList initialGoals={serializeData(goals)} wallets={serializeData(wallets)} />
}

export default async function GoalsPage() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent userId={userId} />
    </Suspense>
  )
}
