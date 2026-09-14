"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface FinancialHealthGaugeCardProps {
  score: number
  tier: "needs_attention" | "fair" | "good" | "excellent"
  topRecommendation?: {
    title: string
    potentialPoints: number
    actionPath: string
  }
  className?: string
}

const tierConfig: Record<
  "needs_attention" | "fair" | "good" | "excellent",
  {
    label: string
    badgeClassName: string
    fill: string
  }
> = {
  needs_attention: {
    label: "Needs Attention",
    badgeClassName: "text-rose-500 border-rose-500/20 bg-rose-500/10",
    fill: "#f43f5e",
  },
  fair: {
    label: "Fair",
    badgeClassName: "text-amber-500 border-amber-500/20 bg-amber-500/10",
    fill: "#f59e0b",
  },
  good: {
    label: "Good",
    badgeClassName: "text-blue-500 border-blue-500/20 bg-blue-500/10",
    fill: "#3b82f6",
  },
  excellent: {
    label: "Excellent",
    badgeClassName: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
    fill: "#10b981",
  },
}

export function FinancialHealthGaugeCard({
  score,
  tier,
  topRecommendation,
  className,
}: FinancialHealthGaugeCardProps) {
  const currentTier = tierConfig[tier] || tierConfig.fair
  const safeScore = typeof score === "number" && !isNaN(score) ? score : 0
  const chartData = [{ value: Math.min(Math.max(safeScore, 0), 100), fill: currentTier.fill }]

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs",
        className
      )}
    >
      <div className="flex items-center justify-between pb-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          financial health
        </span>
        <Badge
          variant="outline"
          className={cn("text-[10px] font-semibold uppercase tracking-wider", currentTier.badgeClassName)}
        >
          {currentTier.label}
        </Badge>
      </div>

      {/* Radial Semi-Circular Arc */}
      <div className="relative flex h-36 flex-col items-center justify-center my-1 [&_.recharts-radial-bar-background-sector]:fill-muted/40">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 200, height: 144 }}>
          <RadialBarChart
            cx="50%"
            cy="75%"
            innerRadius="65%"
            outerRadius="90%"
            barSize={14}
            data={chartData}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "var(--muted)" }}
              dataKey="value"
              cornerRadius={8}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute top-[52%] flex flex-col items-center select-none">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{safeScore}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Recommendation & Link footer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
        {topRecommendation ? (
          <Link
            href={topRecommendation.actionPath}
            className="group flex items-center justify-between text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="truncate pr-2">{topRecommendation.title}</span>
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-emerald-500/20 bg-emerald-500/10 text-[11px] font-semibold text-emerald-500 transition-colors group-hover:bg-emerald-500/20"
            >
              +{topRecommendation.potentialPoints} pts
              <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Badge>
          </Link>
        ) : (
          <Link
            href="/health"
            className="group flex items-center justify-between text-xs font-medium text-primary hover:underline"
          >
            <span>Explore full health breakdown</span>
            <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </div>
    </Card>
  )
}
