"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemFooter,
} from "@/components/ui/item"
import { formatCurrency, cn } from "@/lib/utils"
import { PiggyBank } from "lucide-react"
import type { MonthlyReviewBudgetStatus } from "@/types"

export interface ReviewBudgetScorecardProps {
  budgets: MonthlyReviewBudgetStatus[]
  currency: string
  className?: string
}

export function ReviewBudgetScorecard({
  budgets = [],
  currency,
  className,
}: ReviewBudgetScorecardProps) {
  const overCount = budgets.filter((b) => b.isOverBudget).length
  const onTrackCount = budgets.length - overCount

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* Micro-label header matching dashboard bento cards */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-tight">
            budget{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              adherence
              {budgets.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
                  {budgets.length}
                </span>
              )}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
            {onTrackCount} on track
          </span>
          {overCount > 0 && (
            <>
              <span className="text-muted-foreground/40 text-[11px]">•</span>
              <span className="text-[11px] font-mono font-medium text-rose-500">
                {overCount} over
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-4 flex-1">
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[216px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <PiggyBank className="size-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">No active budgets</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              No budget limits were configured for this monthly review period.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-[216px] w-full min-w-0 [&>div>div]:!block">
            <ItemGroup className="gap-2 pr-3 w-full min-w-0">
              {budgets.map((b) => {
                const isOver = b.isOverBudget
                const percent = b.percentageUsed
                const progressVal = Math.min(100, percent)

                return (
                  <Item
                    key={b.budgetId}
                    variant="outline"
                    size="xs"
                    className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 w-full min-w-0 overflow-hidden"
                  >
                    <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate min-w-0 flex-1">
                        {b.categoryName}
                      </span>
                      {isOver ? (
                        <span className="text-[10px] font-mono font-bold text-rose-500 shrink-0">
                          +{formatCurrency(b.overrunCents, currency)} over ({percent}%)
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-semibold text-foreground shrink-0">
                          {percent}% spent
                        </span>
                      )}
                    </ItemHeader>
                    <Progress
                      value={progressVal}
                      className={`h-1.5 w-full rounded-full my-0.5 ${
                        isOver
                          ? "[&>div]:bg-rose-500"
                          : progressVal >= 85
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-emerald-500"
                      }`}
                    />
                    <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                      <span className="tabular-nums truncate min-w-0">
                        <span
                          className={cn(
                            "font-medium",
                            isOver ? "text-rose-500" : "text-foreground"
                          )}
                        >
                          {formatCurrency(b.spentAmountCents, currency)}
                        </span>
                        {" of "}
                        <span>{formatCurrency(b.budgetAmountCents, currency)}</span>
                      </span>
                      {isOver ? (
                        <span className="text-[9px] font-mono font-bold uppercase text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded shrink-0">
                          Over Budget
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                          {formatCurrency(
                            Math.max(0, b.budgetAmountCents - b.spentAmountCents),
                            currency
                          )}{" "}
                          left
                        </span>
                      )}
                    </ItemFooter>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        )}
      </div>
    </Card>
  )
}
