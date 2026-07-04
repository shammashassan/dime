import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getWallets } from "@/lib/queries/wallets"
import { getCategories } from "@/lib/queries/categories"
import { getFilteredTransactions, getFilteredTransactionsCount } from "@/lib/queries/transactions"
import { TransactionsView } from "@/components/transactions/transactions-view"
import { Skeleton } from "@/components/ui/skeleton"
import { serializeData } from "@/lib/utils"

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}

async function TransactionsContent({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    type?: string
    wallets?: string
    categories?: string
    minAmount?: string
    maxAmount?: string
    from?: string
    to?: string
    page?: string
    sortBy?: string
    sortOrder?: string
    pageSize?: string
  }>
}) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  const params = await searchParams

  const page = params.page ? parseInt(params.page, 10) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 20
  const skip = (page - 1) * pageSize

  // Parse filters
  const typeFilter =
    params.type === "income" || params.type === "expense" || params.type === "transfer"
      ? (params.type as "income" | "expense" | "transfer")
      : undefined

  const filters = {
    search: params.search || undefined,
    type: typeFilter,
    walletIds: params.wallets ? params.wallets.split(",").filter(Boolean) : undefined,
    categoryIds: params.categories ? params.categories.split(",").filter(Boolean) : undefined,
    minAmount: params.minAmount ? Math.round(parseFloat(params.minAmount) * 100) : undefined,
    maxAmount: params.maxAmount ? Math.round(parseFloat(params.maxAmount) * 100) : undefined,
    startDate: params.from ? new Date(new Date(params.from).toISOString().slice(0, 10) + "T00:00:00.000Z") : undefined,
    endDate: params.to ? new Date(new Date(params.to).toISOString().slice(0, 10) + "T23:59:59.999Z") : undefined,
  }

  // Parse sort
  const sortBy =
    params.sortBy === "amount" || params.sortBy === "description" || params.sortBy === "date"
      ? (params.sortBy as "date" | "amount" | "description")
      : "date"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"

  // Fetch in parallel
  const [wallets, categories, transactions, totalCount] = await Promise.all([
    getWallets(userId),
    getCategories(userId),
    getFilteredTransactions(userId, filters, { limit: pageSize, skip }, { sortBy, sortOrder }),
    getFilteredTransactionsCount(userId, filters),
  ])

  return (
    <TransactionsView
      transactions={serializeData(transactions)}
      categories={serializeData(categories)}
      wallets={serializeData(wallets)}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  )
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    type?: string
    wallets?: string
    categories?: string
    minAmount?: string
    maxAmount?: string
    from?: string
    to?: string
    page?: string
    pageSize?: string
  }>
}) {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  )
}
