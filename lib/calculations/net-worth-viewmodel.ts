import { Wallet, Transaction, Loan, LoanRepayment, Asset, AssetValuation, NetWorthOverviewViewModel, NetWorthHolding, NetWorthActivityEvent, NetWorthInsight, HistoricalNetWorthPoint } from "@/types"
import { calculateCurrentNetWorth } from "./net-worth"

export function generateNetWorthOverviewViewModel(params: {
  wallets: Wallet[]
  loans: Loan[]
  assets: Asset[]
  valuations: AssetValuation[]
  repayments: LoanRepayment[]
  transactions: Transaction[]
  convert: (amount: number, from: string) => number
  baseCurrency: string
  history: HistoricalNetWorthPoint[]
}): NetWorthOverviewViewModel {
  const { wallets, loans, assets, valuations, repayments, transactions, convert, baseCurrency, history } = params

  // 1. Core breakdown
  const current = calculateCurrentNetWorth({ wallets, loans, assets, convert })

  // 2. Map holdings (Top Assets and Top Liabilities)
  const holdings: NetWorthHolding[] = []

  // Add wallets
  for (const w of wallets) {
    if (w.isArchived) continue
    const val = w.balance
    const isAsset = w.type !== "credit_card"
    holdings.push({
      id: w._id.toString(),
      name: w.name,
      source: "wallet",
      kind: isAsset ? "asset" : "liability",
      category: w.type,
      currentValue: isAsset ? convert(val, w.currency) : convert(-val, w.currency),
      percentage: 0,
      currency: baseCurrency,
      originalValue: Math.abs(val),
      originalCurrency: w.currency,
      icon: w.icon || (isAsset ? "Wallet" : "CreditCard"),
      href: `/wallets/${w._id.toString()}`,
    })
  }

  // Add loans
  for (const l of loans) {
    if (l.status === "cancelled" || l.status === "fully_repaid") continue
    const isAsset = l.type === "lent"
    holdings.push({
      id: l._id.toString(),
      name: `Loan to ${l.personName || "Unknown"}`,
      source: "loan",
      kind: isAsset ? "asset" : "liability",
      category: l.type,
      currentValue: convert(l.remainingAmount, l.currency),
      percentage: 0,
      currency: baseCurrency,
      originalValue: l.remainingAmount,
      originalCurrency: l.currency,
      icon: "HandCoins",
      href: `/loans/${l._id.toString()}`,
    })
  }

  // Add manual assets
  for (const a of assets) {
    if (a.status !== "active") continue
    const val = Math.round(a.currentValue * (a.ownershipPercentage / 100))
    const isAsset = a.kind === "asset"
    holdings.push({
      id: a._id.toString(),
      name: a.name,
      source: "asset",
      kind: isAsset ? "asset" : "liability",
      category: a.category,
      currentValue: convert(val, a.currency),
      percentage: 0,
      currency: baseCurrency,
      originalValue: val,
      originalCurrency: a.currency,
      icon: "Layers",
      href: `/net-worth/assets/${a._id.toString()}`,
    })
  }

  // Calculate percentages
  const topAssets = holdings
    .filter((h) => h.kind === "asset")
    .map((h) => ({
      ...h,
      percentage: current.totalAssets > 0 ? Math.round((h.currentValue / current.totalAssets) * 100) : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue)

  const topLiabilities = holdings
    .filter((h) => h.kind === "liability")
    .map((h) => ({
      ...h,
      percentage: current.totalLiabilities > 0 ? Math.round((h.currentValue / current.totalLiabilities) * 100) : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue)

  // 3. Health metrics
  const liquidityRatio = current.totalAssets > 0
    ? Math.min(100, Math.round(((current.assetsBreakdown.cash + current.assetsBreakdown.bank) / current.totalAssets) * 100))
    : 0
  const debtRatio = current.totalAssets > 0
    ? Math.min(100, Math.round((current.totalLiabilities / current.totalAssets) * 100))
    : 0

  let moMChangePct = 0
  let netWorthTrend: "up" | "down" | "flat" = "flat"
  if (history.length >= 2) {
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const startPoint = sorted[0].netWorth
    const endPoint = current.netWorth
    if (startPoint !== 0) {
      moMChangePct = ((endPoint - startPoint) / Math.abs(startPoint)) * 100
    }
    netWorthTrend = endPoint > startPoint ? "up" : endPoint < startPoint ? "down" : "flat"
  }

  // 4. Activity events
  const activityEvents: NetWorthActivityEvent[] = []

  // Create lookup maps for O(1) key searches, avoiding quadratic iteration in the loop
  const assetsMap = new Map(assets.map((a) => [a._id.toString(), a]))
  const loansMap = new Map(loans.map((l) => [l._id.toString(), l]))

  // Add valuation updates
  for (const v of valuations) {
    const asset = assetsMap.get(v.assetId)
    if (!asset) continue
    activityEvents.push({
      id: v._id.toString(),
      type: "valuation",
      date: new Date(v.date),
      title: "Valuation Updated",
      description: `${asset.name} updated to ${asset.currency} ${(v.value / 100).toFixed(2)}`,
      amount: v.value,
      currency: asset.currency,
      href: `/net-worth/assets/${asset._id.toString()}`,
    })
  }

  // Add repayments
  for (const rep of repayments) {
    const loan = loansMap.get(rep.loanId)
    if (!loan) continue
    activityEvents.push({
      id: rep._id.toString(),
      type: "repayment",
      date: new Date(rep.date),
      title: "Loan Repayment",
      description: `Repayment received on loan to ${loan.personName}`,
      amount: rep.amount,
      currency: loan.currency,
      href: `/loans/${loan._id.toString()}`,
    })
  }

  // Add transactions
  for (const tx of transactions.slice(0, 100)) {
    if (tx.amount < 10000) continue // Only showcase high value txs
    activityEvents.push({
      id: tx._id.toString(),
      type: "transaction",
      date: new Date(tx.date),
      title: tx.type === "income" ? "High Income" : "High Expense",
      description: tx.description || `${tx.type} transaction logged`,
      amount: tx.amount,
      currency: tx.currency,
      href: `/transactions/${tx._id.toString()}`,
    })
  }

  const recentActivity = activityEvents
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6)

  // 5. Deterministic rule-based insights
  const insights: NetWorthInsight[] = []

  if (moMChangePct !== 0) {
    insights.push({
      id: "mom",
      type: moMChangePct >= 0 ? "success" : "warning",
      text: `Your net worth has ${moMChangePct >= 0 ? "increased" : "decreased"} by ${Math.abs(moMChangePct).toFixed(1)}% compared to the beginning of this history interval.`,
      metric: `${moMChangePct >= 0 ? "+" : ""}${moMChangePct.toFixed(1)}%`,
      href: "/reports",
    })
  }

  if (topAssets.length > 0) {
    const largest = topAssets[0]
    insights.push({
      id: "largest-asset",
      type: "info",
      text: `Your largest asset is ${largest.name}, contributing ${largest.percentage}% of your total portfolio assets.`,
      metric: `${largest.percentage}%`,
      href: largest.href || "/net-worth",
    })
  }

  insights.push({
    id: "liquidity",
    type: liquidityRatio > 20 ? "success" : "info",
    text: `Your liquid cash and bank balances represent ${liquidityRatio}% of your total assets. ${
      liquidityRatio < 15 ? "Consider keeping more funds in liquid form." : "Your liquidity profile looks stable."
    }`,
    metric: `${liquidityRatio}%`,
    href: "/wallets",
  })

  insights.push({
    id: "debt",
    type: debtRatio > 50 ? "warning" : debtRatio > 30 ? "info" : "success",
    text: `Your debt-to-asset ratio is ${debtRatio}%. ${
      debtRatio > 50
        ? "Warning: Debt ratio exceeds healthy threshold. Try to pay down liabilities."
        : debtRatio > 30
        ? "Moderate debt relative to assets. Keep monitoring outstanding balances."
        : "Healthy balance sheet with low leverage."
    }`,
    metric: `${debtRatio}%`,
    href: "/loans",
  })

  return {
    currency: baseCurrency,
    netWorth: current.netWorth,
    totalAssets: current.totalAssets,
    totalLiabilities: current.totalLiabilities,
    moMChangePct,
    largestAsset: topAssets.length > 0 ? { name: topAssets[0].name, value: topAssets[0].currentValue } : undefined,
    liquidityRatio,
    debtRatio,
    largestLiability: topLiabilities.length > 0 ? { name: topLiabilities[0].name, value: topLiabilities[0].currentValue } : undefined,
    netWorthTrend,
    topAssets: topAssets.slice(0, 5),
    topLiabilities: topLiabilities.slice(0, 5),
    recentActivity,
    insights,
  }
}
