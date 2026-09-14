import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Wallets & Accounts",
  description: "Manage bank accounts, digital wallets, credit cards, and cash balances.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { WalletsView } from "@/components/wallets/wallets-view"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { WalletsSkeleton } from "./loading"

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
