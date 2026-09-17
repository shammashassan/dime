"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Target,
  Repeat,
  TrendingUp,
  HandCoins,
  Users,
  Landmark,
  LayoutDashboard,
  Bookmark,
  Trash2,
  SlidersHorizontal,
  X,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  FileText,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { SearchMetricsRow } from "@/components/search/search-metrics-row"
import { SearchFilterPills } from "@/components/search/search-filter-pills"
import { SaveSearchDialog } from "@/components/search/save-search-dialog"
import { universalSearchAction, deleteSavedSearchAction } from "@/lib/actions/search"
import { formatCurrency, cn } from "@/lib/utils"
import type {
  UniversalSearchResults,
  SearchResultItem,
  SerializedSavedSearch,
} from "@/types"

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Target,
  Repeat,
  TrendingUp,
  HandCoins,
  Users,
  Landmark,
  Sparkles,
  FileText,
}

interface SearchResultsViewProps {
  initialQuery: string
  initialResults: UniversalSearchResults
  initialSavedSearches: SerializedSavedSearch[]
}

export function SearchResultsView({
  initialQuery,
  initialResults,
  initialSavedSearches,
}: SearchResultsViewProps) {
  const [query, setQuery] = React.useState(initialQuery)
  const [results, setResults] = React.useState<UniversalSearchResults>(initialResults)
  const [savedSearches, setSavedSearches] = React.useState<SerializedSavedSearch[]>(initialSavedSearches)
  const [activeTab, setActiveTab] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)

  // Sync with search when query changes
  const runSearch = React.useCallback(async (q: string) => {
    const trimmed = q.trim()
    setLoading(true)
    try {
      const res = await universalSearchAction(trimmed, 20)
      setResults(res)

      // Sync URL without triggering full page reload
      const newUrl = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search"
      window.history.replaceState(null, "", newUrl)
    } catch (err) {
      toast.error("Failed to run search query")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search on typing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query)
    }, 250)

    return () => clearTimeout(timer)
  }, [query, runSearch])

  const handleClear = () => {
    setQuery("")
  }

  const handleAppendOperator = (syntax: string) => {
    setQuery((prev) => {
      const trimmed = prev.trim()
      return trimmed ? `${trimmed} ${syntax}` : syntax
    })
  }

  const handleDeleteSavedSearch = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await deleteSavedSearchAction(id)
      if (res.success) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id))
        toast.success(`Removed saved search "${name}"`)
      } else {
        toast.error(res.error || "Failed to delete saved search")
      }
    } catch {
      toast.error("Failed to delete saved search")
    }
  }

  const { countsByEntity, parsedQuery } = results

  const countTransactions = countsByEntity?.transaction || 0
  const countWallets = countsByEntity?.wallet || 0
  const countBudgetsGoals = (countsByEntity?.budget || 0) + (countsByEntity?.goal || 0)
  const countRecurring = countsByEntity?.recurring || 0
  const countInvestments = countsByEntity?.investment || 0
  const countLoansContacts = (countsByEntity?.loan || 0) + (countsByEntity?.contact || 0)
  const countNetWorth = (countsByEntity?.asset || 0) + (countsByEntity?.liability || 0)

  // Tab definitions matching Dime design system
  const tabs = [
    { id: "all", label: "All Results", icon: Layers, count: results.totalCount },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight, count: countTransactions },
    { id: "wallets", label: "Accounts", icon: Wallet, count: countWallets },
    { id: "budgets_goals", label: "Budgets & Goals", icon: PiggyBank, count: countBudgetsGoals },
    { id: "recurring", label: "Recurring", icon: Repeat, count: countRecurring },
    { id: "investments", label: "Investments", icon: TrendingUp, count: countInvestments },
    { id: "loans_contacts", label: "Loans & People", icon: HandCoins, count: countLoansContacts },
    { id: "net_worth", label: "Net Worth", icon: Landmark, count: countNetWorth },
    { id: "saved", label: "Saved Searches", icon: Bookmark, count: savedSearches.length },
  ]

  // Filter items by active tab
  const getTabItems = (): SearchResultItem[] => {
    if (activeTab === "all") return results.items
    if (activeTab === "transactions") return results.items.filter((i) => i.entityType === "transaction")
    if (activeTab === "wallets") return results.items.filter((i) => i.entityType === "wallet")
    if (activeTab === "budgets_goals") {
      return results.items.filter((i) => i.entityType === "budget" || i.entityType === "goal")
    }
    if (activeTab === "recurring") return results.items.filter((i) => i.entityType === "recurring")
    if (activeTab === "investments") return results.items.filter((i) => i.entityType === "investment")
    if (activeTab === "loans_contacts") {
      return results.items.filter((i) => i.entityType === "loan" || i.entityType === "contact")
    }
    if (activeTab === "net_worth") {
      return results.items.filter((i) => i.entityType === "asset" || i.entityType === "liability")
    }
    return results.items
  }

  const tabItems = getTabItems()

  // Grouped items for the Overview / All tab
  const groupedSections = [
    {
      tabId: "transactions",
      title: "Transactions",
      icon: ArrowLeftRight,
      items: results.items.filter((i) => i.entityType === "transaction"),
    },
    {
      tabId: "wallets",
      title: "Accounts & Wallets",
      icon: Wallet,
      items: results.items.filter((i) => i.entityType === "wallet"),
    },
    {
      tabId: "budgets_goals",
      title: "Budgets & Goals",
      icon: PiggyBank,
      items: results.items.filter((i) => i.entityType === "budget" || i.entityType === "goal"),
    },
    {
      tabId: "recurring",
      title: "Recurring & Bills",
      icon: Repeat,
      items: results.items.filter((i) => i.entityType === "recurring"),
    },
    {
      tabId: "investments",
      title: "Investments & Assets",
      icon: TrendingUp,
      items: results.items.filter((i) => i.entityType === "investment"),
    },
    {
      tabId: "loans_contacts",
      title: "Loans & Contacts",
      icon: HandCoins,
      items: results.items.filter((i) => i.entityType === "loan" || i.entityType === "contact"),
    },
    {
      tabId: "net_worth",
      title: "Net Worth (Assets & Liabilities)",
      icon: Landmark,
      items: results.items.filter((i) => i.entityType === "asset" || i.entityType === "liability"),
    },
  ].filter((sec) => sec.items.length > 0)

  const renderResultItemCard = (item: SearchResultItem) => {
    const Icon = ICON_MAP[item.iconName] || LayoutDashboard

    return (
      <Link
        key={`${item.entityType}-${item.id}`}
        href={item.url}
        className="group flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-xs transition-all duration-200"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="size-10 rounded-xl bg-muted/80 flex items-center justify-center shrink-0 group-hover:bg-primary/10 text-foreground group-hover:text-primary transition-colors">
            <Icon className="size-5" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {item.title}
              </span>
              {item.badge && (
                <Badge
                  variant={item.badge.variant || "secondary"}
                  className="text-[10px] px-1.5 py-0 h-4 font-medium shrink-0 rounded-md"
                >
                  {item.badge.label}
                </Badge>
              )}
            </div>

            {item.subtitle && (
              <span className="text-xs text-muted-foreground truncate mt-0.5">
                {item.subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {item.amount !== undefined && (
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(item.amount, item.currency)}
            </span>
          )}
          <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── 1. Page Header (Standard Dime Structure) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Search className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Search Hub
              </h1>
              <Badge
                variant="outline"
                className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5"
              >
                {results.totalCount} {results.totalCount === 1 ? "Result" : "Results"}
              </Badge>
              {parsedQuery.activeBadges.length > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-md text-[10px] h-5 font-medium text-muted-foreground"
                >
                  {parsedQuery.activeBadges.length}{" "}
                  {parsedQuery.activeBadges.length === 1 ? "filter" : "filters"} active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Instant multi-domain search across transactions, accounts, budgets, recurring platforms, and holdings.
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {query.trim().length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="rounded-xl font-bold gap-2 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9 shadow-2xs"
            >
              <Bookmark className="size-3.5 text-primary" aria-hidden="true" />
              Save Search
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Top Bento KPI Row ── */}
      <SearchMetricsRow
        totalCount={results.totalCount}
        countsByEntity={countsByEntity}
        activeFiltersCount={parsedQuery.activeBadges.length}
        savedSearchesCount={savedSearches.length}
      />

      {/* ── 3. Search & Filter Bar (shadcn InputGroup + Operators) ── */}
      <div className="flex flex-col gap-3 w-full bg-card rounded-2xl border border-border/50 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <InputGroup className="h-11 rounded-xl border-border/60 bg-muted/30 flex-1">
            <Search className="size-4 text-muted-foreground ml-3 shrink-0" />
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all financial records or use operators (e.g. category:Food amount>100 date:this-month)..."
              className="text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="mr-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title="Clear search query"
              >
                <X className="size-4" />
              </button>
            )}
          </InputGroup>
        </div>

        {/* Quick Operator Shortcuts */}
        <div className="flex flex-col gap-2 pt-1 border-t border-border/30">
          <SearchFilterPills onSelectOperator={handleAppendOperator} />

          {/* Active parsed badges */}
          {parsedQuery.activeBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <SlidersHorizontal className="size-3" /> Active Criteria:
              </span>
              {parsedQuery.activeBadges.map((b, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="gap-1 px-2.5 py-0.5 text-xs font-normal rounded-lg bg-muted/70 text-foreground border border-border/40"
                >
                  <span className="text-muted-foreground">{b.label}:</span>
                  <span className="font-semibold">{b.value}</span>
                </Badge>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors ml-1 underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Unified Tab Switcher (Horizontally scrollable on small screens, never overflows) ── */}
      <div className="w-full min-w-0 rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
        <div className="overflow-x-auto scrollbar-hide flex items-center gap-1 min-w-0">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TabIcon className="size-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-muted-foreground/10 rounded-md">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 5. Main Tab Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-muted/40 animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : activeTab === "saved" ? (
        /* Saved Searches Tab */
        savedSearches.length === 0 ? (
          <Empty className="rounded-2xl border border-dashed border-border/60 p-10 flex flex-col items-center justify-center text-center bg-card/30">
            <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Bookmark className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-lg font-bold text-foreground">
                No Saved Searches Yet
              </EmptyTitle>
              <EmptyDescription className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1">
                Save complex multi-operator filters (e.g. food spending over $100 this month) for instant one-click access whenever you need them.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("category:Food amount>50")
                  setActiveTab("all")
                }}
                className="rounded-xl text-xs h-8 cursor-pointer"
              >
                Try "category:Food amount&gt;50"
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSearches.map((s) => (
              <Card
                key={s.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50 p-4 transition-all hover:border-primary/50 hover:shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Bookmark className="size-4" />
                    </div>
                    <span className="font-semibold text-sm text-foreground truncate">
                      {s.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSavedSearch(s.id, s.name, e)}
                    className="text-muted-foreground/60 hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                    title="Delete saved search"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border/40 p-2 font-mono text-xs text-foreground/80 break-all select-all">
                  {s.query}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(s.query)
                    setActiveTab("all")
                  }}
                  className="w-full rounded-xl text-xs font-semibold gap-1.5 h-8 border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <Play className="size-3" />
                  Run Search
                </Button>
              </Card>
            ))}
          </div>
        )
      ) : tabItems.length === 0 ? (
        /* Empty Results State */
        <Empty className="rounded-2xl border border-dashed border-border/60 p-10 flex flex-col items-center justify-center text-center bg-card/30">
          <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Filter className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-lg font-bold text-foreground">
              {query.trim() ? "No matching records found" : "Start searching your workspace"}
            </EmptyTitle>
            <EmptyDescription className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1">
              {query.trim()
                ? `We couldn't find any financial records matching "${query}". Try adjusting your operators or searching with different terms.`
                : "Search across transactions, accounts, budgets, investments, recurring platforms, and people."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("category:Food")}
              className="rounded-xl text-xs h-8 cursor-pointer"
            >
              Try category:Food
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("amount>100")}
              className="rounded-xl text-xs h-8 cursor-pointer"
            >
              Try amount&gt;100
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("date:this-month")}
              className="rounded-xl text-xs h-8 cursor-pointer"
            >
              Try date:this-month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("bill:overdue")}
              className="rounded-xl text-xs h-8 cursor-pointer"
            >
              Try bill:overdue
            </Button>
            {query.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="rounded-xl text-xs h-8 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                Reset search
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : activeTab === "all" ? (
        /* Sectioned Bento Overview on "All" Tab */
        <div className="flex flex-col gap-6">
          {groupedSections.map((sec) => {
            const SecIcon = sec.icon
            return (
              <div key={sec.tabId} className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <SecIcon className="size-4" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">{sec.title}</h2>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                      {sec.items.length}
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(sec.tabId)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 h-7 px-2 cursor-pointer"
                  >
                    View all {sec.items.length}
                    <ChevronRight className="size-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sec.items.slice(0, 4).map(renderResultItemCard)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Dedicated Entity Tab Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tabItems.map(renderResultItemCard)}
        </div>
      )}

      {/* ── 6. Save Search Dialog ── */}
      <SaveSearchDialog
        query={query}
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSaved={(newSaved) => {
          setSavedSearches((prev) => [newSaved, ...prev])
        }}
      />
    </div>
  )
}
