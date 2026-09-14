"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"

interface SearchFilterPillsProps {
  onSelectOperator: (syntax: string) => void
}

const FILTER_PILLS = [
  { label: "Over $50", syntax: "amount>50 " },
  { label: "Over $100", syntax: "amount>100 " },
  { label: "Category: Food", syntax: "category:Food " },
  { label: "Category: Housing", syntax: "category:Housing " },
  { label: "This Month", syntax: "date:this-month " },
  { label: "Last Month", syntax: "date:last-month " },
  { label: "Overdue Bills", syntax: "bill:overdue " },
  { label: "Active Loans", syntax: "loan:active " },
  { label: "Active Subs", syntax: "subscription:active " },
  { label: "Cash Account", syntax: "wallet:Cash " },
  { label: "Stocks", syntax: "investment:stocks " },
  { label: "Split Txs", syntax: "transaction:split " },
]

export function SearchFilterPills({ onSelectOperator }: SearchFilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">Quick operators:</span>
      {FILTER_PILLS.map((pill) => (
        <button
          key={pill.label}
          type="button"
          onClick={() => onSelectOperator(pill.syntax)}
          className="inline-flex items-center rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground hover:bg-muted/50"
        >
          {pill.label}
        </button>
      ))}
    </div>
  )
}
