"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Zap, Repeat, PieChart, Receipt, ArrowUpRight, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickActionsCardProps {
  categoriesWithSignals: { id: string; name: string; count: number }[]
  onSelectCategoryFilter?: (categoryId: string) => void
}

export function QuickActionsCard({
  categoriesWithSignals,
  onSelectCategoryFilter,
}: QuickActionsCardProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = React.useState<string>("")

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val)
    if (val) {
      if (onSelectCategoryFilter) {
        onSelectCategoryFilter(val)
      } else {
        router.push(`/transactions?categoryId=${val}`)
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      {/* ── Header ── */}
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Zap className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Quick Optimization Actions
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex-1 flex flex-col gap-3.5 justify-between">
        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            asChild
            className="w-full h-9 text-xs font-semibold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-98 transition-all px-3"
          >
            <Link href="/recurring" className="w-full flex items-center justify-between min-w-0 gap-2">
              <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <Repeat className="size-3.5 text-purple-500 shrink-0" />
                <span className="truncate">
                  Audit <span className="hidden 2xl:inline">Recurring </span>Subscriptions
                </span>
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground shrink-0" />
            </Link>
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full h-9 text-xs font-semibold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-98 transition-all px-3"
          >
            <Link href="/budgets" className="w-full flex items-center justify-between min-w-0 gap-2">
              <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <PieChart className="size-3.5 text-blue-500 shrink-0" />
                <span className="truncate">
                  Inspect Budget<span className="hidden 2xl:inline"> Allocation</span>s
                </span>
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground shrink-0" />
            </Link>
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full h-9 text-xs font-semibold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-98 transition-all px-3"
          >
            <Link href="/transactions" className="w-full flex items-center justify-between min-w-0 gap-2">
              <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <Receipt className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  <span className="hidden 2xl:inline">Browse </span>All Transactions
                </span>
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground shrink-0" />
            </Link>
          </Button>
        </div>

        {/* Category Diagnostic Filter */}
        <div className="border-t border-border/30 pt-3 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Category Drilldown
          </span>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full rounded-xl border-border/40 bg-card h-9 text-xs">
              <SelectValue placeholder="Jump to flagged category" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectGroup>
                {categoriesWithSignals.length > 0 ? (
                  categoriesWithSignals.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg text-xs">
                      {cat.name} ({cat.count} {cat.count === 1 ? "signal" : "signals"})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled className="rounded-lg text-xs">
                    No flagged categories
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Diagnostic Engine Status */}
        <div className="border-t border-border/30 pt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Rolling 120-Day Baseline
          </span>
          <span className="font-mono text-[10px]">z-score ≥ 1.8</span>
        </div>
      </div>
    </div>
  )
}
