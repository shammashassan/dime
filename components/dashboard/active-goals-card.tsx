import Link from "next/link"
import { Target, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Goal } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"

export interface ActiveGoalsCardProps {
  goals: Goal[]
  currency: string
  className?: string
}

export function ActiveGoalsCard({
  goals = [],
  currency,
  className,
}: ActiveGoalsCardProps) {
  const activeGoals = (goals ?? [])
    .filter((g: Goal & { status?: string }) => {
      if (g.status) {
        return g.status === "active"
      }
      return (g.currentAmount || 0) < (g.targetAmount || 1)
    })
    .slice(0, 3)

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          savings goals
        </span>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="flex flex-col gap-3 py-2">
        {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Target className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-foreground">No active goals</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Start saving for milestones.
            </p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const current = goal.currentAmount || 0
            const target = goal.targetAmount || 1
            const pct = Math.max(
              0,
              Math.min(Math.round((current / target) * 100), 100)
            )

            return (
              <div
                key={goal._id ? goal._id.toString() : goal.name}
                className="flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate pr-2">
                    {goal.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] font-medium h-4.5 px-1.5 shrink-0"
                  >
                    {pct}%
                  </Badge>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{formatCurrency(current, currency)}</span>
                  <span>Target {formatCurrency(target, currency)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="pt-2 border-t border-border/40">
        <Link
          href="/goals"
          className="inline-flex w-full items-center justify-center rounded-md border border-border/60 bg-muted/20 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          Manage All Goals
        </Link>
      </div>
    </Card>
  )
}
