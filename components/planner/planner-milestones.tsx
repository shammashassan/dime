"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Target, CreditCard, CheckCircle2, Clock, Zap } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { GoalMilestone, LoanMilestone } from "@/types"
import {
  Item,
  ItemContent,
  ItemGroup,
} from "@/components/ui/item"

interface PlannerMilestonesProps {
  goalMilestones: GoalMilestone[]
  loanMilestones: LoanMilestone[]
  currency: string
}

export function PlannerMilestones({
  goalMilestones,
  loanMilestones,
  currency,
}: PlannerMilestonesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Goals Acceleration & Target Timeline ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Goal Target Timelines</span>
          </div>
          <Badge variant="secondary" className="rounded-lg font-mono text-[10px] font-bold">
            {goalMilestones.length} goals
          </Badge>
        </div>

        <div className="flex-1">
          {goalMilestones.length > 0 ? (
            <ScrollArea className="max-h-80 px-2">
              <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
                {goalMilestones.map((milestone) => {
                  const progressPct = Math.min(
                    100,
                    Math.round((milestone.currentAmount / Math.max(milestone.targetAmount, 1)) * 100)
                  )

                  return (
                    <Item key={milestone.goalId} className="flex-col items-stretch gap-2 px-2.5 py-2.5 hover:bg-muted/60 transition-colors rounded-xl">
                      <ItemContent className="w-full">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-xs text-foreground truncate">{milestone.goalName}</span>
                          <span className="text-[10px] font-mono font-semibold text-muted-foreground shrink-0">
                            {formatCurrency(milestone.currentAmount, currency)} / {formatCurrency(milestone.targetAmount, currency)}
                          </span>
                        </div>

                        <Progress value={progressPct} className="h-1.5 rounded-full" />

                        <div className="flex items-center justify-between text-[11px] pt-1.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="size-3 text-muted-foreground/70" />
                            <span>
                              Simulated:{" "}
                              <strong className="text-foreground font-bold">
                                {milestone.simulatedCompletionDateStr || "Beyond horizon"}
                              </strong>
                            </span>
                          </div>

                          {milestone.monthsSaved > 0 ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 rounded-lg text-[9px] font-bold px-1.5 py-0">
                              <Zap className="size-2.5" />
                              {milestone.monthsSaved} mo faster
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Baseline: {milestone.baselineCompletionDateStr || "N/A"}
                            </span>
                          )}
                        </div>
                      </ItemContent>
                    </Item>
                  )
                })}
              </ItemGroup>
            </ScrollArea>
          ) : (
            <div className="text-xs text-muted-foreground py-14 text-center flex items-center justify-center h-70 px-6">
              No active goals configured. Add savings goals to project completion dates.
            </div>
          )}
        </div>
      </div>

      {/* ── Debt Payoff & Freedom Timeline ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Debt Freedom Timeline</span>
          </div>
          <Badge variant="secondary" className="rounded-lg font-mono text-[10px] font-bold">
            {loanMilestones.length} loans
          </Badge>
        </div>

        <div className="flex-1">
          {loanMilestones.length > 0 ? (
            <ScrollArea className="max-h-80 px-2">
              <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
                {loanMilestones.map((milestone) => {
                  const paidPct = Math.min(
                    100,
                    Math.round(
                      ((milestone.originalBalance - milestone.currentBalance) / Math.max(milestone.originalBalance, 1)) * 100
                    )
                  )

                  return (
                    <Item key={milestone.loanId} className="flex-col items-stretch gap-2 px-2.5 py-2.5 hover:bg-muted/60 transition-colors rounded-xl">
                      <ItemContent className="w-full">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-xs text-foreground truncate">{milestone.loanName}</span>
                          <span className="text-[10px] font-mono font-semibold text-rose-500 shrink-0">
                            {formatCurrency(milestone.currentBalance, currency)} left
                          </span>
                        </div>

                        <Progress value={paidPct} className="h-1.5 rounded-full" />

                        <div className="flex items-center justify-between text-[11px] pt-1.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CheckCircle2 className="size-3 text-purple-500" />
                            <span>
                              Payoff:{" "}
                              <strong className="text-foreground font-bold">
                                {milestone.simulatedPayoffDateStr || "Beyond horizon"}
                              </strong>
                            </span>
                          </div>

                          {milestone.monthsSaved > 0 ? (
                            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1 rounded-lg text-[9px] font-bold px-1.5 py-0">
                              <Zap className="size-2.5" />
                              {milestone.monthsSaved} mo earlier
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Baseline: {milestone.baselinePayoffDateStr || "N/A"}
                            </span>
                          )}
                        </div>
                      </ItemContent>
                    </Item>
                  )
                })}
              </ItemGroup>
            </ScrollArea>
          ) : (
            <div className="text-xs text-muted-foreground py-14 text-center flex flex-col items-center justify-center gap-2 h-70 px-6">
              <CheckCircle2 className="size-7 text-emerald-500/80" />
              <span>You have zero active debts! Your cash flow is 100% debt-free.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}