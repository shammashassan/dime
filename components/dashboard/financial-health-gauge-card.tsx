"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { HealthTier, PillarId, PillarScore } from "@/types"

export interface FinancialHealthGaugeCardProps {
  score: number
  tier: HealthTier
  pillars?: Record<PillarId, PillarScore>
  topRecommendation?: {
    title: string
    potentialPoints: number
    actionPath: string
  }
  className?: string
}

const PILLAR_CONFIG: Record<PillarId, { label: string; color: string }> = {
  liquidity: { label: "Liquidity", color: "var(--chart-1)" },
  savings: { label: "Savings", color: "var(--chart-2)" },
  debt: { label: "Debt", color: "var(--chart-3)" },
  budget: { label: "Budget", color: "var(--chart-4)" },
  growth: { label: "Growth", color: "var(--chart-5)" },
}

const tierConfig: Record<
  HealthTier,
  {
    label: string
    badgeClassName: string
  }
> = {
  needs_attention: {
    label: "Needs Attention",
    badgeClassName: "text-rose-500 border-rose-500/20 bg-rose-500/10",
  },
  fair: {
    label: "Fair",
    badgeClassName: "text-amber-500 border-amber-500/20 bg-amber-500/10",
  },
  good: {
    label: "Good",
    badgeClassName: "text-blue-500 border-blue-500/20 bg-blue-500/10",
  },
  excellent: {
    label: "Excellent",
    badgeClassName: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  },
}

export function FinancialHealthGaugeCard({
  score,
  tier,
  pillars,
  className,
}: FinancialHealthGaugeCardProps) {
  const currentTier = tierConfig[tier] || tierConfig.fair
  const safeScore = typeof score === "number" && !isNaN(score) ? score : 0
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

  const activeData = React.useMemo(() => {
    const ids: PillarId[] = ["liquidity", "savings", "debt", "budget", "growth"]
    return ids.map((id) => {
      const conf = PILLAR_CONFIG[id]
      const p = pillars ? pillars[id] : undefined
      const scoreVal = p ? p.score : Math.round(safeScore / 5)

      return {
        id,
        category: conf.label,
        value: Math.max(scoreVal, 0.5),
        score: scoreVal,
        color: conf.color,
      }
    })
  }, [pillars, safeScore])

  const chartConfig = React.useMemo(() => {
    return activeData.reduce((acc, item) => {
      acc[item.id] = { label: item.category, color: item.color }
      return acc
    }, {} as ChartConfig)
  }, [activeData])

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            financial health
          </span>
          <span
            className={cn(
              "inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full border",
              currentTier.badgeClassName
            )}
          >
            {currentTier.label}
          </span>
        </div>
        <Link
          href="/health"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0"
        >
          <span>View hub</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* Main Larger Center Gauge - Dead Space Removed */}
      <div className="px-3 pt-2 pb-1 flex-1 flex flex-col items-center justify-center min-h-[120px]">
        {activeData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="w-full max-w-[280px] h-[125px] mx-auto overflow-visible"
          >
            <PieChart>
              <Pie
                data={activeData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="92%"
                startAngle={180}
                endAngle={0}
                innerRadius={62}
                outerRadius={94}
                cornerRadius={5}
                paddingAngle={4}
                minAngle={12}
                stroke="var(--card)"
                strokeWidth={2}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {activeData.map((entry, index) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    style={{
                      opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.35,
                      transition: "opacity 0.2s ease-in-out",
                      outline: "none",
                    }}
                  />
                ))}
              </Pie>
              <text x="50%" y="92%" textAnchor="middle" className="pointer-events-none">
                <tspan
                  x="50%"
                  dy="-8"
                  className="fill-foreground text-base sm:text-lg font-extrabold tabular-nums tracking-tight"
                >
                  {safeScore} / 100
                </tspan>
                <tspan
                  x="50%"
                  dy="15"
                  className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider"
                >
                  Health Score
                </tspan>
              </text>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => {
                      const categoryName = String(name)
                      const color = item.payload?.color || item.color || item.payload?.fill
                      const scoreVal = item.payload?.score ?? Number(value)
                      return (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex flex-1 justify-between items-center leading-none gap-2">
                            <span className="text-muted-foreground font-medium">{categoryName}:</span>
                            <span className="font-mono font-bold text-foreground">
                              {scoreVal} / 20 pts
                            </span>
                          </div>
                        </>
                      )
                    }}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="text-xs text-muted-foreground py-6 text-center">No health data.</div>
        )}
      </div>

      {/* shadcn ScrollArea for Legend Row */}
      {activeData.length > 0 && (
        <ScrollArea className="max-h-[56px] w-full border-t border-border/30 bg-muted/5 px-3 py-2">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {activeData.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-opacity cursor-default",
                  activeIndex !== undefined && activeIndex !== index ? "opacity-30" : "opacity-100"
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-bold text-foreground">{entry.category}</span>
                <span className="text-[10px] font-extrabold text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded-full border border-border/30">
                  {entry.score}/20
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}
