"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from "@/components/reports/contribution-graph"
import { HeatmapDayPopover } from "@/components/reports/heatmap-day-popover"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"
import type {
  HeatmapMetric,
  HeatmapDaySummary,
} from "@/lib/calculations/heatmaps"
import type { HeatmapViewModel } from "@/lib/queries/heatmaps"
import { format, parseISO } from "date-fns"
import {
  Flame,
  ShieldCheck,
  TrendingDown,
  CalendarDays,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Activity as ActivityIcon,
} from "lucide-react"

interface SpendingHeatmapViewProps {
  data: HeatmapViewModel
  wallets: Array<{ _id: string | any; name: string; [key: string]: any }>
  categories: Array<{ _id: string | any; name: string; [key: string]: any }>
}

export function SpendingHeatmapView({
  data,
  wallets,
  categories,
}: SpendingHeatmapViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedDay, setSelectedDay] = React.useState<HeatmapDaySummary | null>(null)
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null)

  const activeMetric: HeatmapMetric = (searchParams.get("metric") as HeatmapMetric) || data.metric || "expense"
  const activeTimeframe = searchParams.get("timeframe") || data.timeframe || "trailing-12"
  const activeWallet = searchParams.get("walletId") || "all"
  const activeCategory = searchParams.get("categoryId") || "all"

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all" && value !== "trailing-12") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("tab", "heatmap")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Convert day summaries to ContributionGraph Activity items
  const activities: Activity[] = React.useMemo(() => {
    return data.days.map((day: HeatmapDaySummary) => ({
      date: day.date,
      count:
        activeMetric === "expense"
          ? day.expense
          : activeMetric === "income"
          ? day.income
          : activeMetric === "net"
          ? day.net
          : day.count,
      level: day.level,
      expense: day.expense,
      income: day.income,
      net: day.net,
      transactionsCount: day.count,
      transactions: day.transactions,
    }))
  }, [data.days, activeMetric])

  const getHoverPreview = (act: Activity) => {
    const parsed = parseISO(act.date)
    const dateLabel = format(parsed, "EEE, MMM d, yyyy")

    if (act.transactionsCount === 0) {
      return `${dateLabel} • No activity (Zero-spend day)`
    }

    switch (activeMetric) {
      case "income":
        return `${dateLabel} • +${formatCurrency(act.income ?? 0, data.currency)} (${act.transactionsCount} tx)`
      case "net": {
        const netVal = act.net ?? 0
        const sign = netVal >= 0 ? "+" : ""
        return `${dateLabel} • Net ${sign}${formatCurrency(netVal, data.currency)} (${act.transactionsCount} tx)`
      }
      case "count":
        return `${dateLabel} • ${act.transactionsCount} transaction${act.transactionsCount === 1 ? "" : "s"}`
      case "expense":
      default:
        return `${dateLabel} • -${formatCurrency(act.expense ?? 0, data.currency)} (${act.transactionsCount} tx)`
    }
  }

  const { habits } = data

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Habit & Telemetry KPI Strip on top */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 0.75rem))" }}
          icon={ShieldCheck}
          color="#10b981"
          label="Current No-Spend Streak"
          value={`${habits.currentNoSpendStreak} ${habits.currentNoSpendStreak === 1 ? "day" : "days"}`}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 0.75rem))" }}
          icon={Flame}
          color="#f59e0b"
          label="Longest No-Spend Streak"
          value={`${habits.longestNoSpendStreak} ${habits.longestNoSpendStreak === 1 ? "day" : "days"}`}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 0.75rem))" }}
          icon={TrendingDown}
          color="#8b5cf6"
          label="Daily Average Spend"
          value={formatCurrency(habits.dailyAverageSpend, data.currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 0.75rem))" }}
          icon={CalendarDays}
          color="#3b82f6"
          label="Peak Spend Day"
          value={
            habits.peakSpendDay
              ? formatCurrency(habits.peakSpendDay.amount, data.currency)
              : "None"
          }
        />
      </div>

      {/* 2. Responsive Filters Card placed below KPI cards */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {/* Metric Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Metric</label>
            <Select
              value={activeMetric}
              onValueChange={(val) => updateParam("metric", val)}
            >
              <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="size-3.5 text-rose-500 shrink-0" />
                      <span>Expenses</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Income</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="net">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="size-3.5 text-blue-500 shrink-0" />
                      <span>Net Flow</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="count">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="size-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
                      <span>Volume (Tx Count)</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Timeframe</label>
            <Select
              value={activeTimeframe}
              onValueChange={(val) => updateParam("timeframe", val)}
            >
              <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="trailing-12">Past 12 Months</SelectItem>
                  {data.availableYears.map((yr: number) => (
                    <SelectItem key={yr} value={String(yr)}>
                      Year {yr}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Wallet Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Wallet</label>
            <Select
              value={activeWallet}
              onValueChange={(val) => updateParam("walletId", val)}
            >
              <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                <SelectValue placeholder="All Wallets" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Wallets</SelectItem>
                  {wallets.map((w) => (
                    <SelectItem key={String(w._id)} value={String(w._id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Category Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Category</label>
            <Select
              value={activeCategory}
              onValueChange={(val) => updateParam("categoryId", val)}
            >
              <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={String(c._id)} value={String(c._id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Card presentation */}
      <Card className="rounded-3xl border border-border/70 shadow-xs overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {activeMetric === "expense"
                  ? "Daily Spending Intensity"
                  : activeMetric === "income"
                  ? "Daily Income Inflows"
                  : activeMetric === "net"
                  ? "Daily Net Cash Flow"
                  : "Transaction Frequency"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {habits.totalDays} calendar days • {habits.noSpendDaysCount} zero-spend days ({Math.round((habits.noSpendDaysCount / Math.max(1, habits.totalDays)) * 100)}%)
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground self-start sm:self-center">
              Total {activeMetric === "expense" ? "Spent" : "Volume"}:{" "}
              <span className="font-semibold text-foreground">
                {activeMetric === "count"
                  ? `${habits.activeDaysCount} active days`
                  : formatCurrency(
                      activeMetric === "income"
                        ? habits.totalIncome
                        : habits.totalExpense,
                      data.currency
                    )}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-6 overflow-x-auto">
          <TooltipProvider delayDuration={50}>
            <ContributionGraph
              data={activities}
              variant={activeMetric}
              blockSize={12}
              blockMargin={3}
              blockRadius={2.5}
              fontSize={10}
              className="mx-auto"
            >
              <ContributionGraphCalendar
                title="Financial Activity Heatmap"
                className="py-1"
              >
                {({ activity, dayIndex, weekIndex }) => {
                  const dayData = (activity as unknown as HeatmapDaySummary)
                  return (
                    <Tooltip key={activity.date}>
                      <TooltipTrigger asChild>
                        <g
                          tabIndex={0}
                          role="button"
                          aria-label={getHoverPreview(activity)}
                          className="focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDay(dayData)
                            setAnchorRect(e.currentTarget.getBoundingClientRect())
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setSelectedDay(dayData)
                              setAnchorRect(e.currentTarget.getBoundingClientRect())
                            }
                          }}
                        >
                          <ContributionGraphBlock
                            activity={activity}
                            dayIndex={dayIndex}
                            weekIndex={weekIndex}
                          />
                        </g>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs py-1 px-2.5">
                        <p>{getHoverPreview(activity)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                }}
              </ContributionGraphCalendar>

              <ContributionGraphFooter className="mt-4 px-1">
                <ContributionGraphTotalCount>
                  {({ totalCount, year }) => (
                    <div className="text-xs text-muted-foreground">
                      {habits.activeDaysCount} active days out of {habits.totalDays} days in {year}
                    </div>
                  )}
                </ContributionGraphTotalCount>

                <ContributionGraphLegend />
              </ContributionGraphFooter>
            </ContributionGraph>
          </TooltipProvider>

          {/* Anchored Popover for Day Transactions Inspection */}
          <HeatmapDayPopover
            day={selectedDay}
            anchorRect={anchorRect}
            onClose={() => {
              setSelectedDay(null)
              setAnchorRect(null)
            }}
            currency={data.currency}
            metric={activeMetric}
          />
        </CardContent>
      </Card>
    </div>
  )
}
