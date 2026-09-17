"use client"

import React, { useRef, useEffect } from "react"
import type { TimelineDateGroup } from "@/types"
import { TimelineEventCard } from "./timeline-event-card"
import { ItemGroup } from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"
import { CalendarDays, ChevronDown } from "lucide-react"

interface TimelineFeedProps {
  groups: TimelineDateGroup[]
  currency: string
  totalCount?: number
  visibleCount?: number
  onLoadMore?: () => void
  hasMore?: boolean
}

export function TimelineFeed({
  groups,
  currency,
  totalCount = 0,
  visibleCount = 0,
  onLoadMore,
  hasMore = false,
}: TimelineFeedProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Infinite scroll trigger
  useEffect(() => {
    if (!hasMore || !onLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: "300px" }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [hasMore, onLoadMore])

  const remaining = Math.max(0, totalCount - visibleCount)

  return (
    <div className="flex flex-col gap-8 w-full">
      {groups.map((group) => {
        const hasNet = group.netAmount !== 0

        return (
          <div key={group.dateKey} className="flex flex-col gap-3">
            {/* Group Header */}
            <div className="flex items-center justify-between gap-4 sticky top-14 sm:top-16 z-10 bg-background/80 backdrop-blur-md py-1.5 px-1 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary ring-4 ring-primary/10" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground/70" />
                  <span>{group.label}</span>
                </h3>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {group.events.length}
                </span>
              </div>

              {hasNet && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden sm:inline">
                    Net:
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded-md border",
                      group.netAmount > 0
                        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                        : "text-rose-600 bg-rose-500/10 border-rose-500/20"
                    )}
                  >
                    {group.netAmount > 0 ? "+" : ""}
                    {formatCurrency(group.netAmount, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Event Items */}
            <ItemGroup className="gap-2.5 pl-2 sm:pl-3 border-l-2 border-border/40 ml-1">
              {group.events.map((event) => (
                <TimelineEventCard key={event.id} event={event} />
              ))}
            </ItemGroup>
          </div>
        )
      })}

      {/* Progressive Loading Sentinel & Controls */}
      {hasMore && (
        <div className="flex flex-col items-center justify-center pt-2 pb-6 gap-2">
          {/* Intersection Observer Sentinel */}
          <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

          {/* Manual Load More Button fallback */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            className="rounded-xl px-5 h-9 font-semibold text-xs border-border/40 hover:bg-muted/50 shadow-xs gap-2 cursor-pointer"
          >
            <ChevronDown className="size-3.5 text-muted-foreground" />
            <span>Load older events ({remaining} remaining)</span>
          </Button>
          <span className="text-[11px] text-muted-foreground/80 font-mono">
            Showing {visibleCount} of {totalCount} events
          </span>
        </div>
      )}

      {/* End of Feed Marker */}
      {!hasMore && totalCount > 25 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 border-t border-dashed border-border/40 text-center mt-2">
          <div className="size-2 rounded-full bg-primary/40 ring-4 ring-primary/10" />
          <p className="text-xs font-semibold text-muted-foreground">
            You&apos;ve reached the beginning of your financial timeline
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            All {totalCount} events loaded
          </p>
        </div>
      )}
    </div>
  )
}
