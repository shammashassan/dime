import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ObjectId } from "mongodb"
import { getPortfolioHoldings } from "@/lib/queries/investments"
import { getCollection } from "@/lib/db/collections"
import { Wallet } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { buildAccountViewModel } from "@/lib/calculations/investments"
import { HoldingsList } from "@/components/investments/holdings-list"
import { TransactionDialog } from "@/components/investments/transaction-dialog"
import { MetricCard } from "@/components/ui/metric-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, serializeData } from "@/lib/utils"
import { ChevronLeft, TrendingUp, Coins, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react"
import Link from "next/link"

function AccountDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[350px] w-full rounded-2xl" />
    </div>
  )
}

export default async function AccountDetail({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = await params
  const scope = await getFinancialScope()

  const [holdings, wallet] = await Promise.all([
    getPortfolioHoldings(),
    getCollection<Wallet>("wallets").then((c) => {
      try {
        return c.findOne({ _id: new ObjectId(accountId), type: "investment", ...getScopeFilter(scope) })
      } catch (e) {
        return null
      }
    }),
  ])

  if (!wallet) {
    notFound()
  }

  const accountData = buildAccountViewModel(holdings, wallet)
  const currency = wallet.currency || "USD"
  const isPositive = accountData.unrealizedGain >= 0
  const returnPercentage = accountData.totalCostBasis > 0 ? (accountData.unrealizedGain / accountData.totalCostBasis) * 100 : 0
  const serialized = serializeData({ wallet, holdings: accountData.holdings })

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Header & Breadcrumbs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button variant="outline" size="icon" asChild className="size-9 rounded-xl border-border/60 shrink-0">
            <Link href="/investments">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{serialized.wallet.name}</h1>
              <Badge variant="secondary" className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0.5">
                {serialized.wallet.currency}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Brokerage Account Holdings &amp; Transactions</p>
          </div>
        </div>

        <TransactionDialog
          accounts={[serialized.wallet]}
          defaultAccountId={accountId}
        />
      </div>

      {/* ── Metrics ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={TrendingUp}
          color={serialized.wallet.color || "#8b5cf6"}
          label="Account Portfolio Value"
          value={formatCurrency(accountData.totalValue, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={isPositive ? ArrowUpRight : ArrowDownRight}
          color={isPositive ? "#10b981" : "#f43f5e"}
          label="Account Return (Unrealized)"
          value={
            <div className="flex items-baseline gap-1.5">
              <span>{isPositive ? "+" : ""}{formatCurrency(accountData.unrealizedGain, currency)}</span>
              <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ({isPositive ? "+" : ""}{returnPercentage.toFixed(2)}%)
              </span>
            </div>
          }
          valueClassName={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(33.33% - 1rem))" }}
          icon={Coins}
          color="#3b82f6"
          label="Total Cost Basis"
          value={formatCurrency(accountData.totalCostBasis, currency)}
        />
      </div>

      {/* ── Holdings List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground tracking-tight">
            Account Holdings ({serialized.holdings.length})
          </h2>
        </div>
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
          <HoldingsList holdings={serialized.holdings} accountId={accountId} currency={currency} />
        </Suspense>
      </div>
    </div>
  )
}

