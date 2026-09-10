"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { SpendingInsightsData, SpendingInsight } from "@/types"
import { InsightsBriefingCard } from "./insights-briefing-card"
import { InsightsRadarCard } from "./insights-radar-card"
import { InsightsMetricsRow } from "./insights-metrics-row"
import { InsightCard } from "./insight-card"
import { InsightsEmpty } from "./insights-empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Repeat,
  TrendingDown,
  PiggyBank,
  Star,
  Layers,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  dismissInsightAction,
  undoDismissInsightAction,
  toggleBookmarkInsightAction,
  restoreAllDismissedInsightsAction,
} from "@/lib/actions/insights"

interface InsightsClientProps {
  data: SpendingInsightsData
}

function InsightGrid({
  items,
  emptyTitle,
  emptyDescription,
  onDismiss,
  onToggleBookmark,
}: {
  items: SpendingInsight[]
  emptyTitle?: string
  emptyDescription?: string
  onDismiss: (id: string) => void
  onToggleBookmark: (id: string, current: boolean) => void
}) {
  if (items.length === 0) {
    return <InsightsEmpty title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {items.map((ins) => (
        <InsightCard
          key={ins.id}
          insight={ins}
          onDismiss={onDismiss}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  )
}

export function InsightsClient({ data }: InsightsClientProps) {
  const router = useRouter()
  const [prevData, setPrevData] = useState(data)
  const [insights, setInsights] = useState<SpendingInsight[]>(data.insights)
  const [dismissedCount, setDismissedCount] = useState(data.dismissedCount)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isPending, startTransition] = useTransition()

  if (prevData !== data) {
    setPrevData(data)
    setInsights(data.insights)
    setDismissedCount(data.dismissedCount)
  }

  const handleDismiss = (id: string) => {
    const target = insights.find((i) => i.id === id)
    if (!target) return

    setInsights((prev) => prev.filter((i) => i.id !== id))
    setDismissedCount((prev) => prev + 1)

    toast("Insight dismissed", {
      description: target.title,
      action: {
        label: "Undo",
        onClick: () => {
          setInsights((prev) => [...prev, target].sort((a, b) => b.score - a.score))
          setDismissedCount((prev) => Math.max(0, prev - 1))
          startTransition(async () => {
            const res = await undoDismissInsightAction(id)
            if (!res?.success) {
              setInsights((prev) => prev.filter((i) => i.id !== id))
              setDismissedCount((prev) => prev + 1)
              toast.error(res?.error || "Failed to undo dismissal")
            }
          })
        },
      },
    })

    startTransition(async () => {
      const res = await dismissInsightAction(id)
      if (!res?.success) {
        setInsights((prev) => [...prev, target].sort((a, b) => b.score - a.score))
        setDismissedCount((prev) => Math.max(0, prev - 1))
        toast.error(res?.error || "Failed to dismiss insight")
      }
    })
  }

  const handleToggleBookmark = (id: string, current: boolean) => {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isBookmarked: !current } : i))
    )

    toast(current ? "Bookmark removed" : "Insight bookmarked")

    startTransition(async () => {
      const res = await toggleBookmarkInsightAction(id, current)
      if (!res?.success) {
        setInsights((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isBookmarked: current } : i))
        )
        toast.error(res?.error || "Failed to update bookmark")
      }
    })
  }

  const handleRestoreAll = () => {
    startTransition(async () => {
      const res = await restoreAllDismissedInsightsAction()
      if (res?.success) {
        setDismissedCount(0)
        toast.success("Restored all previously dismissed insights")
        router.refresh()
      } else {
        toast.error(res?.error || "Failed to restore insights")
      }
    })
  }

  const anomalies = insights.filter(
    (i) => i.category === "spikes" || i.category === "outliers"
  )
  const subscriptions = insights.filter((i) => i.category === "subscriptions")
  const incomeAndCashflow = insights.filter(
    (i) => i.category === "income" || i.category === "cashflow"
  )
  const savings = insights.filter((i) => i.category === "savings")
  const bookmarked = insights.filter((i) => i.isBookmarked)

  const TABS = [
    { id: "all", label: "All", count: insights.length, icon: Layers },
    { id: "anomalies", label: "Anomalies", count: anomalies.length, icon: AlertTriangle },
    { id: "subscriptions", label: "Subscriptions", count: subscriptions.length, icon: Repeat },
    { id: "cashflow", label: "Income & Cashflow", count: incomeAndCashflow.length, icon: TrendingDown },
    { id: "savings", label: "Savings", count: savings.length, icon: PiggyBank },
    { id: "bookmarked", label: "Bookmarked", count: bookmarked.length, icon: Star },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Sparkles className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                AI Spending Insights
              </h1>
              <HoverCard openDelay={150}>
                <HoverCardTrigger asChild>
                  <Badge
                    variant="outline"
                    tabIndex={0}
                    className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {data.currency}
                  </Badge>
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3"
                  align="start"
                  side="top"
                >
                  Anomalies and trends are analyzed against your 90-day baseline in {data.currency}.
                </HoverCardContent>
              </HoverCard>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automated anomaly detection, subscription tracking, and intelligent spending optimization.
            </p>
          </div>
        </div>

        {dismissedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreAll}
            disabled={isPending}
            className="rounded-xl font-bold gap-2 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9 self-start md:self-center"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restore Dismissed ({dismissedCount})
          </Button>
        )}
      </div>

      {/* ── 2. Top Metrics Row (Matches /health & /net-worth) ── */}
      <InsightsMetricsRow metrics={data.metrics} currency={data.currency} />

      {/* ── 3. Bento Hero Section: Executive AI Briefing (2 cols) + Signal Radar (1 col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2">
          <InsightsBriefingCard briefing={data.executiveBriefing} />
        </div>
        <div className="lg:col-span-1">
          <InsightsRadarCard insights={insights} />
        </div>
      </div>

      {/* ── 4. Unified Desktop/Mobile Tab Switcher (Matches Net Worth, Investments, Planner) ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Tab Selector */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Mobile Tab Selector */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10 rounded-xl text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectGroup>
                {TABS.map((tab) => (
                  <SelectItem key={tab.id} value={tab.id} className="rounded-lg text-xs font-semibold">
                    {tab.label} ({tab.count})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-muted-foreground font-mono font-semibold hidden md:inline-block">
          {activeTab === "all"
            ? `${insights.length} total signals`
            : activeTab === "anomalies"
            ? `${anomalies.length} anomalies`
            : activeTab === "subscriptions"
            ? `${subscriptions.length} subscriptions`
            : activeTab === "cashflow"
            ? `${incomeAndCashflow.length} cashflow signals`
            : activeTab === "savings"
            ? `${savings.length} savings wins`
            : `${bookmarked.length} bookmarked`}
        </span>
      </div>

      {/* ── 5. Active Tab Bento Feed ── */}
      <div>
        {activeTab === "all" && (
          <InsightGrid
            items={insights}
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === "anomalies" && (
          <InsightGrid
            items={anomalies}
            emptyTitle="No Anomalies Flagged"
            emptyDescription="All categories and transactions are in normal standard deviations."
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === "subscriptions" && (
          <InsightGrid
            items={subscriptions}
            emptyTitle="No Subscription Alerts"
            emptyDescription="No duplicate charges or unexpected price hikes detected."
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === "cashflow" && (
          <InsightGrid
            items={incomeAndCashflow}
            emptyTitle="Cashflow is Stable"
            emptyDescription="Income patterns and weekly burn velocity are healthy."
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === "savings" && (
          <InsightGrid
            items={savings}
            emptyTitle="No Immediate Savings Gaps"
            emptyDescription="Your budget utilization and discretionary spending frequency are on target."
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === "bookmarked" && (
          <InsightGrid
            items={bookmarked}
            emptyTitle="No Bookmarked Insights"
            emptyDescription="Star important insights to reference them anytime."
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        )}
      </div>
    </div>
  )
}
