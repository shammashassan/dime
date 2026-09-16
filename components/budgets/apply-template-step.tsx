"use client"

import React, { useState, useTransition } from "react"
import { BudgetTemplate, BudgetTemplateAllocation, Category, Wallet } from "@/types"
import { applyBudgetTemplateAction } from "@/lib/actions/budget-templates"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { formatCurrency } from "@/lib/utils"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ApplyTemplateStepProps {
  template: BudgetTemplate
  categories: Category[]
  wallets?: Wallet[]
  initialMonthlyAmount: number
  primaryCurrency: string
  onBack: () => void
  onSuccess: () => void
}

export function ApplyTemplateStep({
  template,
  categories,
  initialMonthlyAmount,
  primaryCurrency,
  onBack,
  onSuccess,
}: ApplyTemplateStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Sizing inputs
  const currency = primaryCurrency || "USD"
  // Form input in display units (e.g. 5000 instead of 500000 cents)
  const [incomeDisplay, setIncomeDisplay] = useState(
    (initialMonthlyAmount / 100).toString()
  )
  const [strategy, setStrategy] = useState<"smart_merge" | "fresh_start">("smart_merge")

  // Allocations with editable percentages
  const [allocations, setAllocations] = useState<BudgetTemplateAllocation[]>(
    template.allocations.map((a) => ({ ...a }))
  )

  const totalAmountCents = Math.max(1, Math.round((parseFloat(incomeDisplay) || 0) * 100))

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0)
  const isBalanced = totalPercentage === 100

  // Category matching map: categoryName -> does existing category exist?
  const existingCategoryMap = React.useMemo(() => {
    const map = new Map<string, Category>()
    for (const c of categories) {
      map.set(c.name.toLowerCase().trim(), c)
    }
    return map
  }, [categories])

  const handlePercentageChange = (index: number, delta: number) => {
    setAllocations((prev) => {
      const next = [...prev]
      const current = next[index].percentage
      const updated = Math.max(1, Math.min(100, current + delta))
      next[index] = { ...next[index], percentage: updated }
      return next
    })
  }

  const handleApply = async () => {
    if (totalAmountCents <= 0) {
      toast.error("Please enter a valid monthly budget amount.")
      return
    }

    const applyPromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await applyBudgetTemplateAction({
            templateId: template._id.toString(),
            totalMonthlyIncome: totalAmountCents,
            currency,
            period: "monthly",
            strategy,
            customAllocations: allocations,
          })

          if (res && res.success) {
            router.refresh()
            onSuccess()
            resolve(res)
          } else {
            reject(new Error(res?.error || "Failed to apply template"))
          }
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(applyPromise, {
      loading: `Applying "${template.name}"...`,
      success: `Successfully initialized ${allocations.length} category budgets!`,
      error: (err: unknown) => (err instanceof Error ? err.message : "Failed to apply budget template"),
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full min-w-0">
      {/* ── Top Bar with Back CTA & Template Info ── */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 gap-2 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold shrink-0"
        >
          <ArrowLeft className="size-3.5" /> Back to Templates
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider h-5 truncate"
            style={{
              backgroundColor: template.color + "15",
              color: template.color,
              borderColor: template.color + "40",
            }}
          >
            {template.name}
          </Badge>
        </div>
      </div>

      {/* ── Step 1: Target Monthly Sizing ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 min-w-0">
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground">
            Total Monthly Budget Target
          </label>
          <p className="text-[11px] text-muted-foreground">
            Enter your expected monthly net income or total spending limit.
          </p>
          <InputGroup className="w-full mt-1">
            <InputGroupAddon align="inline-start" className="font-bold text-xs">
              {currency}
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              min="1"
              step="10"
              placeholder="e.g. 5000"
              value={incomeDisplay}
              onChange={(e) => setIncomeDisplay(e.target.value)}
              className="rounded-xl font-bold tabular-nums text-sm"
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground">
            Application Strategy
          </label>
          <p className="text-[11px] text-muted-foreground">
            Choose how to handle your existing active category budgets.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setStrategy("smart_merge")}
              className={cn(
                "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                strategy === "smart_merge"
                  ? "bg-primary/5 border-primary/40 text-foreground ring-1 ring-primary/20"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <RefreshCw className="size-3 text-primary" /> Smart Merge
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                Updates matching categories and keeps other existing budgets.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStrategy("fresh_start")}
              className={cn(
                "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                strategy === "fresh_start"
                  ? "bg-rose-500/5 border-rose-500/40 text-foreground ring-1 ring-rose-500/20"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <ShieldCheck className="size-3 text-rose-500" /> Fresh Start
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                Deactivates previous active budgets to start completely clean.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* ── Allocation Balance Meter ── */}
      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/40 border border-border/50 min-w-0">
        <div className="flex items-center justify-between text-xs font-bold gap-2 flex-wrap">
          <span className="text-foreground">Category Allocations ({allocations.length})</span>
          <span
            className={cn(
              "tabular-nums whitespace-nowrap",
              isBalanced ? "text-emerald-500" : "text-amber-500"
            )}
          >
            {totalPercentage}% Allocated {isBalanced ? "✓" : `(${100 - totalPercentage > 0 ? `+${100 - totalPercentage}% remaining` : `${totalPercentage - 100}% over`})`}
          </span>
        </div>
        <Progress
          value={Math.min(totalPercentage, 100)}
          indicatorStyle={{
            backgroundColor: isBalanced ? "#10b981" : totalPercentage > 100 ? "#f43f5e" : "#f59e0b",
          }}
          className="h-2 bg-muted/80"
        />
      </div>

      {/* ── Allocation Table / List ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-card/20 p-2 sm:p-2.5 min-w-0">
        {allocations.map((alloc, idx) => {
          const allocAmountCents = Math.round(totalAmountCents * (alloc.percentage / 100))
          const existingCategory = existingCategoryMap.get(alloc.categoryName.toLowerCase().trim())
          const isCategoryNew = !existingCategory

          return (
            <div
              key={alloc.categoryName}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-colors gap-2.5 sm:gap-3 min-w-0"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: alloc.suggestedColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-foreground truncate">
                      {alloc.categoryName}
                    </p>
                    <Badge
                      variant="secondary"
                      className="rounded-md text-[9px] px-1.5 py-0 h-4 font-semibold text-muted-foreground bg-muted shrink-0"
                    >
                      {alloc.group}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isCategoryNew ? (
                      <span className="text-[10px] text-primary flex items-center gap-0.5 truncate">
                        <Sparkles className="size-2.5 shrink-0" /> Will auto-create category
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                        <Check className="size-2.5 text-emerald-500 shrink-0" /> Matches existing category
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Percentage Adjuster & Calculated Amount */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/30 w-full sm:w-auto">
                <ButtonGroup className="h-7 items-stretch shadow-none">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    className="h-7 w-7 border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => handlePercentageChange(idx, -1)}
                    disabled={alloc.percentage <= 1}
                    aria-label="Decrease percentage"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <ButtonGroupText className="h-7 px-2 text-xs font-medium tabular-nums min-w-10 justify-center border-border/60 bg-muted/15 text-foreground">
                    {alloc.percentage}%
                  </ButtonGroupText>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    className="h-7 w-7 border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => handlePercentageChange(idx, 1)}
                    disabled={alloc.percentage >= 100}
                    aria-label="Increase percentage"
                  >
                    <Plus className="size-3" />
                  </Button>
                </ButtonGroup>

                <div className="text-right min-w-[75px]">
                  <p className="text-xs font-semibold text-foreground tabular-nums">
                    {formatCurrency(allocAmountCents, currency)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">per month</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border/40 min-w-0">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="rounded-xl font-bold text-xs w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleApply}
          disabled={isPending || totalAmountCents <= 0}
          className="rounded-xl font-bold text-xs gap-2 shadow-sm w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Applying...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" /> Apply Template Budgets
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
