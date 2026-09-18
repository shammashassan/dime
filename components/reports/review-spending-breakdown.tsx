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
import { ArrowDownRight, ArrowUpRight, PieChart } from "lucide-react"
import type { MonthlyReviewCategorySpend } from "@/types"

export interface ReviewSpendingBreakdownProps {
  categories: MonthlyReviewCategorySpend[]
  currency: string
  totalExpenseCents: number
  className?: string
}

export function ReviewSpendingBreakdown({
  categories = [],
  currency,
  totalExpenseCents,
  className,
}: ReviewSpendingBreakdownProps) {
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
            category{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              breakdown
              {categories.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
                  {categories.length}
                </span>
              )}
            </span>
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0 text-right">
          {formatCurrency(totalExpenseCents, currency)}
        </span>
      </div>

      <div className="p-4 flex-1">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[216px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <PieChart className="size-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">No category spend</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Zero expense transactions were categorized during this review period.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-[216px] w-full min-w-0 [&>div>div]:!block">
            <ItemGroup className="gap-2 pr-3 w-full min-w-0">
              {categories.map((cat) => {
                const isMoMUp = cat.deltaPercentage > 0
                const hasMoM = cat.previousMonthAmountCents > 0

                return (
                  <Item
                    key={cat.categoryId}
                    variant="outline"
                    size="xs"
                    className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 cursor-default group w-full min-w-0 overflow-hidden"
                  >
                    <ItemHeader className="w-full min-w-0 flex items-center justify-between gap-2 text-xs font-semibold">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.categoryColor || "#6366f1" }}
                        />
                        <span className="text-xs font-bold text-foreground truncate min-w-0">
                          {cat.categoryName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {cat.percentage}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasMoM && cat.deltaPercentage !== 0 && (
                          <span
                            className={`inline-flex items-center text-[10px] font-mono font-semibold ${
                              isMoMUp ? "text-rose-500" : "text-emerald-500"
                            }`}
                          >
                            {isMoMUp ? (
                              <ArrowUpRight className="size-3 mr-0.5" />
                            ) : (
                              <ArrowDownRight className="size-3 mr-0.5" />
                            )}
                            {isMoMUp ? "+" : ""}
                            {cat.deltaPercentage}%
                          </span>
                        )}
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {formatCurrency(cat.amountCents, currency)}
                        </span>
                      </div>
                    </ItemHeader>

                    <ItemFooter className="mt-0.5 w-full min-w-0">
                      <Progress
                        value={cat.percentage}
                        className="h-1.5 w-full bg-muted/60"
                        style={
                          {
                            "--progress-background": cat.categoryColor || "var(--primary)",
                          } as React.CSSProperties
                        }
                      />
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
