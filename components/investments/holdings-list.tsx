"use client"

import { InvestmentHolding } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { ArrowUpRight, ArrowDownRight, ChevronRight, Layers } from "lucide-react"

export function HoldingsList({ holdings, accountId, currency }: { holdings: InvestmentHolding[], accountId?: string, currency: string }) {
  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/40 rounded-2xl bg-card">
        <Layers className="size-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">No holdings found</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">Record a buy transaction to start building your portfolio.</p>
      </div>
    )
  }

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-border/40">
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Asset / Symbol</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Quantity</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Price</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Avg Cost</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Total Value</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Unrealized Return</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map(holding => {
            const totalValue = holding.quantity * holding.currentPrice
            const unrealizedGain = totalValue - holding.totalCostBasis
            const returnPercentage = holding.totalCostBasis > 0 ? (unrealizedGain / holding.totalCostBasis) * 100 : 0
            const isPositive = unrealizedGain >= 0
            const linkHref = accountId ? `/investments/${accountId}/${holding.symbol}` : `/investments/${holding.walletId}/${holding.symbol}`

            return (
              <TableRow key={`${holding.walletId}_${holding.symbol}`} className="group hover:bg-muted/40 transition-colors border-border/40">
                <TableCell className="font-medium py-3">
                  <Link href={linkHref} className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 uppercase border border-primary/20">
                      {holding.symbol.slice(0, 3)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground truncate">{holding.symbol}</span>
                        <Badge variant="outline" className="rounded-full text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0 h-4 bg-muted/40">
                          {holding.assetType}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{holding.name}</span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-sm py-3">
                  {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-sm py-3">
                  {formatCurrency(holding.currentPrice, currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium text-sm text-muted-foreground py-3">
                  {formatCurrency(holding.averageCostBasis, currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-extrabold text-sm text-foreground py-3">
                  {formatCurrency(totalValue, currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums py-3">
                  <div className={`flex flex-col items-end ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    <div className="flex items-center gap-0.5 font-extrabold text-sm">
                      {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      <span>{isPositive ? '+' : ''}{formatCurrency(unrealizedGain, currency)}</span>
                    </div>
                    <span className="text-[11px] font-semibold">
                      {isPositive ? '+' : ''}{returnPercentage.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-right">
                  <Button variant="ghost" size="icon" asChild className="size-7 rounded-lg text-muted-foreground hover:text-foreground">
                    <Link href={linkHref}>
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

