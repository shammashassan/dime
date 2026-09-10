import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getWalletById, getSingleWalletBalanceDailyHistory } from "@/lib/queries/wallets"
import { getFilteredTransactions } from "@/lib/queries/transactions"
import { getCategories } from "@/lib/queries/categories"
import { WalletDetails } from "@/components/wallets/wallet-details"
import { Skeleton } from "@/components/ui/skeleton"
import { serializeData } from "@/lib/utils"
import { unstable_rethrow } from "next/navigation"

import { WalletDetailSkeleton } from "./loading"

interface PageProps {
  params: Promise<{ id: string }>
}

async function WalletDetailContent({ id }: { id: string }) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let wallet
  let history
  let transactions
  let categories

  try {
    const [fetchedWallet, fetchedCategories] = await Promise.all([
      getWalletById(userId, id),
      getCategories(userId),
    ])

    if (!fetchedWallet) {
      notFound()
    }
    wallet = fetchedWallet
    categories = fetchedCategories

    const [fetchedTransactions, fetchedHistory] = await Promise.all([
      getFilteredTransactions(userId, { walletIds: [id] }, { limit: 10 }),
      getSingleWalletBalanceDailyHistory(userId, id, 90),
    ])
    transactions = fetchedTransactions
    history = fetchedHistory
  } catch (error: any) {
    unstable_rethrow(error)
    notFound()
  }

  const isOwner = wallet.userId === userId

  return (
    <WalletDetails
      wallet={serializeData(wallet)}
      history={serializeData(history)}
      transactions={serializeData(transactions)}
      categories={serializeData(categories)}
      isOwner={isOwner}
    />
  )
}

export default async function WalletDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<WalletDetailSkeleton />}>
      <WalletDetailContent id={id} />
    </Suspense>
  )
}