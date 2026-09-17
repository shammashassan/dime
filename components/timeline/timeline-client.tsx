"use client"

import React, { useState, useEffect, useTransition, useMemo, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { TimelineData, TimelineEventCategory } from "@/types"
import { TimelineHeader } from "./timeline-header"
import { TimelineStatsBanner } from "./timeline-stats-banner"
import { TimelineFilterChips } from "./timeline-filter-chips"
import { TimelineFeed } from "./timeline-feed"
import { TimelineEmptyState } from "./timeline-empty-state"
import {
  filterTimelineEvents,
  groupEventsByDateBracket,
  calculateTimelineStats,
} from "@/lib/calculations/timeline"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { format, parseISO } from "date-fns"

interface TimelineClientProps {
  initialData: TimelineData
}

export function TimelineClient({ initialData }: TimelineClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // URL-derived filter states
  const categoryParam = (searchParams.get("category") as TimelineEventCategory) || "all"
  const urlSearch = searchParams.get("search") || ""
  const urlFrom = searchParams.get("from") || ""
  const urlTo = searchParams.get("to") || ""

  const [search, setSearch] = useState(urlSearch)

  // Sync search state if URL changes externally
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearch(urlSearch)
  }

  // Derive date range from URL
  const dateRange: DateRange | undefined = useMemo(() => {
    if (!urlFrom) return undefined
    return {
      from: parseISO(urlFrom),
      to: urlTo ? parseISO(urlTo) : undefined,
    }
  }, [urlFrom, urlTo])

  // Centralized URL synchronizer
  const updateUrl = useCallback(
    (updates: Partial<{ category: string; search: string; from: string | null; to: string | null }>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === "" || val === "all") {
          params.delete(key)
        } else {
          params.set(key, val)
        }
      })

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [pathname, router, searchParams]
  )

  const handleCategoryChange = (category: TimelineEventCategory) => {
    updateUrl({ category })
  }

  const handleSearchChange = (query: string) => {
    setSearch(query)
    updateUrl({ search: query })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range?.from) {
      updateUrl({ from: null, to: null })
      return
    }
    if (range.from && range.to) {
      const fromStr = format(range.from, "yyyy-MM-dd")
      const toStr = format(range.to, "yyyy-MM-dd")
      updateUrl({ from: fromStr, to: toStr })
    }
  }

  const handleResetFilters = () => {
    setSearch("")
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }

  // Pure filtering applied over initialData.events
  const filteredEvents = useMemo(() => {
    return filterTimelineEvents(initialData.events, {
      category: categoryParam,
      search,
      from: urlFrom || undefined,
      to: urlTo || undefined,
    })
  }, [initialData.events, categoryParam, search, urlFrom, urlTo])

  // Progressive Loading State (Load More & Infinite Scroll)
  const PAGE_SIZE = 25
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset visible count when filter criteria change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [categoryParam, search, urlFrom, urlTo])

  // Slice events for progressive DOM rendering
  const visibleEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount)
  }, [filteredEvents, visibleCount])

  // Recalculate groups on the progressively rendered slice
  const groups = useMemo(() => {
    return groupEventsByDateBracket(visibleEvents)
  }, [visibleEvents])

  const hasMore = visibleCount < filteredEvents.length

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredEvents.length))
  }, [filteredEvents.length])

  const stats = useMemo(() => {
    return calculateTimelineStats(filteredEvents, initialData.currency)
  }, [filteredEvents, initialData.currency])

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<TimelineEventCategory, number>> = {
      all: initialData.events.length,
      milestones: initialData.events.filter((e) => e.isMilestone).length,
      transactions: initialData.events.filter((e) => e.category === "transactions").length,
      bills_subscriptions: initialData.events.filter((e) => e.category === "bills_subscriptions").length,
      investments: initialData.events.filter((e) => e.category === "investments").length,
      loans: initialData.events.filter((e) => e.category === "loans").length,
      shared: initialData.events.filter((e) => e.category === "shared").length,
    }
    return counts
  }, [initialData.events])

  const hasActiveFilters = categoryParam !== "all" || Boolean(search) || Boolean(urlFrom) || Boolean(urlTo)

  // Export handlers
  const handleExport = (exportFormat: "json" | "csv") => {
    if (filteredEvents.length === 0) {
      toast.error("No events to export")
      return
    }

    try {
      let blob: Blob
      let filename: string

      if (exportFormat === "json") {
        const jsonStr = JSON.stringify(filteredEvents, null, 2)
        blob = new Blob([jsonStr], { type: "application/json" })
        filename = `financial-timeline-${format(new Date(), "yyyy-MM-dd")}.json`
      } else {
        // CSV formatting
        const headers = [
          "ID",
          "Date",
          "Type",
          "Category",
          "Title",
          "Description",
          "Amount",
          "Currency",
          "Impact",
          "IsMilestone",
        ]
        const rows = filteredEvents.map((e) => [
          `"${e.id}"`,
          `"${e.date}"`,
          `"${e.type}"`,
          `"${e.category}"`,
          `"${(e.title || "").replace(/"/g, '""')}"`,
          `"${(e.description || "").replace(/"/g, '""')}"`,
          e.amount !== undefined ? (e.amount / 100).toFixed(2) : "0",
          `"${e.currency || initialData.currency}"`,
          `"${e.impact}"`,
          e.isMilestone ? "true" : "false",
        ])

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
        blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        filename = `financial-timeline-${format(new Date(), "yyyy-MM-dd")}.csv`
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${filteredEvents.length} events as ${exportFormat.toUpperCase()}`)
    } catch {
      toast.error("Failed to export timeline events")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header with Date picker & Export */}
      <TimelineHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        totalCount={filteredEvents.length}
        onExport={handleExport}
      />

      {/* Stats Summary Bento Strip */}
      <TimelineStatsBanner stats={stats} />

      {/* Category Filter Chips & Search Toolbar */}
      <TimelineFilterChips
        selectedCategory={categoryParam}
        onSelectCategory={handleCategoryChange}
        counts={categoryCounts}
        searchQuery={search}
        onSearchChange={handleSearchChange}
      />

      {/* Main Feed or Empty State */}
      {filteredEvents.length === 0 ? (
        <TimelineEmptyState
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <TimelineFeed
          groups={groups}
          currency={initialData.currency}
          totalCount={filteredEvents.length}
          visibleCount={visibleEvents.length}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}
