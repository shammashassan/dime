"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  type Activity,
} from "@/components/reports/contribution-graph"
import {
  calculateHeatmapHabits,
  assignQuantileLevelsToDays,
  type HeatmapDaySummary,
  type HeatmapHabitStats,
} from "@/lib/calculations/heatmaps"
import { formatCurrency, cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

export interface SpendingHeatmapWidgetProps {
  trendData?: Array<{ date: string; income: number; expense: number }>
  heatmapDays?: HeatmapDaySummary[]
  habits?: HeatmapHabitStats
  currency: string
  className?: string
}

export function SpendingHeatmapWidget({
  trendData,
  heatmapDays,
  habits,
  currency,
  className,
}: SpendingHeatmapWidgetProps) {
  // Map either full heatmap days (52 weeks) or trendData fallback into Activity array
  const { activities, habitsData } = React.useMemo(() => {
    if (heatmapDays && heatmapDays.length > 0) {
      const acts: Activity[] = heatmapDays.map((day) => ({
        date: day.date,
        count: day.expense,
        level: day.level,
        expense: day.expense,
        income: day.income,
        net: day.net,
        transactionsCount: day.count,
      }))

      return {
        activities: acts,
        habitsData: habits || calculateHeatmapHabits(heatmapDays),
      }
    }

    if (!trendData || trendData.length === 0) {
      return { activities: [], habitsData: null }
    }

    const rawDays: HeatmapDaySummary[] = trendData.map((d) => ({
      date: d.date,
      expense: Math.round((d.expense || 0) * 100),
      income: Math.round((d.income || 0) * 100),
      net: Math.round(((d.income || 0) - (d.expense || 0)) * 100),
      count: (d.expense || 0) > 0 ? 1 : 0,
      level: 0,
      transactions: [],
    }))

    const daysWithLevels = assignQuantileLevelsToDays(rawDays, "expense")
    const calculatedHabits = calculateHeatmapHabits(daysWithLevels)

    const acts: Activity[] = daysWithLevels.map((day) => ({
      date: day.date,
      count: day.expense,
      level: day.level,
      expense: day.expense,
      income: day.income,
      net: day.net,
      transactionsCount: day.count,
    }))

    return {
      activities: acts,
      habitsData: calculatedHabits,
    }
  }, [heatmapDays, habits, trendData])

  if (activities.length === 0) {
    return null
  }

  return (
    <Card
      className={cn(
        "@container/card bento-tile flex flex-col justify-between border-border/50 p-5 shadow-xs",
        className
      )}
    >
      {/* Compact Bento Header with Title, Streaks, and Link */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/30">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            spending rhythm
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Activity Heatmap
            </h3>
            {habitsData && habitsData.currentNoSpendStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                <Flame className="size-3 fill-amber-500 text-amber-500" />
                {habitsData.currentNoSpendStreak}d streak
              </span>
            )}
            {habitsData && (
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                • {habitsData.noSpendDaysCount} zero-spend days in trailing year
              </span>
            )}
          </div>
        </div>

        <Link
          href="/reports?tab=heatmap"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0 whitespace-nowrap self-start sm:self-auto"
        >
          <span>View in Heatmap</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* Heatmap Graph */}
      <div className="flex-1 min-w-0 pt-3">
        <TooltipProvider delayDuration={50}>
          <div className="overflow-x-auto no-scrollbar py-1">
            <ContributionGraph
              data={activities}
              variant="expense"
              blockSize={11}
              blockMargin={3}
              blockRadius={2}
              fontSize={10}
              showWeekdayLabels={false}
              className="mx-auto"
            >
              <ContributionGraphCalendar title="Spending Rhythm Heatmap">
                {({ activity, dayIndex, weekIndex }) => (
                  <Tooltip key={activity.date}>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer focus:outline-none">
                        <ContributionGraphBlock
                          activity={activity}
                          dayIndex={dayIndex}
                          weekIndex={weekIndex}
                        />
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs py-1 px-2">
                      <p className="font-semibold">
                        {format(parseISO(activity.date), "EEE, MMM d, yyyy")}
                      </p>
                      <p className="text-muted-foreground">
                        {activity.expense && activity.expense > 0
                          ? `Spent: ${formatCurrency(activity.expense, currency)}`
                          : "Zero-spend day 🎉"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </ContributionGraphCalendar>

              <ContributionGraphFooter className="mt-2.5 px-0.5">
                {habitsData && (
                  <span className="text-[11px] text-muted-foreground">
                    Daily avg: {formatCurrency(habitsData.dailyAverageSpend, currency)}
                  </span>
                )}
                <ContributionGraphLegend />
              </ContributionGraphFooter>
            </ContributionGraph>
          </div>
        </TooltipProvider>
      </div>
    </Card>
  )
}
