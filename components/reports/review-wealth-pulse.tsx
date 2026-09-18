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
import { Target, HandCoins, Repeat } from "lucide-react"
import type { MonthlyReviewGoalContribution, MonthlyReviewLoanPaydown } from "@/types"

export interface ReviewWealthPulseProps {
  goals: MonthlyReviewGoalContribution[]
  loans: MonthlyReviewLoanPaydown[]
  subscriptionChanges: {
    activeCount: number
    totalMonthlyCostCents: number
  }
  currency: string
  className?: string
}

export function ReviewWealthPulse({
  goals = [],
  loans = [],
  subscriptionChanges,
  currency,
  className,
}: ReviewWealthPulseProps) {
  const totalContributedCents = goals.reduce((sum, g) => sum + g.contributedThisMonthCents, 0)
  const totalItems =
    goals.length + loans.length + (subscriptionChanges && subscriptionChanges.activeCount > 0 ? 1 : 0)

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
            goals &amp;{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              commitments
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
                  {totalItems}
                </span>
              )}
            </span>
          </span>
        </div>
        {totalContributedCents > 0 ? (
          <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 shrink-0 text-right">
            +{formatCurrency(totalContributedCents, currency)}
          </span>
        ) : subscriptionChanges && subscriptionChanges.totalMonthlyCostCents > 0 ? (
          <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0 text-right">
            {formatCurrency(subscriptionChanges.totalMonthlyCostCents, currency)}/mo
          </span>
        ) : null}
      </div>

      <div className="p-4 flex-1">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center h-[216px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <Target className="size-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">No active commitments</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Zero active savings goals, loans, or recurring subscriptions recorded for this period.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-[216px] w-full min-w-0 [&>div>div]:!block">
            <ItemGroup className="gap-2 pr-3 w-full min-w-0">
              {/* Savings Goals */}
              {goals.map((g) => {
                const percent = Math.min(100, Math.max(0, g.progressPercentage))

                return (
                  <Item
                    key={g.goalId}
                    variant="outline"
                    size="xs"
                    className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 w-full min-w-0 overflow-hidden"
                  >
                    <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Target className="size-3 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {g.goalName}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {percent}%
                      </span>
                    </ItemHeader>
                    <Progress
                      value={percent}
                      className="h-1.5 w-full rounded-full [&>div]:bg-emerald-500 my-0.5"
                    />
                    <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                      <span className="tabular-nums truncate min-w-0">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(g.currentAmountCents, currency)}
                        </span>
                        {" of "}
                        <span>{formatCurrency(g.targetAmountCents, currency)}</span>
                      </span>
                      {g.contributedThisMonthCents > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                          +{formatCurrency(g.contributedThisMonthCents, currency)} mo
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 shrink-0">On track</span>
                      )}
                    </ItemFooter>
                  </Item>
                )
              })}

              {/* Recurring Subscriptions */}
              {subscriptionChanges && subscriptionChanges.activeCount > 0 && (
                <Item
                  variant="outline"
                  size="xs"
                  className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors cursor-default gap-1.5 w-full min-w-0 overflow-hidden"
                >
                  <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Repeat className="size-3 text-sky-500 shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">
                        Active Subscriptions
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground shrink-0">
                      {formatCurrency(subscriptionChanges.totalMonthlyCostCents, currency)}
                      <span className="text-muted-foreground font-normal text-[10px]">/mo</span>
                    </span>
                  </ItemHeader>
                  <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                    <span className="truncate min-w-0">
                      {subscriptionChanges.activeCount} active recurring services
                    </span>
                    <span className="text-[9px] font-mono font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded shrink-0">
                      Auto-renewing
                    </span>
                  </ItemFooter>
                </Item>
              )}

              {/* Loans / Liabilities */}
              {loans.map((l) => (
                <Item
                  key={l.loanId}
                  variant="outline"
                  size="xs"
                  className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 w-full min-w-0 overflow-hidden"
                >
                  <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <HandCoins className="size-3 text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {l.loanName}
                      </span>
                    </div>
                    {l.principalPaidCents > 0 ? (
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        -{formatCurrency(l.principalPaidCents, currency)} paid
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-medium text-muted-foreground/70 bg-muted px-1.5 py-0.2 rounded border border-border/30 shrink-0">
                        Active
                      </span>
                    )}
                  </ItemHeader>
                  <ItemFooter className="w-full min-w-0 flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-medium">
                    <span className="tabular-nums truncate min-w-0">
                      Remaining: {formatCurrency(l.remainingBalanceCents, currency)}
                    </span>
                    <span className="text-muted-foreground/60 font-mono text-[9px] uppercase shrink-0">
                      Loan
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
