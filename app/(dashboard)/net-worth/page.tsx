import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { getLoans, getActiveBaseCurrency } from "@/lib/queries/loans"
import { getAssetsAndValuationsForScope } from "@/lib/queries/assets"
import { getCurrencyConverter } from "@/lib/currency"
import { calculateCurrentNetWorth, calculateNetWorthHistory } from "@/lib/net-worth/calculations"
import { db } from "@/lib/db/client"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { serializeData } from "@/lib/utils"
import { endOfMonth, subMonths, startOfMonth } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetWorthOverview } from "@/components/net-worth/net-worth-overview"
import { AssetsListTab } from "@/components/net-worth/assets-list-tab"
import { Skeleton } from "@/components/ui/skeleton"

export const experimental_ppr = true // Opt-in to PPR as per workspace rule

function NetWorthSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-2xl" />
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
    getActiveBaseCurrency()
  ])

  const loanIds = loans.map(l => l._id.toString())
  const [repayments, transactions] = await Promise.all([
    loanIds.length > 0
      ? db.collection("loan_repayments").find({ loanId: { $in: loanIds } }).toArray() as any
      : Promise.resolve([]),
    db.collection("transactions").find({
      ...filter,
      date: { $gte: startOfMonth(subMonths(new Date(), 5)) }
    }).toArray() as any
  ])

  const serialized = serializeData({
    wallets,
    loans,
    repayments,
    transactions,
    assets,
    valuations
  })

  const sourceCurrencies = Array.from(new Set([
    ...serialized.wallets.map((w: any) => w.currency),
    ...serialized.loans.map((l: any) => l.currency),
    ...serialized.assets.map((a: any) => a.currency)
  ]))
  
  const convert = await getCurrencyConverter(baseCurrency, sourceCurrencies)

  const currentBreakdown = calculateCurrentNetWorth({
    wallets: serialized.wallets,
    loans: serialized.loans,
    assets: serialized.assets,
    convert
  })

  const dates: Date[] = []
  for (let i = 5; i >= 0; i--) {
    dates.push(endOfMonth(subMonths(new Date(), i)))
  }

  const history = calculateNetWorthHistory({
    wallets: serialized.wallets,
    transactions: serialized.transactions,
    loans: serialized.loans,
    repayments: serialized.repayments,
    assets: serialized.assets,
    valuations: serialized.valuations,
    convert,
    dates
  })

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Net Worth</h1>
        <p className="text-sm text-muted-foreground">
          Track assets, liabilities, allocations, and historical trends across currencies.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-xl p-1 border border-border/40">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2 font-semibold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets-list" className="rounded-lg px-4 py-2 font-semibold">
            Assets & Liabilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 outline-none">
          <NetWorthOverview
            current={currentBreakdown}
            history={history}
            currency={baseCurrency}
          />
        </TabsContent>

        <TabsContent value="assets-list" className="mt-0 outline-none">
          <AssetsListTab assets={serialized.assets} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default async function NetWorthPage() {
  return (
    <Suspense fallback={<NetWorthSkeleton />}>
      <NetWorthContent />
    </Suspense>
  )
}
