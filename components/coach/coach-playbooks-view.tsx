"use client"

import React, { useState, useMemo } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CoachStrategyCard } from "./coach-strategy-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import {
  TrendingDown,
  SlidersHorizontal,
  Compass,
} from "lucide-react"
import type { CoachStrategy, DebtPayoffComparison } from "@/types"

interface CoachPlaybooksViewProps {
  strategies: CoachStrategy[]
  debtComparison: DebtPayoffComparison | null
  currency: string
  onOpenSimulator: () => void
}

const TABS = [
  { value: "all", label: "All Playbooks", countKey: "all" },
  { value: "emergency", label: "Safety Net", countKey: "emergency" },
  { value: "debt", label: "Debt Payoff", countKey: "debt" },
  { value: "goals", label: "Goals", countKey: "goals" },
  { value: "spending", label: "Budgets & Trimming", countKey: "spending" },
] as const

export function CoachPlaybooksView({
  strategies,
  debtComparison,
  currency,
  onOpenSimulator,
}: CoachPlaybooksViewProps) {
  const [activeTab, setActiveTab] = useState<string>("all")

  const counts = useMemo(
    () => ({
      all: strategies.length,
      emergency: strategies.filter((s) => s.category === "emergency_fund").length,
      debt: strategies.filter((s) => s.category === "debt_payoff").length,
      goals: strategies.filter((s) => s.category === "goal_acceleration").length,
      spending: strategies.filter(
        (s) => s.category === "budget_tuning" || s.category === "subscription_trim"
      ).length,
    }),
    [strategies]
  )

  const filteredStrategies = useMemo(() => {
    if (activeTab === "all") return strategies
    if (activeTab === "emergency") return strategies.filter((s) => s.category === "emergency_fund")
    if (activeTab === "debt") return strategies.filter((s) => s.category === "debt_payoff")
    if (activeTab === "goals") return strategies.filter((s) => s.category === "goal_acceleration")
    if (activeTab === "spending")
      return strategies.filter(
        (s) => s.category === "budget_tuning" || s.category === "subscription_trim"
      )
    return strategies
  }, [activeTab, strategies])

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Desktop Tabs */}
      <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start max-w-full overflow-x-auto scrollbar-hide shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({counts[tab.countKey]})
          </button>
        ))}
      </div>

      {/* Mobile Select */}
      <div className="sm:hidden w-full">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full border-border/40 bg-card h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border/40 rounded-xl">
            <SelectItem value="all">All Playbooks ({counts.all})</SelectItem>
            <SelectItem value="emergency">Safety Net ({counts.emergency})</SelectItem>
            <SelectItem value="debt">Debt Payoff ({counts.debt})</SelectItem>
            <SelectItem value="goals">Goals ({counts.goals})</SelectItem>
            <SelectItem value="spending">Budgets & Trimming ({counts.spending})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Snowball vs Avalanche Callout */}
      {debtComparison &&
        debtComparison.totalDebtCents > 0 &&
        (activeTab === "all" || activeTab === "debt") && (
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-xs p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <TrendingDown className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Debt Acceleration Strategy: Snowball vs. Avalanche
                  </h4>
                  <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 border-primary/30 text-primary bg-primary/5">
                    {debtComparison.activeLoanCount} active loans
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <strong className="text-foreground">Snowball Momentum:</strong>{" "}
                  Target {debtComparison.snowballPriorityLoan?.name || "the smallest balance"}{" "}
                  ({formatCurrency(debtComparison.snowballPriorityLoan?.balanceCents || 0, currency)}) for fast psychological wins.
                  An extra {formatCurrency(10000, currency)}/mo cuts {debtComparison.monthsSaved} months off debt freedom and saves ~{formatCurrency(debtComparison.interestSavedCents, currency)} in interest.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSimulator}
              className="rounded-xl font-bold gap-1.5 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-8 shrink-0 self-end sm:self-auto"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Simulate Acceleration</span>
            </Button>
          </div>
        )}

      {/* Strategies Grid */}
      {filteredStrategies.length === 0 ? (
        <Empty className="py-12 border border-border/40 rounded-2xl bg-card">
          <EmptyMedia>
            <Compass className="size-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>No active playbooks in this category</EmptyTitle>
          <EmptyDescription>
            Your telemetry looks optimal in this area. You can simulate strategic adjustments or ask the Coach for customized scenarios.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
          {filteredStrategies.map((strategy) => (
            <CoachStrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}
    </div>
  )
}
