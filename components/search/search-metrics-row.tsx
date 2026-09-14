import React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { Search, Layers, SlidersHorizontal, Bookmark } from "lucide-react"
import type { SearchEntityType } from "@/lib/search/types"

const ENTITY_LABELS: Record<string, string> = {
  transaction: "Transactions",
  wallet: "Accounts",
  budget: "Budgets",
  goal: "Goals",
  recurring: "Recurring",
  investment: "Investments",
  loan: "Loans",
  contact: "Contacts",
  asset: "Assets",
  liability: "Liabilities",
}

interface SearchMetricsRowProps {
  totalCount: number
  countsByEntity: Record<SearchEntityType, number>
  activeFiltersCount: number
  savedSearchesCount: number
}

export function SearchMetricsRow({
  totalCount,
  countsByEntity,
  activeFiltersCount,
  savedSearchesCount,
}: SearchMetricsRowProps) {
  // Determine top domain/entity
  let topEntityName = "None"
  let topCount = 0

  for (const [key, count] of Object.entries(countsByEntity || {})) {
    if (typeof count === "number" && count > topCount) {
      topCount = count
      topEntityName = ENTITY_LABELS[key] || key
    }
  }

  const topEntityDisplay = topCount > 0 ? `${topEntityName} (${topCount})` : "None"

  return (
    <div className="flex flex-wrap gap-4 w-full">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Search}
        color="#8b5cf6"
        label="Total Matches"
        value={totalCount.toString()}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Layers}
        color="#10b981"
        label="Top Domain"
        value={topEntityDisplay}
        valueClassName={topCount > 0 ? "text-emerald-500" : undefined}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={SlidersHorizontal}
        color="#3b82f6"
        label="Active Criteria"
        value={activeFiltersCount > 0 ? `${activeFiltersCount} Active` : "0 Filters"}
        valueClassName={activeFiltersCount > 0 ? "text-blue-500" : undefined}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={Bookmark}
        color="#f59e0b"
        label="Saved Searches"
        value={savedSearchesCount.toString()}
        valueClassName={savedSearchesCount > 0 ? "text-amber-500" : undefined}
      />
    </div>
  )
}
