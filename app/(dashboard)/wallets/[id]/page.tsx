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

function WalletDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-pulse p-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[380px] w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

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