"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { SpendingInsightsData, SpendingInsight } from "@/types"
import { InsightsBriefingCard } from "./insights-briefing-card"
import { InsightsMetricsRow } from "./insights-metrics-row"
import { InsightCard } from "./insight-card"
import { InsightsEmpty } from "./insights-empty"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Sparkles, RotateCcw } from "lucide-react"
import { toast } from "sonner"
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Page Header ── */}
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

      {/* ── Briefing Hero ── */}
      <InsightsBriefingCard briefing={data.executiveBriefing} />

      {/* ── Metrics Row ── */}
      <InsightsMetricsRow metrics={data.metrics} currency={data.currency} />

      {/* ── Category Tabs & Feed ── */}
      <Tabs defaultValue="all" className="flex flex-col gap-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="rounded-xl bg-muted/50 p-1 border border-border/40 h-10 inline-flex">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold px-3">
              All ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="rounded-lg text-xs font-semibold px-3">
              Anomalies ({anomalies.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg text-xs font-semibold px-3">
              Subscriptions ({subscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="rounded-lg text-xs font-semibold px-3">
              Income & Cashflow ({incomeAndCashflow.length})
            </TabsTrigger>
            <TabsTrigger value="savings" className="rounded-lg text-xs font-semibold px-3">
              Savings ({savings.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="rounded-lg text-xs font-semibold px-3">
              Bookmarked ({bookmarked.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="m-0">
          <InsightGrid
            items={insights}
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        </TabsContent>

        <TabsContent value="anomalies" className="m-0">
          <InsightGrid
            items={anomalies}
            emptyTitle="No Anomalies Flagged"
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="m-0">
          <InsightGrid
            items={subscriptions}
            emptyTitle="No Subscription Alerts"
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        </TabsContent>

        <TabsContent value="cashflow" className="m-0">
          <InsightGrid
            items={incomeAndCashflow}
            emptyTitle="Cashflow is Stable"
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        </TabsContent>

        <TabsContent value="savings" className="m-0">
          <InsightGrid
            items={savings}
            emptyTitle="No Immediate Savings Gaps"
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        </TabsContent>

        <TabsContent value="bookmarked" className="m-0">
          <InsightGrid
            items={bookmarked}
            emptyTitle="No Bookmarked Insights"
            emptyDescription="Star important insights to reference them anytime."
            onDismiss={handleDismiss}
            onToggleBookmark={handleToggleBookmark}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
