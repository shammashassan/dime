"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { SlidersHorizontal, Sparkles, RotateCcw, TrendingUp } from "lucide-react"

interface HealthSimulatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  baselineScore: number
  currency: string
}

export function HealthSimulator({
  open,
  onOpenChange,
  baselineScore,
  currency,
}: HealthSimulatorProps) {
  const [extraSavings, setExtraSavings] = React.useState(0)
  const [debtPaydown, setDebtPaydown] = React.useState(0)
  const [subscriptionTrim, setSubscriptionTrim] = React.useState(0)

  const handleReset = () => {
    setExtraSavings(0)
    setDebtPaydown(0)
    setSubscriptionTrim(0)
  }

  // Calculate simulated score impact
  const pointsFromSavings = Math.min(10, Math.round((extraSavings / 100) * 1.5))
  const pointsFromDebt = Math.min(10, Math.round((debtPaydown / 500) * 1.2))
  const pointsFromSubscriptions = Math.min(8, Math.round((subscriptionTrim / 25) * 1.0))
  const totalGain = pointsFromSavings + pointsFromDebt + pointsFromSubscriptions
  const simulatedScore = Math.min(100, baselineScore + totalGain)

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
                Score Impact Simulator
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Preview how strategic financial moves boost your wellness score.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Score Impact Display Card */}
          <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-primary/5 to-muted/20 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Baseline
                </span>
                <span className="text-2xl font-bold tabular-nums text-muted-foreground">
                  {baselineScore}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="size-3.5" />
                  +{totalGain} pts
                </span>
                <span className="text-[10px] text-muted-foreground">Projected gain</span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Simulated
                </span>
                <span className="text-3xl font-extrabold tabular-nums text-primary">
                  {simulatedScore}
                </span>
              </div>
            </div>

            {totalGain > 0 && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/20">
                <Sparkles className="size-3 text-primary inline mr-1" />
                These adjustments would lift your score to{" "}
                <span className="font-semibold text-foreground">{simulatedScore} / 100</span>, improving your resilience and wealth velocity.
              </p>
            )}
          </div>

          {/* Simulator Controls */}
          <div className="flex flex-col gap-5">
            {/* Control 1: Extra Monthly Savings */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Boost Monthly Savings</span>
                <span className="font-bold text-primary tabular-nums">
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
              <span className="text-[11px] text-muted-foreground">
                Enhances your emergency reserve and net savings rate (+{pointsFromSavings} pts).
              </span>
            </div>

            {/* Control 2: Debt Payoff */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Pay Down Debt Principal</span>
                <span className="font-bold text-emerald-500 tabular-nums">
                  {formatCurrency(debtPaydown * 100, currency)}
                </span>
              </div>
              <Slider
                value={[debtPaydown]}
                onValueChange={(val) => setDebtPaydown(val[0])}
                min={0}
                max={5000}
                step={100}
              />
              <span className="text-[11px] text-muted-foreground">
                Reduces total debt leverage ratio (+{pointsFromDebt} pts).
              </span>
            </div>

            {/* Control 3: Subscription Cuts */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Trim Recurring Overhead</span>
                <span className="font-bold text-amber-500 tabular-nums">
                  -{formatCurrency(subscriptionTrim * 100, currency)}/mo
                </span>
              </div>
              <Slider
                value={[subscriptionTrim]}
                onValueChange={(val) => setSubscriptionTrim(val[0])}
                min={0}
                max={200}
                step={10}
              />
              <span className="text-[11px] text-muted-foreground">
                Decreases fixed monthly commitments relative to income (+{pointsFromSubscriptions} pts).
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border/30 flex sm:flex-row gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={totalGain === 0}
            className="rounded-xl flex-1 gap-1.5"
          >
            <RotateCcw data-icon="inline-start" className="size-3.5" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl flex-1"
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
