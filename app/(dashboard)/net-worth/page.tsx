import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { getLoans, getActiveBaseCurrency } from "@/lib/queries/loans"
import { getAssetsAndValuationsForScope } from "@/lib/queries/assets"
import { getCurrencyConverter } from "@/lib/currency"
import { calculateNetWorthHistory } from "@/lib/calculations/net-worth"
import { generateNetWorthOverviewViewModel } from "@/lib/calculations/net-worth-viewmodel"
import { loanRepaymentsCollection, transactionsCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { serializeData } from "@/lib/utils"
import { subMonths, startOfMonth, eachDayOfInterval, startOfDay } from "date-fns"
import { NetWorthOverview } from "@/components/net-worth/net-worth-overview"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, Loan, LoanRepayment, Asset } from "@/types"



function NetWorthSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-pulse p-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[220px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-9 w-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[320px] w-full rounded-2xl md:col-span-2" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </div>
    </div>
  )
}

async function NetWorthContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const [wallets, loans, { assets, valuations }, baseCurrency] = await Promise.all([
    getAllWalletsIncludingArchived(userId),
    getLoans(),
    getAssetsAndValuationsForScope(),
    getActiveBaseCurrency(),
  ])

  const loanIds = loans.map((l) => l._id.toString())
  const [repayments, transactions] = await Promise.all([
    loanIds.length > 0
      ? loanRepaymentsCollection.find({ loanId: { $in: loanIds } }).toArray()
      : Promise.resolve([] as LoanRepayment[]),
    transactionsCollection
      .find({
        ...filter,
        date: { $gte: startOfMonth(subMonths(new Date(), 5)) },
      })
      .toArray(),
  ])

  const serialized = serializeData({
    wallets,
    loans,
    repayments,
    transactions,
    assets,
    valuations,
  })

  const sourceCurrencies = Array.from(
    new Set([
      ...serialized.wallets.map((w: Wallet) => w.currency),
      ...serialized.loans.map((l: Loan) => l.currency),
      ...serialized.assets.map((a: Asset) => a.currency),
    ])
  )

  const convert = await getCurrencyConverter(baseCurrency, sourceCurrencies)

  const historyStart = startOfMonth(subMonths(new Date(), 5))
  const dates: Date[] = eachDayOfInterval({
    start: historyStart,
    end: startOfDay(new Date()),
  })

  const history = calculateNetWorthHistory({
    wallets: serialized.wallets,
    transactions: serialized.transactions,
    loans: serialized.loans,
    repayments: serialized.repayments,
    assets: serialized.assets,
    valuations: serialized.valuations,
    convert,
    dates,
  })

  const viewModel = generateNetWorthOverviewViewModel({
    wallets: serialized.wallets,
    loans: serialized.loans,
    assets: serialized.assets,
    valuations: serialized.valuations,
    repayments: serialized.repayments,
    transactions: serialized.transactions,
    convert,
    baseCurrency,
    history,
  })

  const serializedViewModel = serializeData(viewModel)
  const serializedHistory = serializeData(history)

  return (
    <NetWorthOverview
      viewModel={serializedViewModel}
      historyData={serializedHistory}
      assets={serialized.assets}
    />
  )
}

export default async function NetWorthPage() {
  return (
    <Suspense fallback={<NetWorthSkeleton />}>
      <NetWorthContent />
    </Suspense>
  )
}