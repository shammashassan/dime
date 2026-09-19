"use client"

import React, { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buildTaxLots } from "@/lib/calculations/tax-lots"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import type { InvestmentHolding, InvestmentTransaction } from "@/types"
import { Layers } from "lucide-react"

interface HoldingTaxLotsCardProps {
  holding: InvestmentHolding
  transactions: InvestmentTransaction[]
  currency: string
  className?: string
}

export function HoldingTaxLotsCard({
  holding,
  transactions,
  currency,
  className,
}: HoldingTaxLotsCardProps) {
  const { openLots } = useMemo(() => {
    return buildTaxLots(transactions, "fifo", holding.symbol)
  }, [transactions, holding.symbol])

  const now = new Date()

  const totalOpenShares = useMemo(() => {
    return openLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0)
  }, [openLots])

  const totalOpenCost = useMemo(() => {
    return openLots.reduce((sum, lot) => sum + lot.remainingCostBasis, 0)
  }, [openLots])

  const totalUnrealizedGain = useMemo(() => {
    const totalCurrentVal = openLots.reduce(
      (sum, lot) => sum + Math.round(lot.remainingQuantity * holding.currentPrice),
      0
    )
    return totalCurrentVal - totalOpenCost
  }, [openLots, holding.currentPrice, totalOpenCost])

  const isTotalGain = totalUnrealizedGain >= 0

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col min-w-0",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Open Tax Lots
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
          {openLots.length} {openLots.length === 1 ? "lot" : "lots"} &middot; FIFO
        </Badge>
      </div>

      {/* Table Container — stretches and scrolls internally */}
      <div className="flex-1 min-h-0 [&>[data-slot=table-container]]:h-full">
        {openLots.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
            No open tax lots currently active for {holding.symbol}.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Acquired</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Shares</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Cost/Sh</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Unrealized P&amp;L</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Tax Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openLots.map((lot) => {
                const holdingDays = Math.max(
                  0,
                  Math.round((now.getTime() - lot.date.getTime()) / (24 * 3600 * 1000))
                )
                const isLongTerm = holdingDays > 365
                const daysToLongTerm = Math.max(0, 365 - holdingDays)

                const lotCurrentVal = Math.round(lot.remainingQuantity * holding.currentPrice)
                const lotUnrealizedGain = lotCurrentVal - lot.remainingCostBasis
                const isGain = lotUnrealizedGain >= 0

                return (
                  <TableRow key={lot.id} className="hover:bg-muted/40 transition-colors border-border/40">
                    <TableCell className="font-semibold text-xs tabular-nums py-2.5">
                      {formatDate(lot.date)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                      {lot.remainingQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      {lot.remainingQuantity < lot.quantity && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          / {lot.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                      {formatCurrency(lot.price, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-extrabold text-xs py-2.5">
                      <span
                        className={
                          isGain
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {isGain ? "+" : ""}
                        {formatCurrency(lotUnrealizedGain, currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      {isLongTerm ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                        >
                          Long-Term
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5"
                        >
                          Short-Term ({daysToLongTerm}d)
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Anchored Table Footer Summary */}
      {openLots.length > 0 && (
        <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
            <span>
              Open Units:{" "}
              <strong className="text-foreground font-semibold font-mono">
                {totalOpenShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </strong>
            </span>
            <span>
              Cost Basis:{" "}
              <strong className="text-foreground font-semibold font-mono">
                {formatCurrency(totalOpenCost, currency)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Unrealized:</span>
            <span
              className={cn(
                "font-mono font-bold text-xs",
                isTotalGain
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {isTotalGain ? "+" : ""}
              {formatCurrency(totalUnrealizedGain, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
