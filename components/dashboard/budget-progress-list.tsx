import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemFooter,
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
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            active budgets
          </span>
          {budgets.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground">
              {budgets.length}
            </span>
          )}
        </div>
        <Link
          href="/budgets"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>View all</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="p-4 flex-1">
        {budgets.length > 0 ? (
          <ScrollArea className="h-48 sm:h-[216px] pr-3.5">
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
                    className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 cursor-pointer no-underline group"
                  >
                    <Link href={href}>
                      <ItemHeader className="text-xs font-semibold">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {b.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {b.category}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          <span className="font-semibold text-foreground">
                            {formatCurrency(b.spent, targetCurrency)}
                          </span>
                          {" / "}
                          <span>{formatCurrency(b.limit, targetCurrency)}</span>
                        </span>
                      </ItemHeader>
                      <Progress
                        value={Math.min(percent, 100)}
                        className={`h-2.5 rounded-full ${
                          percent > 90
                            ? "[&>div]:bg-rose-500"
                            : percent >= 70
                              ? "[&>div]:bg-amber-500"
                              : "[&>div]:bg-emerald-500"
                        }`}
                      />
                      <ItemFooter className="text-[10px] text-muted-foreground font-medium">
                        <span>{percent.toFixed(0)}% Used</span>
                        {percent > 100 && (
                          <span className="text-rose-500 font-bold">Over Budget!</span>
                        )}
                      </ItemFooter>
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
