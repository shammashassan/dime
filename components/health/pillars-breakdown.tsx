"use client"

import * as React from "react"
import { PillarScore, PillarId, HealthTier } from "@/types"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Item, ItemMedia, ItemGroup } from "@/components/ui/item"
import { cn } from "@/lib/utils"
import {
  Droplet,
  PiggyBank,
  Scale,
  Receipt,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
} from "lucide-react"

interface PillarsBreakdownProps {
  pillars: Record<PillarId, PillarScore>
  onOpenSimulator?: () => void
}

const pillarConfig: Record<PillarId, { icon: React.ElementType; colorClass: string; indicatorColor: string }> = {
  liquidity: { icon: Droplet, colorClass: "text-sky-500 bg-sky-500/10 border-sky-500/20", indicatorColor: "#0ea5e9" },
  savings: { icon: PiggyBank, colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", indicatorColor: "#10b981" },
  debt: { icon: Scale, colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20", indicatorColor: "#f59e0b" },
  budget: { icon: Receipt, colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20", indicatorColor: "#a855f7" },
  growth: { icon: TrendingUp, colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", indicatorColor: "#6366f1" },
}

const tierBadges: Record<HealthTier, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; colorClass: string }> = {
  excellent: { label: "Excellent", variant: "default", colorClass: "text-emerald-500" },
  good: { label: "Good", variant: "secondary", colorClass: "text-primary" },
  fair: { label: "Fair", variant: "outline", colorClass: "text-amber-500" },
  needs_attention: { label: "Attention", variant: "destructive", colorClass: "text-rose-500" },
}

export function PillarsBreakdown({ pillars, onOpenSimulator }: PillarsBreakdownProps) {
  const pillarList: PillarScore[] = [
    pillars.liquidity,
    pillars.savings,
    pillars.debt,
    pillars.budget,
    pillars.growth,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">Diagnostic Pillars Breakdown</h2>
          <p className="text-xs text-muted-foreground">
            5 core financial disciplines evaluated in real time (20 points each).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {pillarList.map((pillar) => {
          const conf = pillarConfig[pillar.id] || {
            icon: Droplet,
            colorClass: "text-primary bg-primary/10 border-primary/20",
            indicatorColor: "var(--primary)",
          }
          const Icon = conf.icon
          const tierInfo = tierBadges[pillar.tier]
          const progressPct = (pillar.score / pillar.maxScore) * 100

          return (
            <div
              key={pillar.id}
              className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card hover:border-border/70 transition-colors"
            >
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("size-6 rounded-lg border flex items-center justify-center shrink-0", conf.colorClass)}>
                    <Icon className="size-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">{pillar.title}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Weight: {pillar.weight}%</p>
                  </div>
                </div>

                <Badge
                  variant={tierInfo.variant}
                  className="text-[9px] font-bold uppercase rounded-md px-1.5 py-0 h-4.5 shrink-0"
                >
                  {tierInfo.label}
                </Badge>
              </div>

              {/* Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                {/* Score & Progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground text-[11px] font-medium">Score</span>
                    <span className="tabular-nums text-foreground text-xs font-semibold">
                      <span className={cn("font-bold text-sm", tierInfo.colorClass)}>{pillar.score}</span>{" "}
                      <span className="text-muted-foreground text-[10px] font-normal">/ {pillar.maxScore} pts</span>
                    </span>
                  </div>
                  <Progress
                    value={progressPct}
                    className="h-1.5 rounded-full"
                    indicatorStyle={{ backgroundColor: conf.indicatorColor }}
                  />
                </div>

                {/* Narrative Summary */}
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.summary}</p>

                {/* Metrics Breakdown via ItemGroup */}
                <div className="pt-2 border-t border-border/30">
                  <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0">
                    {pillar.metrics.map((metric, idx) => (
                      <Item
                        key={idx}
                        size="xs"
                        className="justify-between px-1 py-1.5 border-transparent gap-2 flex-wrap sm:flex-nowrap"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ItemMedia>
                            {metric.status === "positive" ? (
                              <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            ) : metric.status === "negative" ? (
                              <AlertCircle className="size-3 text-rose-500 shrink-0" />
                            ) : (
                              <HelpCircle className="size-3 text-muted-foreground/60 shrink-0" />
                            )}
                          </ItemMedia>
                          <span className="text-[11px] text-muted-foreground truncate">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-right">
                          <span className="font-bold tabular-nums text-foreground text-xs">{metric.value}</span>
                          <span className="text-[10px] text-muted-foreground/70 font-normal">({metric.target})</span>
                        </div>
                      </Item>
                    ))}
                  </ItemGroup>
                </div>
              </div>
            </div>
          )
        })}

        {/* 6th Bento Card: Scoring Methodology & Guide */}
        <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                Scoring Methodology
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 h-4.5 rounded-md shrink-0">
              5 Pillars
            </Badge>
          </div>

          <div className="p-3.5 flex-1 flex flex-col justify-between gap-3 text-xs">
            <p className="text-muted-foreground leading-relaxed text-xs">
              Your composite score aggregates 5 independent pillars (20 points each) using continuous logarithmic and ratio curve algorithms calibrated to modern personal finance benchmarks.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-emerald-500">80–100</span>
                  <span className="text-[10px] text-muted-foreground truncate">Optimal Resilience</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-primary/5 border border-primary/20">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-primary">65–79</span>
                  <span className="text-[10px] text-muted-foreground truncate">Stable Foundation</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-amber-500">50–64</span>
                  <span className="text-[10px] text-muted-foreground truncate">Moderate Risk</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
                <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-rose-500">&lt; 50</span>
                  <span className="text-[10px] text-muted-foreground truncate">Action Needed</span>
                </div>
              </div>
            </div>

            {onOpenSimulator && (
              <div className="pt-2 border-t border-border/30">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onOpenSimulator}
                  className="w-full rounded-xl text-xs font-bold gap-1.5 h-8.5 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="size-3.5" />
                  Launch Score Simulator
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}