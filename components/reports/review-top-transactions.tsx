"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemFooter,
} from "@/components/ui/item"
import { formatCurrency, cn } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import type { MonthlyReviewTransactionItem } from "@/types"

export interface ReviewOutflowsCardProps {
  topExpenses: MonthlyReviewTransactionItem[]
  currency: string
  className?: string
}

export function ReviewOutflowsCard({
  topExpenses = [],
  currency,
  className,
}: ReviewOutflowsCardProps) {
  const totalOutflowsTopCents = topExpenses.reduce((sum, tx) => sum + tx.amountCents, 0)

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-tight">
            largest{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              outflows
              {topExpenses.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
                  {topExpenses.length}
                </span>
              )}
            </span>
          </span>
        </div>
        {totalOutflowsTopCents > 0 && (
          <span className="text-[11px] font-mono font-medium text-rose-500 shrink-0 text-right">
            -{formatCurrency(totalOutflowsTopCents, currency)}
          </span>
        )}
      </div>

      <div className="p-4 flex-1">
        {topExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[216px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <ArrowUpRight className="size-5 text-rose-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">No outflows recorded</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Zero expense transactions were recorded during this monthly period.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-[216px] w-full min-w-0 [&>div>div]:!block">
            <ItemGroup className="gap-2 pr-3 w-full min-w-0">
              {topExpenses.map((tx) => (
                <Item
                  key={tx.id}
                  variant="outline"
                  size="xs"
                  className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 w-full min-w-0 overflow-hidden"
                >
                  <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate min-w-0 flex-1">
                      {tx.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500 shrink-0">
                      -{formatCurrency(tx.amountCents, currency)}
                    </span>
                  </ItemHeader>
                  <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      {tx.categoryName && (
                        <span className="text-[9px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          {tx.categoryName}
                        </span>
                      )}
                      {tx.walletName && (
                        <span className="truncate text-muted-foreground/80">{tx.walletName}</span>
                      )}
                    </div>
                    <span className="shrink-0 tabular-nums font-mono text-muted-foreground/70">
                      {tx.date}
                    </span>
                  </ItemFooter>
                </Item>
              ))}
            </ItemGroup>
          </ScrollArea>
        )}
      </div>
    </Card>
  )
}

export interface ReviewInflowsCardProps {
  topIncomes: MonthlyReviewTransactionItem[]
  currency: string
  className?: string
}

export function ReviewInflowsCard({
  topIncomes = [],
  currency,
  className,
}: ReviewInflowsCardProps) {
  const totalInflowsTopCents = topIncomes.reduce((sum, tx) => sum + tx.amountCents, 0)

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-tight">
            largest{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              inflows
              {topIncomes.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
                  {topIncomes.length}
                </span>
              )}
            </span>
          </span>
        </div>
        {totalInflowsTopCents > 0 && (
          <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 shrink-0 text-right">
            +{formatCurrency(totalInflowsTopCents, currency)}
          </span>
        )}
      </div>

      <div className="p-4 flex-1">
        {topIncomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[216px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <ArrowDownLeft className="size-5 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">No inflows recorded</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Zero incoming deposits were recorded during this monthly period.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-[216px] w-full min-w-0 [&>div>div]:!block">
            <ItemGroup className="gap-2 pr-3 w-full min-w-0">
              {topIncomes.map((tx) => (
                <Item
                  key={tx.id}
                  variant="outline"
                  size="xs"
                  className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 w-full min-w-0 overflow-hidden"
                >
                  <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate min-w-0 flex-1">
                      {tx.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{formatCurrency(tx.amountCents, currency)}
                    </span>
                  </ItemHeader>
                  <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      {tx.categoryName && (
                        <span className="text-[9px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          {tx.categoryName}
                        </span>
                      )}
                      {tx.walletName && (
                        <span className="truncate text-muted-foreground/80">{tx.walletName}</span>
                      )}
                    </div>
                    <span className="shrink-0 tabular-nums font-mono text-muted-foreground/70">
                      {tx.date}
                    </span>
                  </ItemFooter>
                </Item>
              ))}
            </ItemGroup>
          </ScrollArea>
        )}
      </div>
    </Card>
  )
}

export interface ReviewTopTransactionsProps {
  topExpenses: MonthlyReviewTransactionItem[]
  topIncomes: MonthlyReviewTransactionItem[]
  currency: string
  className?: string
}

export function ReviewTopTransactions({
  topExpenses = [],
  topIncomes = [],
  currency,
  className,
}: ReviewTopTransactionsProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
      <ReviewOutflowsCard topExpenses={topExpenses} currency={currency} />
      <ReviewInflowsCard topIncomes={topIncomes} currency={currency} />
    </div>
  )
}
