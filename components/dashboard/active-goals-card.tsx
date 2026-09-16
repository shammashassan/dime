import Link from "next/link"
import { Target, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemFooter,
} from "@/components/ui/item"
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
    .slice(0, 8)

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            savings goals
          </span>
          {activeGoals.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground">
              {activeGoals.length}
            </span>
          )}
        </div>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>View all</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="p-4 flex-1">
        {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[168px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <Target className="size-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">No active goals</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Start saving for milestones and track your progress.
            </p>
            <Link
              href="/goals"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Create goal</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-[216px] pr-3.5">
            <ItemGroup className="gap-2">
              {activeGoals.map((goal) => {
                const current = goal.currentAmount || 0
                const target = goal.targetAmount || 1
                const pct = Math.max(
                  0,
                  Math.min(Math.round((current / target) * 100), 100)
                )

                const goalId = goal._id ? goal._id.toString() : ""
                const href = goalId ? `/goals/${goalId}` : "/goals"
                const goalCurrency = goal.currency || currency

                return (
                  <Item
                    key={goalId || goal.name}
                    asChild
                    variant="outline"
                    size="xs"
                    className="flex-col items-stretch p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors gap-1.5 cursor-pointer no-underline group"
                  >
                    <Link href={href}>
                      <ItemHeader className="text-xs">
                        <span className="font-semibold text-foreground truncate pr-2 group-hover:text-primary transition-colors">
                          {goal.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] font-medium h-4.5 px-1.5 shrink-0"
                        >
                          {pct}%
                        </Badge>
                      </ItemHeader>
                      <Progress value={pct} className="h-1.5" />
                      <ItemFooter className="text-[10px] text-muted-foreground tabular-nums">
                        <span>{formatCurrency(current, goalCurrency)}</span>
                        <span>Target {formatCurrency(target, goalCurrency)}</span>
                      </ItemFooter>
                    </Link>
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
