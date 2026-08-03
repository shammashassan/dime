import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getPortfolioHoldings, getRecentInvestmentTransactions } from "@/lib/queries/investments"
import { getCollection } from "@/lib/db/collections"
import { Wallet } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getActiveBaseCurrency } from "@/lib/queries/loans"
import { buildPortfolioViewModel, buildAccountViewModel } from "@/lib/calculations/investments"
import { InvestmentsView } from "@/components/investments/investments-view"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function InvestmentsSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[280px] w-full rounded-2xl lg:col-span-1" />
        <Skeleton className="h-[280px] w-full rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}

async function InvestmentsContent() {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const [holdings, allWallets, baseCurrency, recentTransactions] = await Promise.all([
    getPortfolioHoldings(),
    getCollection<Wallet>("wallets").then((c) =>
      c.find({ type: "investment", ...getScopeFilter(scope) }).toArray()
    ),
    getActiveBaseCurrency(),
    getRecentInvestmentTransactions(10),
  ])

  const portfolioData = buildPortfolioViewModel(holdings)
  const accountData = allWallets.map((wallet) => buildAccountViewModel(holdings, wallet))

  const serialized = serializeData({
    accounts: allWallets,
    holdings,
    portfolioData,
    accountData,
    recentTransactions,
  })

  return (
    <InvestmentsView
      accounts={serialized.accounts}
      holdings={serialized.holdings}
      portfolioData={serialized.portfolioData}
      accountData={serialized.accountData}
      transactions={serialized.recentTransactions}
      currency={baseCurrency}
    />
  )
}

export default async function InvestmentsPage() {
  return (
    <Suspense fallback={<InvestmentsSkeleton />}>
      <InvestmentsContent />
    </Suspense>
  )
}

