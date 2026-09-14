"use client"

import Link from "next/link"
import { Search, Plus, PiggyBank, Target, Users, ArrowLeftRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export interface CommandCenterCardProps {
  className?: string
}

export function CommandCenterCard({ className }: CommandCenterCardProps = {}) {
  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"))
  }

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between gap-4 border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            command & search
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Universal shortcuts</span>
        </div>

        {/* Search trigger */}
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Search transactions, merchants, categories, goals... (Press ⌘K or Ctrl K)"
          className="group/search flex w-full cursor-pointer select-none items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2.5 transition-colors hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/search:text-foreground" />
          <span className="flex-1 text-left text-sm text-muted-foreground">
            Search transactions, merchants, categories, goals...
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
              ⌘K
            </Kbd>
            <Kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
              Ctrl K
            </Kbd>
          </div>
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-1">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          quick actions
        </span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/transactions?new=1">
            <Plus className="size-3.5" />
            Add Transaction
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/budgets">
            <PiggyBank className="size-3.5" />
            New Budget
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/goals">
            <Target className="size-3.5" />
            Add Goal
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/shared-expenses">
            <Users className="size-3.5" />
            Settle Up
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/wallets">
            <ArrowLeftRight className="size-3.5" />
            Transfer
          </Link>
        </Button>
      </div>
    </Card>
  )
}
