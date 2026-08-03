import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ObjectId } from "mongodb"
import { getPortfolioHoldings, getTransactionsByHolding } from "@/lib/queries/investments"
import { getCollection } from "@/lib/db/collections"
import { Wallet } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { PriceUpdateDialog } from "@/components/investments/price-update-dialog"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, serializeData } from "@/lib/utils"
import { ChevronLeft, Coins, ArrowUpRight, ArrowDownRight, Layers, Tag, Calendar } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function HoldingDetail({
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
      } catch (e) {
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

  const transactions = await getTransactionsByHolding(holdingId)
  const currency = wallet.currency || "USD"
  const totalValue = holding.quantity * holding.currentPrice
  const unrealizedGain = totalValue - holding.totalCostBasis
  const returnPercentage = holding.totalCostBasis > 0 ? (unrealizedGain / holding.totalCostBasis) * 100 : 0
  const isPositive = unrealizedGain >= 0
  const serializedTx = serializeData(transactions)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button variant="outline" size="icon" asChild className="size-9 rounded-xl border-border/60 shrink-0">
            <Link href={`/investments/${accountId}`}>
              <ChevronLeft className="size-5" />
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
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={Tag}
          color="#8b5cf6"
          label="Quantity Owned"
          value={holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={Coins}
          color="#3b82f6"
          label="Current Price"
          value={formatCurrency(holding.currentPrice, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
          icon={Coins}
          color="#6366f1"
          label="Total Holding Value"
          value={formatCurrency(totalValue, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
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

      {/* ── Transaction Ledger Table ── */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-foreground tracking-tight">
          Transaction Ledger ({serializedTx.length})
        </h2>
        <div className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
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
              {serializedTx.map((tx: any) => (
                <TableRow key={tx._id} className="hover:bg-muted/40 transition-colors border-border/40">
                  <TableCell className="font-semibold text-sm tabular-nums py-3">
                    {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5">
                      {tx.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-sm py-3">
                    {tx.quantity > 0 ? tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-sm py-3">
                    {tx.price > 0 ? formatCurrency(tx.price, currency) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs text-muted-foreground py-3">
                    {tx.fees > 0 ? formatCurrency(tx.fees, currency) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-extrabold text-sm py-3">
                    {formatCurrency(Math.abs(tx.cashImpact), currency)}
                  </TableCell>
                </TableRow>
              ))}
              {serializedTx.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No transactions recorded for this holding yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

