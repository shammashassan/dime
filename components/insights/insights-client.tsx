"use client"

import React, { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { SpendingInsightsData, SpendingInsight } from "@/types"
import { InsightsBriefingCard } from "./insights-briefing-card"
import { InsightsRadarCard } from "./insights-radar-card"
import { InsightsMetricsRow } from "./insights-metrics-row"
import { InsightCard } from "./insight-card"
import { InsightsEmpty } from "./insights-empty"
import { HighImpactSignalsCard } from "./overview/high-impact-signals-card"
import { QuickActionsCard } from "./overview/quick-actions-card"
import { CategorySpikesCard } from "./overview/category-spikes-card"
import { RecurringRadarCard } from "./overview/recurring-radar-card"
import { SavingsOpportunitiesCard } from "./overview/savings-opportunities-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  Sparkles,
  RotateCcw,
  Search,
} from "lucide-react"
import { toast } from "@/components/ui/toast"
import { cn } from "cn"
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
  currency,
  onDismiss,
  onToggleBookmark,
}: {
  items: SpendingInsight[]
  emptyTitle?: string
  emptyDescription?: string
  currency?: string
  onDismiss: (id: string) => void
  onToggleBookmark: (id: string, current: boolean) => void
}) {
  if (items.length === 0) {
    return <InsightsEmpty title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
      {items.map((ins) => (
        <InsightCard
          key={ins.id}
          insight={ins}
          currency={currency}
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
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
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

    toast.add({
      title: "Insight dismissed",
      description: target.title,
      actionProps: {
        children: "Undo",
        onClick: () => {
          setInsights((prev) => [...prev, target].sort((a, b) => b.score - a.score))
          setDismissedCount((prev) => Math.max(0, prev - 1))
          startTransition(async () => {
            const res = await undoDismissInsightAction(id)
            if (!res?.success) {
              setInsights((prev) => prev.filter((i) => i.id !== id))
              setDismissedCount((prev) => prev + 1)
              toast.add({ title: res?.error || "Failed to undo dismissal", type: "error" })
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
        toast.add({ title: res?.error || "Failed to dismiss insight", type: "error" })
      }
    })
  }

  const handleToggleBookmark = (id: string, current: boolean) => {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isBookmarked: !current } : i))
    )

    toast.add({
      title: current ? "Bookmark removed" : "Insight bookmarked",
    })

    startTransition(async () => {
      const res = await toggleBookmarkInsightAction(id, current)
      if (!res?.success) {
        setInsights((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isBookmarked: current } : i))
        )
        toast.add({ title: res?.error || "Failed to update bookmark", type: "error" })
      }
    })
  }

  const handleRestoreAll = () => {
    startTransition(async () => {
      const res = await restoreAllDismissedInsightsAction()
      if (res?.success) {
        setDismissedCount(0)
        toast.add({ title: "Restored all previously dismissed insights", type: "success" })
        router.refresh()
      } else {
        toast.add({ title: res?.error || "Failed to restore insights", type: "error" })
      }
    })
  }

  const anomalies = useMemo(
    () => insights.filter((i) => i.category === "spikes" || i.category === "outliers"),
    [insights]
  )
  const subscriptions = useMemo(
    () => insights.filter((i) => i.category === "subscriptions"),
    [insights]
  )
  const savings = useMemo(
    () => insights.filter((i) => i.category === "savings"),
    [insights]
  )
  const bookmarked = useMemo(
    () => insights.filter((i) => i.isBookmarked),
    [insights]
  )

  const categoriesWithSignals = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>()
    insights.forEach((ins) => {
      const key = ins.category
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, {
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          count: 1,
        })
      }
    })
    return Array.from(map.values())
  }, [insights])

  // Filter items for category feeds
  const filterList = (list: SpendingInsight[]) => {
    let result = list
    if (categoryFilter) {
      result = result.filter((i) => i.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.tags && i.tags.some((t) => t.toLowerCase().includes(q)))
      )
    }
    return result
  }

  return (
    <div className="flex flex-col gap-5 w-full">
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
              <HoverCard>
                <HoverCardTrigger render={<Badge
                    variant="outline"
                    tabIndex={0}
                    className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {data.currency}
                  </Badge>} />
                <HoverCardContent
                  className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3"
                  align="start"
                  side="top"
                >
                  Anomalies and trends are analyzed against your 120-day baseline in {data.currency}.
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

      {/* ── 2. Top Metrics Row (Tightly Packed & Positioned at Top) ── */}
      <InsightsMetricsRow metrics={data.metrics} currency={data.currency} />

      {/* ── 3. Unified Tab Switcher (Horizontally scrollable on smaller screens, never overflows) ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 items-start sm:items-center justify-between w-full min-w-0">
        {/* Scrollable Tab Bar */}
        <div className="w-full sm:w-auto min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              if (val) {
                setActiveTab(val)
                if (val === "overview") setCategoryFilter("")
              }
            }}
          >
            <TabsList variant="bordered" className="w-full sm:w-auto overflow-x-auto scrollbar-hide flex items-center justify-start gap-1">
              <TabsTrigger value="overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="all">
                All Signals ({insights.length})
              </TabsTrigger>
              <TabsTrigger value="anomalies">
                Anomalies ({anomalies.length})
              </TabsTrigger>
              <TabsTrigger value="subscriptions">
                Subscriptions ({subscriptions.length})
              </TabsTrigger>
              <TabsTrigger value="savings">
                Savings &amp; Wins ({savings.length})
              </TabsTrigger>
              <TabsTrigger value="bookmarked">
                Bookmarked ({bookmarked.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Bar for Signal Feeds */}
        {activeTab !== "overview" && (
          <div className="w-full sm:w-72 shrink-0">
            <InputGroup className="rounded-xl border-border/40 bg-card">
              <Search className="size-4 text-muted-foreground ml-3" />
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search signals, categories..."
                className="text-xs"
              />
            </InputGroup>
          </div>
        )}
      </div>

      {/* ── 4. Main Tab Content: Master Bento Grid OR Signal Category Feeds ── */}
      {activeTab === "overview" ? (
        /* Bento Grid (Uniform 3-Column Layout Matching Investments and Net Worth) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {/* Row 1: Executive AI Briefing (2 cols) + Signal Severity Radar (1 col) */}
          <div className="lg:col-span-2">
            <InsightsBriefingCard briefing={data.executiveBriefing} />
          </div>
          <div className="lg:col-span-1">
            <InsightsRadarCard insights={insights} />
          </div>

          {/* Row 2: High-Impact Actionable Insights (2 cols) + Quick Actions (1 col) */}
          <div className="lg:col-span-2">
            <HighImpactSignalsCard
              insights={insights}
              currency={data.currency}
              onDismiss={handleDismiss}
              onToggleBookmark={handleToggleBookmark}
            />
          </div>
          <div className="lg:col-span-1">
            <QuickActionsCard
              categoriesWithSignals={categoriesWithSignals}
              onSelectCategoryFilter={(catId) => {
                setActiveTab("all")
                setCategoryFilter(catId)
              }}
            />
          </div>

          {/* Row 3: Category Surges (1 col) + Subscriptions Radar (1 col) + Savings Opportunities (1 col) */}
          <div className="lg:col-span-1">
            <CategorySpikesCard insights={insights} currency={data.currency} />
          </div>
          <div className="lg:col-span-1">
            <RecurringRadarCard insights={insights} currency={data.currency} />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <SavingsOpportunitiesCard insights={insights} currency={data.currency} />
          </div>
        </div>
      ) : activeTab === "all" ? (
        <InsightGrid
          items={filterList(insights)}
          currency={data.currency}
          emptyTitle="No Active Signals"
          emptyDescription={search ? "No signals match your search query." : "All spending metrics are within standard ranges."}
          onDismiss={handleDismiss}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : activeTab === "anomalies" ? (
        <InsightGrid
          items={filterList(anomalies)}
          currency={data.currency}
          emptyTitle="No Anomalies Flagged"
          emptyDescription={search ? "No anomalies match your search query." : "All categories and transactions are in normal standard deviations."}
          onDismiss={handleDismiss}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : activeTab === "subscriptions" ? (
        <InsightGrid
          items={filterList(subscriptions)}
          currency={data.currency}
          emptyTitle="No Subscription Alerts"
          emptyDescription={search ? "No subscriptions match your search query." : "No duplicate charges or unexpected price hikes detected."}
          onDismiss={handleDismiss}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : activeTab === "savings" ? (
        <InsightGrid
          items={filterList(savings)}
          currency={data.currency}
          emptyTitle="No Immediate Savings Gaps"
          emptyDescription={search ? "No savings opportunities match your search query." : "Your budget utilization and discretionary spending frequency are on target."}
          onDismiss={handleDismiss}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : (
        <InsightGrid
          items={filterList(bookmarked)}
          currency={data.currency}
          emptyTitle="No Bookmarked Insights"
          emptyDescription={search ? "No bookmarked items match your search query." : "Star important insights to reference them anytime."}
          onDismiss={handleDismiss}
          onToggleBookmark={handleToggleBookmark}
        />
      )}
    </div>
  )
}
