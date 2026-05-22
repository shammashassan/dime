import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { WalletsView } from "@/components/wallets/wallets-view"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function WalletsSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    </div>
  )
}

async function WalletsContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const wallets = await getAllWalletsIncludingArchived(userId)

  return <WalletsView wallets={serializeData(wallets)} />
}

export default async function WalletsPage() {
  return (
    <Suspense fallback={<WalletsSkeleton />}>
      <WalletsContent />
    </Suspense>
  )
}
