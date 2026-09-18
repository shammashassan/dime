"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, AlertTriangle, PieChart, Info } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  calculatePortfolioRisk,
  calculateSectorAllocation,
} from "@/lib/calculations/investments"
import type { InvestmentHolding } from "@/types"

interface SectorRiskCardProps {
  holdings: InvestmentHolding[]
  currency?: string
}

export function SectorRiskCard({ holdings, currency = "USD" }: SectorRiskCardProps) {
  const risk = React.useMemo(() => calculatePortfolioRisk(holdings), [holdings])
  const allocation = React.useMemo(() => calculateSectorAllocation(holdings), [holdings])

  const riskBadgeVariant =
    risk.singleAssetRisk === "low"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : risk.singleAssetRisk === "moderate"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"

  const scoreColor =
    risk.diversificationScore >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : risk.diversificationScore >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400"

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <CardTitle className="text-base font-bold">Risk & Diversification</CardTitle>
          </div>
          <CardDescription>Asset distribution and concentration metrics</CardDescription>
        </div>

        <Badge variant="outline" className={`text-xs px-2 py-0.5 capitalize ${riskBadgeVariant}`}>
          {risk.singleAssetRisk} Concentration
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4 pt-2">
        {/* Diversification Score Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-foreground">Diversification Score</span>
            <span className="text-[11px] text-muted-foreground">
              Based on {risk.assetClassCount} distinct asset {risk.assetClassCount === 1 ? "class" : "classes"} (HHI: {risk.hhiIndex})
            </span>
          </div>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className={`text-2xl font-black font-mono ${scoreColor}`}>
              {risk.diversificationScore}
            </span>
            <span className="text-xs text-muted-foreground font-medium">/ 100</span>
          </div>
        </div>

        {/* Sector Allocation Bars */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Asset Class Exposure
          </span>
          {allocation.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No active holdings to allocate.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allocation.slice(0, 4).map((sec) => (
                <div key={sec.sector} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{sec.label}</span>
                    <span className="font-mono text-muted-foreground">{sec.valuePercent}%</span>
                  </div>
                  <Progress value={sec.valuePercent} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Concentration Warnings */}
        {risk.concentrationWarnings.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            {risk.concentrationWarnings.slice(0, 2).map((w) => (
              <div
                key={w.symbol}
                className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]"
              >
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
