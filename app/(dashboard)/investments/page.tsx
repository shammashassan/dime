import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Investments",
  description: "Monitor investment portfolios, asset allocations, capital gains, and performance.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getPortfolioHoldings, getRecentInvestmentTransactions } from "@/lib/queries/investments"
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

  const [holdings, allWallets, baseCurrency, recentTransactions] = await Promise.all([
    getPortfolioHoldings(),
    getCollection<Wallet>("wallets").then((c) =>
      c.find({ type: "investment", ...getScopeFilter(scope) }).toArray()
    ),
    getActiveBaseCurrency(),
    getRecentInvestmentTransactions(10),
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

  const portfolioData = buildPortfolioViewModel(holdings, convert)
  const accountData = allWallets.map((wallet) => buildAccountViewModel(holdings, wallet, convert))

  const serialized = serializeData({
    accounts: allWallets,
    holdings: normalizedHoldings,
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

