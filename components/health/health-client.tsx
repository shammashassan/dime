"use client"

import * as React from "react"
import { FinancialHealthData } from "@/types"
import { HealthSummaryRow } from "./health-summary-row"
import { HealthScoreHero } from "./health-score-hero"
import { PillarsBreakdown } from "./pillars-breakdown"
import { HealthRecommendations } from "./health-recommendations"
import { HealthHistoryChart } from "./health-history-chart"
import { HealthScoreOptimizerCard } from "./health-score-optimizer"
import { HealthSimulator } from "./health-simulator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Activity, SlidersHorizontal } from "lucide-react"

interface HealthClientProps {
  data: FinancialHealthData
}

export function HealthClient({ data }: HealthClientProps) {
  const [simulatorOpen, setSimulatorOpen] = React.useState(false)

  const totalPotentialBoost = React.useMemo(() => {
    return (data.recommendations || []).reduce(
      (sum, rec) => sum + (rec.potentialPoints || 0),
      0
    )
  }, [data.recommendations])

  const potentialScore = Math.min(100, data.overallScore + totalPotentialBoost)

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Activity className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Financial Health</h1>
              <HoverCard openDelay={150}>
                <HoverCardTrigger asChild>
                  <Badge
                    variant="outline"
                    className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default"
                  >
                    {data.currency}
                  </Badge>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3" align="start" side="top">
                  Diagnostic figures are calculated in your base currency ({data.currency}) across liquidity, savings, debt, budget, and growth.
                </HoverCardContent>
              </HoverCard>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time diagnostic indexing liquidity, savings velocity, debt exposure, and wealth resilience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimulatorOpen(true)}
            className="rounded-xl font-bold gap-2 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9"
          >
            <SlidersHorizontal className="size-3.5" />
            Simulate Score Impact
          </Button>
        </div>
      </div>

      {/* ── Summary Metric Cards Row ── */}
      <HealthSummaryRow data={data} />

      {/* ── Bento Row 1: Radial Gauge (1) + Score Trajectory Chart (2) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-1">
          <HealthScoreHero
            score={data.overallScore}
            tier={data.tier}
            previousScore={data.previousMonthScore}
            scoreDelta={data.scoreDelta}
            pillars={data.pillars}
          />
        </div>
        <div className="lg:col-span-2">
          <HealthHistoryChart data={data.historicalTrend} />
        </div>
      </div>

      {/* ── Bento Row 2: Recommendations (2) + Score Optimizer (1) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2">
          <HealthRecommendations recommendations={data.recommendations} />
        </div>
        <div className="lg:col-span-1">
          <HealthScoreOptimizerCard
            currentScore={data.overallScore}
            potentialScore={potentialScore}
            totalPotentialBoost={totalPotentialBoost}
            onOpenSimulator={() => setSimulatorOpen(true)}
          />
        </div>
      </div>

      {/* ── Bento Row 3: 5 Pillars + Methodology ── */}
      <PillarsBreakdown pillars={data.pillars} onOpenSimulator={() => setSimulatorOpen(true)} />

      {/* ── Interactive Simulator Sheet ── */}
      <HealthSimulator
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        baselineScore={data.overallScore}
        currency={data.currency}
      />
    </div>
  )
}