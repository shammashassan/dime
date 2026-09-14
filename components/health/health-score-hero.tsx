"use client"

import * as React from "react"
import { HealthTier, PillarScore, PillarId } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"

interface HealthScoreHeroProps {
  score: number
  tier: HealthTier
  previousScore: number
  scoreDelta: number
  pillars: Record<PillarId, PillarScore>
  onOpenSimulator?: () => void
}

const PILLAR_CONFIG: Record<PillarId, { label: string; color: string }> = {
  liquidity: { label: "Liquidity", color: "var(--chart-1)" },
  savings: { label: "Savings", color: "var(--chart-2)" },
  debt: { label: "Debt Mgmt", color: "var(--chart-3)" },
  budget: { label: "Budgeting", color: "var(--chart-4)" },
  growth: { label: "Growth", color: "var(--chart-5)" },
}

const tierConfig: Record<
  HealthTier,
  { label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  excellent: {
    label: "Excellent",
    badgeVariant: "default",
  },
  good: {
    label: "Good",
    badgeVariant: "secondary",
  },
  fair: {
    label: "Fair",
    badgeVariant: "outline",
  },
  needs_attention: {
    label: "Needs Attention",
    badgeVariant: "destructive",
  },
}

export function HealthScoreHero({
  score,
  tier,
  scoreDelta,
  pillars,
}: HealthScoreHeroProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)
  const currentTier = tierConfig[tier]

  const chartData = React.useMemo(() => {
    const ids: PillarId[] = ["liquidity", "savings", "debt", "budget", "growth"]
    return ids.map((id) => {
      const conf = PILLAR_CONFIG[id]
      const p = pillars[id]
      return {
        id,
        category: conf.label,
        value: p ? p.score : 0,
        color: conf.color,
      }
    })
  }, [pillars])

  const chartConfig = React.useMemo(() => {
    return chartData.reduce((acc, item) => {
      acc[item.id] = { label: item.category, color: item.color }
      return acc
    }, {} as ChartConfig)
  }, [chartData])

  return (
    <Card className="flex flex-col h-full gap-2 py-4">
      <CardHeader className="pb-1 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Health Diagnostic</CardTitle>
          <Badge
            variant={currentTier.badgeVariant}
            className="text-[10px] font-bold uppercase rounded-md px-2 py-0.5 shrink-0"
          >
            {currentTier.label}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1.5 flex-wrap">
          <span>Real-time composite financial wellness score.</span>
          {scoreDelta !== undefined && scoreDelta !== 0 && (
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                scoreDelta > 0 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              ({scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts this month)
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-3 pt-0 pb-2 sm:px-4 flex-1 flex flex-col items-center justify-center">
        {/* Radial Semi-Circle Arc Gauge scaled to fill space naturally without edge clipping */}
        <ChartContainer
          config={chartConfig}
          className="w-full max-w-[240px] h-[145px] mx-auto overflow-visible [&_.recharts-surface]:overflow-visible"
        >
          <PieChart margin={{ top: 6, bottom: 0, left: 2, right: 2 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="82%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={82}
              cornerRadius={3}
              paddingAngle={3}
              minAngle={6}
              stroke="var(--card)"
              strokeWidth={2}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {chartData.map((entry, index) => (
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

            <text x="50%" y="82%" textAnchor="middle" className="pointer-events-none">
              <tspan
                x="50%"
                dy="-8"
                className="fill-foreground text-3xl sm:text-4xl font-black tabular-nums tracking-tight"
              >
                {score}
              </tspan>
              <tspan
                x="50%"
                dy="18"
                className="fill-muted-foreground text-[9px] font-bold uppercase tracking-widest"
              >
                out of 100
              </tspan>
            </text>

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const color = item.payload?.color || item.color
                    return (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="size-2 rounded-xs shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-muted-foreground font-medium">{String(name)}</span>
                        <span className="font-bold tabular-nums text-foreground ml-auto">
                          {Number(value)} / 20 pts
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}