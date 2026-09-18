"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { buildHoldingReturn, calculateXIRR } from "@/lib/calculations/investments"
import type { InvestmentHolding, InvestmentTransaction } from "@/types"

interface PortfolioReturnsCardProps {
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  currency?: string
}

export function PortfolioReturnsCard({
  holdings,
  transactions,
  currency = "USD",
}: PortfolioReturnsCardProps) {
  const activeHoldings = React.useMemo(
    () => holdings.filter((h) => h.status === "active"),
    [holdings]
  )

  const holdingReturns = React.useMemo(() => {
    return activeHoldings.map((h) => {
      const hId = h._id.toString()
      const hTxs = transactions.filter(
        (t) => t.holdingId === hId || (t.walletId === h.walletId && t.symbol === h.symbol)
      )
      const currentValueCents = Math.round(h.quantity * h.currentPrice)
      const returns = buildHoldingReturn(hTxs, currentValueCents)

      return {
        holding: h,
        ...returns,
      }
    }).sort((a, b) => b.absoluteGainCents - a.absoluteGainCents)
  }, [activeHoldings, transactions])

  // Portfolio-wide XIRR
  const portfolioXirr = React.useMemo(() => {
    const cashFlows: Array<{ date: Date; amount: number }> = []
    let totalTerminalValue = 0

    for (const tx of transactions) {
      if (tx.type === "buy") {
        cashFlows.push({ date: new Date(tx.date), amount: -(tx.price * tx.quantity + tx.fees) })
      } else if (tx.type === "sell") {
        cashFlows.push({ date: new Date(tx.date), amount: tx.price * tx.quantity - tx.fees })
      } else if (tx.type === "cash_dividend" || tx.type === "reinvested_dividend") {
        cashFlows.push({
          date: new Date(tx.date),
          amount: tx.dividendAmount || tx.grossAmount || 0,
        })
      }
    }

    for (const h of activeHoldings) {
      totalTerminalValue += h.quantity * h.currentPrice
    }

    if (totalTerminalValue > 0) {
      cashFlows.push({ date: new Date(), amount: Math.round(totalTerminalValue) })
    }

    return calculateXIRR(cashFlows)
  }, [transactions, activeHoldings])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary shrink-0" />
            <CardTitle className="text-base font-bold">Performance & Returns (XIRR)</CardTitle>
          </div>
          <CardDescription>
            Money-Weighted Rate of Return (XIRR) accounting for the timing of all cash flows
          </CardDescription>
        </div>

        {portfolioXirr !== null && (
          <div className="flex flex-col items-end shrink-0">
            <span
              className={`font-mono font-extrabold text-base flex items-center gap-1 ${
                portfolioXirr >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {portfolioXirr >= 0 ? "+" : ""}
              {(portfolioXirr * 100).toFixed(1)}% p.a.
            </span>
            <span className="text-[11px] text-muted-foreground">Portfolio XIRR</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        {holdingReturns.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No active positions available for return calculations.
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Asset</TableHead>
                  <TableHead className="text-right font-semibold text-xs">Holding Period</TableHead>
                  <TableHead className="text-right font-semibold text-xs">Simple Return</TableHead>
                  <TableHead className="text-right font-semibold text-xs">XIRR (Annualized)</TableHead>
                  <TableHead className="text-right font-semibold text-xs">P&L Gain/Loss</TableHead>
                  <TableHead className="text-center font-semibold text-xs">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdingReturns.slice(0, 6).map((item) => {
                  const h = item.holding
                  const isPositive = item.absoluteGainCents >= 0
                  const xirrPositive = item.xirr !== null && item.xirr >= 0

                  return (
                    <TableRow key={h._id.toString()}>
                      <TableCell className="font-medium text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{h.symbol}</span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                            {h.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {item.holdingPeriodDays}d
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        <span
                          className={
                            item.simpleReturn >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {item.simpleReturn >= 0 ? "+" : ""}
                          {(item.simpleReturn * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        {item.xirr !== null ? (
                          <span
                            className={
                              xirrPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {xirrPositive ? "+" : ""}
                            {(item.xirr * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isPositive ? "+" : ""}
                          {formatCurrency(item.absoluteGainCents, currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          href={`/investments/${h.walletId}/${h.symbol}`}
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
