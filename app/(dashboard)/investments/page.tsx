import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Investments",
  description: "Monitor investment portfolios, asset allocations, capital gains, and performance.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import {
  getPortfolioHoldings,
  getAllInvestmentTransactions,
  getDividendTransactions,
  getWatchlists,
} from "@/lib/queries/investments"
import { getCollection } from "@/lib/db/collections"
import { Wallet } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getActiveBaseCurrency } from "@/lib/queries/loans"
import { getCurrencyConverter } from "@/lib/currency"
import { buildPortfolioViewModel, buildAccountViewModel } from "@/lib/calculations/investments"
import { InvestmentsView } from "@/components/investments/investments-view"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { InvestmentsSkeleton } from "./loading"

async function InvestmentsContent() {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const [
    holdings,
    allWallets,
    baseCurrency,
    allTransactions,
    dividendTransactions,
    watchlists,
  ] = await Promise.all([
    getPortfolioHoldings(),
    getCollection<Wallet>("wallets").then((c) =>
      c.find({ type: "investment", ...getScopeFilter(scope) }).toArray()
    ),
    getActiveBaseCurrency(),
    getAllInvestmentTransactions(),
    getDividendTransactions(session.user.id),
    getWatchlists(session.user.id),
  ])

  const holdingCurrencies = holdings.map((h) => h.currency || "USD")
  const walletCurrencies = allWallets.map((w) => w.currency || "USD")
  const allCurrencies = Array.from(new Set([...holdingCurrencies, ...walletCurrencies]))
  const convert = await getCurrencyConverter(baseCurrency, allCurrencies)

  const normalizedHoldings = holdings.map((h) => {
    const rawVal = h.quantity * h.currentPrice
    const rawCost = h.totalCostBasis
    const rawGain = rawVal - rawCost
    const holdingCurrency = h.currency || "USD"
    return {
      ...h,
      convertedCurrentValue: convert(rawVal, holdingCurrency),
      convertedTotalCostBasis: convert(rawCost, holdingCurrency),
      convertedUnrealizedGain: convert(rawGain, holdingCurrency),
    }
  })

  // Merge transactions without duplicates
  const txMap = new Map<string, any>()
  for (const t of allTransactions) txMap.set(t._id.toString(), t)
  for (const t of dividendTransactions) txMap.set(t._id.toString(), t)
  const mergedTransactions = Array.from(txMap.values())

  const portfolioData = buildPortfolioViewModel(holdings, convert)
  const accountData = allWallets.map((wallet) => buildAccountViewModel(holdings, wallet, convert))

  const serialized = serializeData({
    accounts: allWallets,
    holdings: normalizedHoldings,
    portfolioData,
    accountData,
    transactions: mergedTransactions,
    watchlists,
  })

  return (
    <InvestmentsView
      accounts={serialized.accounts}
      holdings={serialized.holdings}
      portfolioData={serialized.portfolioData}
      accountData={serialized.accountData}
      transactions={serialized.transactions}
      currency={baseCurrency}
      watchlists={serialized.watchlists}
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

