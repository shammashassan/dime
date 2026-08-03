"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  SlidersHorizontal,
  Minus,
  RotateCcw,
  TrendingUp,
  CreditCard,
  Target,
  Repeat,
  DollarSign,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Percent,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { RecurringRule } from "@/types"

interface PlannerControlsProps {
  currency: string
  monthlyIncomeAdj: number
  monthlyExpenseAdj: number
  extraLoanRepayment: number
  extraGoalContribution: number
  investmentRoi: number
  savingsApy: number
  pausedRecurringIds: string[]
  recurringRules: RecurringRule[]
  onChangeIncomeAdj: (val: number) => void
  onChangeExpenseAdj: (val: number) => void
  onChangeExtraLoan: (val: number) => void
  onChangeExtraGoal: (val: number) => void
  onChangeRoi: (val: number) => void
  onChangeSavingsApy: (val: number) => void
  onTogglePauseRecurring: (ruleId: string) => void
  onResetControls: () => void
}

export function PlannerControls({
  currency,
  monthlyIncomeAdj,
  monthlyExpenseAdj,
  extraLoanRepayment,
  extraGoalContribution,
  investmentRoi,
  savingsApy,
  pausedRecurringIds,
  recurringRules,
  onChangeIncomeAdj,
  onChangeExpenseAdj,
  onChangeExtraLoan,
  onChangeExtraGoal,
  onChangeRoi,
  onChangeSavingsApy,
  onTogglePauseRecurring,
  onResetControls,
}: PlannerControlsProps) {
  const pausedSet = new Set(pausedRecurringIds)

  // Net monthly cash-flow impact of every adjustment combined
  const netMonthlyImpact = monthlyIncomeAdj - monthlyExpenseAdj - extraLoanRepayment - extraGoalContribution
  const isNetPositive = netMonthlyImpact >= 0
  const isNetZero = netMonthlyImpact === 0

  return (
    <div className="rounded-2xl border border-border/70 shadow-xs overflow-hidden bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/50 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Scenario Adjustments</h3>
            <p className="text-xs text-muted-foreground">
              Simulate income, spending, debt, savings, and investment changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live net monthly impact badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono tabular-nums transition-colors",
              isNetZero
                ? "bg-muted/50 border-border/50 text-muted-foreground"
                : isNetPositive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            )}
          >
            {isNetPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            <span>{formatCurrency(Math.abs(netMonthlyImpact), currency)}</span>
            <span className="font-semibold text-[10px] opacity-70">/mo impact</span>
          </div>

          {/* Bills Pause Popover */}
          {recurringRules.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl text-xs font-semibold gap-1.5 px-3 cursor-pointer border-border/40"
                >
                  <Repeat className="size-3.5 text-amber-500" />
                  Bills
                  {pausedSet.size > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[9px] font-mono rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none"
                    >
                      {pausedSet.size}
                    </Badge>
                  )}
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3 rounded-2xl border border-border/40 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Simulate Pausing Bills
                </p>
                <ScrollArea className="max-h-52 pr-2">
                  <div className="space-y-1.5 text-xs">
                    {recurringRules.map((rule) => {
                      const ruleId = rule._id.toString()
                      const isPaused = pausedSet.has(ruleId)
                      return (
                        <div
                          key={ruleId}
                          onClick={() => onTogglePauseRecurring(ruleId)}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-2 rounded-xl border transition-colors cursor-pointer select-none",
                            isPaused
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                              : "bg-muted/40 border-border/40 hover:bg-muted/70"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Switch
                              checked={isPaused}
                              onCheckedChange={() => onTogglePauseRecurring(ruleId)}
                              className="scale-75 cursor-pointer pointer-events-none"
                            />
                            <span className="truncate font-bold text-[11px]">{rule.description}</span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            {formatCurrency(rule.amount, rule.currency)}/{rule.frequency.slice(0, 2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onResetControls}
            className="group text-xs font-semibold h-8 px-3 rounded-xl gap-1.5 cursor-pointer border-border/40"
          >
            <RotateCcw className="size-3.5 text-muted-foreground transition-transform duration-300 group-hover:-rotate-180" />
            Reset
          </Button>
        </div>
      </div>

      {/* Grid of Control Cards: 3 per row on medium/large screens (lg:grid-cols-3) */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ControlTile
          icon={DollarSign}
          color="#10b981"
          label="Income Adjustment"
          valueLabel={`${monthlyIncomeAdj >= 0 ? "+" : ""}${formatCurrency(monthlyIncomeAdj, currency)}`}
          rangeLabel={`${formatCurrency(-5000, currency)} to ${formatCurrency(10000, currency)}`}
          value={[monthlyIncomeAdj / 100]}
          min={-5000}
          max={10000}
          step={100}
          onValueChange={(vals) => onChangeIncomeAdj((vals[0] || 0) * 100)}
        />

        <ControlTile
          icon={Minus}
          color="#f43f5e"
          label="Spending Adjustment"
          valueLabel={`${monthlyExpenseAdj >= 0 ? "+" : ""}${formatCurrency(monthlyExpenseAdj, currency)}`}
          rangeLabel={`${formatCurrency(-5000, currency)} to ${formatCurrency(5000, currency)}`}
          value={[monthlyExpenseAdj / 100]}
          min={-5000}
          max={5000}
          step={100}
          onValueChange={(vals) => onChangeExpenseAdj((vals[0] || 0) * 100)}
        />

        <ControlTile
          icon={TrendingUp}
          color="#6366f1"
          label="Annual ROI"
          valueLabel={`${investmentRoi}% p.a.`}
          rangeLabel="-10% to 30%"
          value={[investmentRoi]}
          min={-10}
          max={30}
          step={1}
          onValueChange={(vals) => onChangeRoi(vals[0] ?? 7)}
        />

        <ControlTile
          icon={Percent}
          color="#f59e0b"
          label="Savings APY"
          valueLabel={`${savingsApy}% p.a.`}
          rangeLabel="0% to 10%"
          value={[savingsApy]}
          min={0}
          max={10}
          step={0.5}
          onValueChange={(vals) => onChangeSavingsApy(vals[0] ?? 4)}
        />

        <ControlTile
          icon={CreditCard}
          color="#a855f7"
          label="Extra Debt Payment"
          valueLabel={`+${formatCurrency(extraLoanRepayment, currency)}`}
          rangeLabel={`0 to ${formatCurrency(5000, currency)}`}
          value={[extraLoanRepayment / 100]}
          min={0}
          max={5000}
          step={50}
          onValueChange={(vals) => onChangeExtraLoan((vals[0] || 0) * 100)}
        />

        <ControlTile
          icon={Target}
          color="#3b82f6"
          label="Extra Goal Savings"
          valueLabel={`+${formatCurrency(extraGoalContribution, currency)}`}
          rangeLabel={`0 to ${formatCurrency(5000, currency)}`}
          value={[extraGoalContribution / 100]}
          min={0}
          max={5000}
          step={50}
          onValueChange={(vals) => onChangeExtraGoal((vals[0] || 0) * 100)}
        />
      </div>
    </div>
  )
}

function ControlTile({
  icon: Icon,
  color,
  label,
  valueLabel,
  rangeLabel,
  value,
  min,
  max,
  step,
  onValueChange,
}: {
  icon: React.ElementType
  color: string
  label: string
  valueLabel: string
  rangeLabel: string
  value: number[]
  min: number
  max: number
  step: number
  onValueChange: (vals: number[]) => void
}) {
  return (
    <div className="group relative rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:border-border hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 min-w-0 overflow-hidden">
      {/* Subtle brand color radial glow accent matching MetricCard */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}, transparent 60%)` }}
      />

      <div className="relative flex items-center gap-3">
        <div
          className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: color + "18", color: color }}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
            {label}
          </span>
          <span className="text-lg font-bold font-mono tracking-tight text-foreground block truncate tabular-nums leading-tight">
            {valueLabel}
          </span>
        </div>
      </div>

      <div className="relative flex flex-col gap-1.5 pt-1">
        <Slider
          value={value}
          min={min}
          max={max}
          step={step}
          onValueChange={onValueChange}
          className="py-1 cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/70">
          <span>{rangeLabel}</span>
        </div>
      </div>
    </div>
  )
}