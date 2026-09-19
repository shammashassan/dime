import type { Metadata } from "next"
import { Suspense } from "react"
import HoldingDetailLoading from "./loading"

export const metadata: Metadata = {
  title: "Holding Details",
  description: "Detailed performance, transaction history, and metrics for this security.",
}

import { notFound } from "next/navigation"
import { ObjectId } from "mongodb"
import {
  getPortfolioHoldings,
  getTransactionsByHolding,
  getPriceHistory,
} from "@/lib/queries/investments"
import { getCollection } from "@/lib/db/collections"
import { Wallet, InvestmentTransaction } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { PriceUpdateDialog } from "@/components/investments/price-update-dialog"
import { PriceHistoryChart } from "@/components/investments/overview/price-history-chart"
import {
  HoldingPositionDetailsCard,
  HoldingDiagnosticsCard,
  HoldingPositionSizingCard,
  HoldingDividendsCard,
  HoldingPriceRangeCard,
} from "@/components/investments/holding-details-cards"
import { HoldingTaxLotsCard } from "@/components/investments/holding-tax-lots-card"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, serializeData } from "@/lib/utils"
import {
  ChevronLeft,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

async function HoldingDetailContent({
  params,
}: {
  params: Promise<{ accountId: string; symbol: string }>
}) {
  const { accountId, symbol } = await params
  const scope = await getFinancialScope()

  const [holdings, wallet] = await Promise.all([
    getPortfolioHoldings(),
    getCollection<Wallet>("wallets").then((c) => {
      try {
        return c.findOne({ _id: new ObjectId(accountId), type: "investment", ...getScopeFilter(scope) })
      } catch {
        return null
      }
    }),
  ])

  if (!wallet) {
    notFound()
  }

  const holdingId = `${accountId}_${symbol}`
  const holding = holdings.find((h) => h.walletId === accountId && h.symbol === symbol)

  if (!holding) {
    notFound()
  }

  const [transactions, priceHistory] = await Promise.all([
    getTransactionsByHolding(holdingId),
    getPriceHistory(holdingId, 365),
  ])

  const currency = wallet.currency || "USD"
  const totalValue = holding.quantity * holding.currentPrice
  const unrealizedGain = totalValue - holding.totalCostBasis
  const returnPercentage = holding.totalCostBasis > 0 ? (unrealizedGain / holding.totalCostBasis) * 100 : 0
  const isPositive = unrealizedGain >= 0
  const totalTxFees = transactions.reduce((sum, tx) => sum + (tx.fees || 0), 0)
  const totalTxOutlay = transactions.reduce((sum, tx) => sum + Math.abs(tx.cashImpact || 0), 0)
  const serializedTx = serializeData(transactions)
  const serializedPriceHistory = serializeData(priceHistory)
  const serializedHolding = serializeData(holding)
  const serializedWallet = serializeData(wallet)
  const serializedAllHoldings = serializeData(holdings)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button variant="outline" size="icon" asChild className="size-9 rounded-xl border-border/60 shrink-0">
            <Link href={`/investments/${accountId}`} aria-label="Back to investment account">
              <ChevronLeft className="size-5" />
              <span className="sr-only">Back to investment account</span>
            </Link>
          </Button>
          <div className="size-11 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0 border border-primary/20 uppercase">
            {holding.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{holding.symbol}</h1>
              <Badge variant="secondary" className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0.5">
                {holding.assetType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {holding.name} &middot; {wallet.name}
            </p>
          </div>
        </div>

        <PriceUpdateDialog holdingId={holdingId} currentPrice={holding.currentPrice} />
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Tag}
          color="#8b5cf6"
          label="Quantity Owned"
          value={holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Coins}
          color="#3b82f6"
          label="Current Price"
          value={formatCurrency(holding.currentPrice, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Coins}
          color="#6366f1"
          label="Total Holding Value"
          value={formatCurrency(totalValue, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={isPositive ? ArrowUpRight : ArrowDownRight}
          color={isPositive ? "#10b981" : "#f43f5e"}
          label="Unrealized P&L"
          value={
            <div className="flex items-baseline gap-1.5">
              <span>{isPositive ? "+" : ""}{formatCurrency(unrealizedGain, currency)}</span>
              <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ({isPositive ? "+" : ""}{returnPercentage.toFixed(2)}%)
              </span>
            </div>
          }
          valueClassName={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
      </div>

      {/* ── Asymmetric 1/3 + 2/3 Bento Grid matching Net Worth & Dime Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Left Column: Position Details + Performance Diagnostics */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
          <HoldingPositionDetailsCard
            holding={serializedHolding}
            wallet={serializedWallet}
            transactions={serializedTx}
            currency={currency}
          />
          <HoldingDiagnosticsCard
            holding={serializedHolding}
            transactions={serializedTx}
            currency={currency}
          />
          <HoldingPositionSizingCard
            holding={serializedHolding}
            allHoldings={serializedAllHoldings}
            wallet={serializedWallet}
            transactions={serializedTx}
            currency={currency}
          />
          <HoldingPriceRangeCard
            holding={serializedHolding}
            priceHistory={serializedPriceHistory}
            currency={currency}
          />
          <HoldingDividendsCard
            holding={serializedHolding}
            transactions={serializedTx}
            currency={currency}
          />
        </div>

        {/* Right Column: Asset Performance Trajectory + Transaction Ledger */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
          {/* Asset Performance Trajectory Card */}
          <PriceHistoryChart
            data={serializedPriceHistory}
            symbol={symbol}
            currency={currency}
            transactions={serializedTx}
            holding={serializedHolding}
          />

          {/* Transaction Ledger Card */}
          <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex-1 flex flex-col min-w-0 min-h-[220px]">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Transaction Ledger
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
                {serializedTx.length} {serializedTx.length === 1 ? "record" : "records"}
              </Badge>
            </div>

            {/* Table — flex-1 min-h-0 stretches the area; [data-slot=table-container]:h-full forces Table's internal
                overflow-x-auto container to fill that height, pinning the scrollbar above the footer */}
            <div className="flex-1 min-h-0 [&>[data-slot=table-container]]:h-full">
              <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Quantity</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Price</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Fees</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Net Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serializedTx.map((tx: InvestmentTransaction) => (
                      <TableRow key={tx._id.toString()} className="hover:bg-muted/40 transition-colors border-border/40">
                        <TableCell className="font-semibold text-xs tabular-nums py-2.5">
                          {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="secondary" className="rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5">
                            {tx.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-xs py-2.5">
                          {tx.quantity > 0 ? tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-xs py-2.5">
                          {tx.price > 0 ? formatCurrency(tx.price, currency) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-muted-foreground py-2.5">
                          {tx.fees > 0 ? formatCurrency(tx.fees, currency) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-extrabold text-xs py-2.5">
                          {formatCurrency(Math.abs(tx.cashImpact), currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {serializedTx.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                          No transactions recorded for this holding yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </div>

            {/* Anchored Table Footer Summary */}
            {serializedTx.length > 0 && (
              <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                  <span>Net Units: <strong className="text-foreground font-semibold font-mono">{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                  <span>Total Fees: <strong className="text-foreground font-semibold font-mono">{formatCurrency(totalTxFees, currency)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-muted-foreground">Total Outlay:</span>
                  <span className="font-mono font-bold text-foreground text-xs">{formatCurrency(totalTxOutlay, currency)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Open Tax Lots Card */}
          <HoldingTaxLotsCard
            holding={serializedHolding}
            transactions={serializedTx}
            currency={currency}
            className="flex-1 min-h-[220px]"
          />
        </div>
      </div>
    </div>
  )
}

export default function HoldingDetailPage(props: {
  params: Promise<{ accountId: string; symbol: string }>
}) {
  return (
    <Suspense fallback={<HoldingDetailLoading />}>
      <HoldingDetailContent {...props} />
    </Suspense>
  )
}
