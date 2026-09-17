"use client"

import React from "react"
import type { TimelineEventCategory } from "@/types"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import {
  Layers,
  Trophy,
  ArrowLeftRight,
  Receipt,
  TrendingUp,
  HandCoins,
  Users2,
  Search,
  X,
} from "lucide-react"

interface TimelineFilterChipsProps {
  selectedCategory: TimelineEventCategory
  onSelectCategory: (category: TimelineEventCategory) => void
  counts?: Partial<Record<TimelineEventCategory, number>>
  searchQuery?: string
  onSearchChange?: (q: string) => void
}

const CATEGORIES: Array<{
  id: TimelineEventCategory
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "all", label: "All Activity", icon: Layers },
  { id: "milestones", label: "Milestones", icon: Trophy },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "bills_subscriptions", label: "Bills & Subs", icon: Receipt },
  { id: "investments", label: "Investments", icon: TrendingUp },
  { id: "loans", label: "Loans & Debts", icon: HandCoins },
  { id: "shared", label: "Shared", icon: Users2 },
]

export function TimelineFilterChips({
  selectedCategory,
  onSelectCategory,
  counts,
  searchQuery,
  onSearchChange,
}: TimelineFilterChipsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 items-start sm:items-center justify-between w-full min-w-0">
      {/* Scrollable Tab Bar (Adaptive width matching Insights page) */}
      <div className="w-full sm:w-auto min-w-0 rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
        <div className="overflow-x-auto scrollbar-hide flex items-center gap-1 min-w-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isMilestone = cat.id === "milestones"
            const count = counts?.[cat.id]
            const isSelected = selectedCategory === cat.id

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5",
                  isSelected
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{cat.label}</span>
                {count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight",
                      isSelected
                        ? "bg-muted text-foreground"
                        : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                )}
                {isMilestone && <span className="text-[10px]">⭐</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search Bar on the same line */}
      {onSearchChange && (
        <div className="w-full sm:w-64 md:w-72 shrink-0">
          <InputGroup className="w-full h-10 rounded-xl bg-card border-border/40">
            <InputGroupAddon align="inline-start">
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="Search timeline events..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="text-xs placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
      )}
    </div>
  )
}
