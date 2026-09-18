import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
} from "@/components/ui/item"
import { getBudgetPerformance } from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { formatCurrency, cn } from "@/lib/utils"
import { PiggyBank, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface BudgetProgressListProps {
  userId: string
  className?: string
}

export async function BudgetProgressList({ userId, className }: BudgetProgressListProps) {
  const budgets = await getBudgetPerformance(userId)
  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"

  return (
    <Card className={cn("flex h-full flex-col border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0", className)}>
      {/* Top compact micro-label header matching top dashboard cards */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            active budgets
          </span>
          {budgets.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
              {budgets.length}
            </span>
          )}
        </div>
        <Link
          href="/budgets"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0 whitespace-nowrap ml-auto"
        >
          <span>View all</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="p-3.5 sm:p-4 flex-1">
        {budgets.length > 0 ? (
          <ScrollArea className="h-48 sm:h-[216px] pr-2">
            <ItemGroup className="gap-2">
              {budgets.map((b) => {
                const percent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0

                const href = b.id ? `/budgets/${b.id}` : "/budgets"

                return (
                  <Item
                    key={b.id || b.name}
                    asChild
                    variant="outline"
                    size="xs"
                    className="p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer no-underline group flex-col items-stretch gap-1.5 w-full min-w-0 overflow-hidden"
                  >
                    <Link href={href} className="flex flex-col w-full min-w-0 gap-1.5">
                      {/* Line 1: Budget Name (left) and Category (right) */}
                      <div className="flex items-center justify-between gap-1.5 min-w-0 w-full">
                        <span className="text-xs font-bold text-foreground truncate min-w-0 flex-1 group-hover:text-primary transition-colors">
                          {b.name}
                        </span>
                        <span className="text-[9px] font-mono tracking-wider uppercase text-muted-foreground/70 shrink-0 ml-auto max-w-[90px] truncate">
                          {b.category}
                        </span>
                      </div>

                      {/* Line 2: Spent vs Limit amounts on their own dedicated line */}
                      <div className="flex items-baseline justify-between gap-1.5 min-w-0 w-full text-xs tabular-nums">
                        <span className="text-xs font-extrabold text-foreground">
                          {formatCurrency(b.spent, targetCurrency)}
                          <span className="text-[10px] font-normal text-muted-foreground/60"> spent</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 shrink-0 ml-auto">
                          of {formatCurrency(b.limit, targetCurrency)}
                        </span>
                      </div>

                      {/* Line 3: Progress Bar */}
                      <Progress
                        value={Math.min(percent, 100)}
                        className={`h-1.5 rounded-full ${
                          percent > 90
                            ? "[&>div]:bg-rose-500"
                            : percent >= 70
                              ? "[&>div]:bg-amber-500"
                              : "[&>div]:bg-emerald-500"
                        }`}
                      />

                      {/* Line 4: % used and Over Budget / remaining status */}
                      <div className="flex items-center justify-between gap-1.5 text-[10px] text-muted-foreground font-medium min-w-0 w-full">
                        <span>{percent.toFixed(0)}% used</span>
                        {percent > 100 ? (
                          <span className="text-rose-500 font-bold text-[9px] uppercase tracking-wider shrink-0">
                            Over Budget!
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/60 tabular-nums shrink-0">
                            {formatCurrency(Math.max(0, b.limit - b.spent), targetCurrency)} left
                          </span>
                        )}
                      </div>
                    </Link>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[168px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <PiggyBank className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No active budgets</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Create budgets to monitor and control your spending limits.
            </p>
            <Link
              href="/budgets"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Create budget</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}
