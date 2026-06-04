import React, { Suspense } from "react"
import { Target } from "lucide-react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getGoals } from "@/lib/queries/goals"
import { getWallets } from "@/lib/queries/wallets"
import { GoalList } from "@/components/goals/goal-list"
import { Skeleton } from "@/components/ui/skeleton"
import { serializeData } from "@/lib/utils"

function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

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
