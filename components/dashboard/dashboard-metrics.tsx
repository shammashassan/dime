import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { getLoans, getActiveBaseCurrency } from "@/lib/queries/loans"
import { getAssetsAndValuationsForScope } from "@/lib/queries/assets"
import { getIncomeExpenseTrend } from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { calculateCurrentNetWorth } from "@/lib/calculations/net-worth"
import { getCurrencyConverter } from "@/lib/currency"
import { formatCurrency } from "@/lib/utils"
import { getPortfolioHoldings } from "@/lib/queries/investments"
import { MetricCard } from "@/components/ui/metric-card"
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown } from "lucide-react"

interface DashboardMetricsProps {
  userId: string
}

export async function DashboardMetrics({ userId }: DashboardMetricsProps) {
  // Parallel fetching for all required elements to construct the true net worth
  const [wallets, loans, { assets }, baseCurrency, trend, prefs, investmentHoldings] = await Promise.all([
    getAllWalletsIncludingArchived(userId),
    getLoans(),
    getAssetsAndValuationsForScope(),
    getActiveBaseCurrency(),
    getIncomeExpenseTrend(userId, 2),
    getPreferences(userId),
    getPortfolioHoldings()
  ])

  const targetCurrency = baseCurrency || prefs.defaultCurrency || "USD"

  // 1. Unified Net Worth calculation matching the Net Worth dashboard
  const sourceCurrencies = Array.from(
    new Set([
      ...wallets.map((w) => w.currency),
      ...loans.map((l) => l.currency),
      ...assets.map((a) => a.currency),
    ])
  )

  const convert = await getCurrencyConverter(targetCurrency, sourceCurrencies)

  const breakdown = calculateCurrentNetWorth({
    wallets,
    loans,
    assets,
    investmentHoldings,
    convert
  })

  const netWorth = breakdown.netWorth

  // 2. Income / Expense / Savings this month
  let thisMonth = { income: 0, expense: 0 }
  let lastMonth = { income: 0, expense: 0 }

  if (trend.length >= 2) {
    lastMonth = trend[trend.length - 2]
    thisMonth = trend[trend.length - 1]
  } else if (trend.length === 1) {
    thisMonth = trend[0]
  }

  const savings = thisMonth.income - thisMonth.expense
  const savingsLastMonth = lastMonth.income - lastMonth.expense
  const savingsDiff = savings - savingsLastMonth

  return (
    <div className="flex flex-wrap gap-4">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
        icon={Landmark}
        color="#8b5cf6"
        label="Net Worth"
        value={formatCurrency(netWorth, targetCurrency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
        icon={ArrowUpRight}
        color="#10b981"
        label="Income This Month"
        value={formatCurrency(thisMonth.income * 100, targetCurrency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
        icon={ArrowDownRight}
        color="#f43f5e"
        label="Expenses This Month"
        value={formatCurrency(thisMonth.expense * 100, targetCurrency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
        icon={Wallet}
        color="#3b82f6"
        label="Monthly Savings"
        value={formatCurrency(savings * 100, targetCurrency)}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
        icon={savingsDiff >= 0 ? TrendingUp : TrendingDown}
        color={savingsDiff >= 0 ? "#10b981" : "#f43f5e"}
        label="Savings Trend"
        value={formatCurrency(Math.abs(savingsDiff) * 100, targetCurrency)}
        valueClassName={savingsDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
      />
    </div>
  )
}
