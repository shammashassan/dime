"use client"

import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import {
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  TrendingDown,
  ShieldCheck,
} from "lucide-react"
import type { EmergencyFundAnalysis, DebtPayoffComparison } from "@/types"

interface CoachSimulatorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emergencyFund: EmergencyFundAnalysis
  debtComparison: DebtPayoffComparison | null
  currency: string
}

export function CoachSimulatorSheet({
  open,
  onOpenChange,
  emergencyFund,
  debtComparison,
  currency,
}: CoachSimulatorSheetProps) {
  const [extraDebtPaydown, setExtraDebtPaydown] = useState(0) // in dollars/units (0-1000)
  const [extraSavings, setExtraSavings] = useState(0) // in dollars/units (0-1000)
  const [discretionaryTrimPercent, setDiscretionaryTrimPercent] = useState(0) // 0-30%

  const handleReset = () => {
    setExtraDebtPaydown(0)
    setExtraSavings(0)
    setDiscretionaryTrimPercent(0)
  }

  // Simulations
  // 1. Runway simulation
  const trimmedBurnRateCents = Math.round(
    emergencyFund.monthlyBurnRateCents * (1 - discretionaryTrimPercent / 100)
  )
  const simulatedRunwayMonths =
    trimmedBurnRateCents > 0
      ? Number(
          ((emergencyFund.liquidSavingsCents + extraSavings * 100 * 6) / trimmedBurnRateCents).toFixed(1)
        )
      : emergencyFund.currentRunwayMonths

  const runwayGain = Number((simulatedRunwayMonths - emergencyFund.currentRunwayMonths).toFixed(1))

  // 2. Debt payoff simulation
  let simulatedPayoffMonths = debtComparison ? debtComparison.currentPayoffMonths : 0
  let monthsSaved = 0

  if (debtComparison && debtComparison.totalDebtCents > 0) {
    const baselineMonthlyPayment = Math.max(15000, Math.round(debtComparison.totalDebtCents * 0.05))
    const totalExtraPaymentCents = extraDebtPaydown * 100
    const acceleratedRate = baselineMonthlyPayment + totalExtraPaymentCents
    simulatedPayoffMonths = Math.max(1, Math.ceil(debtComparison.totalDebtCents / acceleratedRate))
    monthsSaved = Math.max(0, debtComparison.currentPayoffMonths - simulatedPayoffMonths)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col p-0 overflow-hidden">
        <SheetHeader className="text-left p-6 pb-4 border-b border-border/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Strategy Impact Simulator
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Model how extra monthly contributions accelerate debt freedom and runway.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* ── Impact Comparison Card ── */}
          <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-primary/5 to-muted/20 p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Runway Impact */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Emergency Runway
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black tabular-nums text-foreground">
                    {simulatedRunwayMonths} mo
                  </span>
                  {runwayGain > 0 && (
                    <span className="text-xs font-bold text-emerald-500">
                      +{runwayGain} mo
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Baseline: {emergencyFund.currentRunwayMonths} mo
                </span>
              </div>

              {/* Debt Timeline Impact */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Debt-Free In
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black tabular-nums text-foreground">
                    {debtComparison ? `${simulatedPayoffMonths} mo` : "0 mo"}
                  </span>
                  {monthsSaved > 0 && (
                    <span className="text-xs font-bold text-indigo-500">
                      -{monthsSaved} mo
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Baseline: {debtComparison ? `${debtComparison.currentPayoffMonths} mo` : "Debt Free"}
                </span>
              </div>
            </div>

            {(runwayGain > 0 || monthsSaved > 0) && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/20 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary shrink-0" />
                <span>
                  Adjusting these levers speeds up debt freedom by <strong>{monthsSaved} months</strong> and extends runway by <strong>{runwayGain} months</strong>.
                </span>
              </p>
            )}
          </div>

          {/* ── Sliders ── */}
          <div className="flex flex-col gap-5">
            {/* Slider 1: Extra Debt Paydown */}
            {debtComparison && debtComparison.totalDebtCents > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingDown className="size-3.5 text-primary" />
                    Extra Monthly Debt Payment
                  </span>
                  <span className="font-bold tabular-nums text-primary">
                    +{formatCurrency(extraDebtPaydown * 100, currency)}/mo
                  </span>
                </div>
                <Slider
                  value={[extraDebtPaydown]}
                  onValueChange={(val) => setExtraDebtPaydown(val[0])}
                  min={0}
                  max={1000}
                  step={25}
                />
                <span className="text-[10px] text-muted-foreground">
                  Applies directly to your highest priority debt (Snowball priority).
                </span>
              </div>
            )}

            {/* Slider 2: Extra Emergency Savings */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  Extra Monthly Savings
                </span>
                <span className="font-bold tabular-nums text-emerald-500">
                  +{formatCurrency(extraSavings * 100, currency)}/mo
                </span>
              </div>
              <Slider
                value={[extraSavings]}
                onValueChange={(val) => setExtraSavings(val[0])}
                min={0}
                max={1000}
                step={25}
              />
              <span className="text-[10px] text-muted-foreground">
                Simulates dedicated liquid savings accumulation over 6 months.
              </span>
            </div>

            {/* Slider 3: Discretionary Budget Trim */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Discretionary Expense Trim
                </span>
                <span className="font-bold tabular-nums text-amber-500">
                  {discretionaryTrimPercent}%
                </span>
              </div>
              <Slider
                value={[discretionaryTrimPercent]}
                onValueChange={(val) => setDiscretionaryTrimPercent(val[0])}
                min={0}
                max={30}
                step={5}
              />
              <span className="text-[10px] text-muted-foreground">
                Trimming discretionary spending reduces your monthly burn rate to {formatCurrency(trimmedBurnRateCents, currency)}.
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-border/20 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset Sliders
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold text-xs cursor-pointer"
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
