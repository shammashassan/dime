"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Category, Wallet } from "@/types"
import { Search, Calendar as CalendarIcon, SlidersHorizontal, X, ChevronDown, CircleDashed, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

interface TransactionFiltersProps {
  categories: Category[]
  wallets: Wallet[]
}

export function TransactionFilters({ categories, wallets }: TransactionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // URL-derived values for instant controls
  const type = searchParams.get("type") || "all"
  const wallet = searchParams.get("wallets") || "all"
  const category = searchParams.get("categories") || "all"
  const statusFilter = searchParams.get("status") || "all"

  // URL-derived values for text inputs
  const urlSearch = searchParams.get("search") || ""
  const urlMin = searchParams.get("minAmount") || ""
  const urlMax = searchParams.get("maxAmount") || ""

  // Local state for debounced text inputs
  const [search, setSearch] = useState(urlSearch)
  const [minAmount, setMinAmount] = useState(urlMin)
  const [maxAmount, setMaxAmount] = useState(urlMax)

  // Sync local text input state during render when URL searchParams change
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearch(urlSearch)
  }

  const [prevUrlMin, setPrevUrlMin] = useState(urlMin)
  if (urlMin !== prevUrlMin) {
    setPrevUrlMin(urlMin)
    setMinAmount(urlMin)
  }

  const [prevUrlMax, setPrevUrlMax] = useState(urlMax)
  if (urlMax !== prevUrlMax) {
    setPrevUrlMax(urlMax)
    setMaxAmount(urlMax)
  }

  // Date Range state directly derived from URL
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const dateRange: DateRange | undefined = fromParam
    ? {
        from: new Date(fromParam),
        to: toParam ? new Date(toParam) : undefined,
      }
    : undefined

  // Count active secondary filters
  let secondaryFilterCount = 0
  if (searchParams.has("wallets") && searchParams.get("wallets") !== "all") secondaryFilterCount++
  if (searchParams.has("from") || searchParams.has("to")) secondaryFilterCount++
  if (searchParams.has("minAmount") || searchParams.has("maxAmount")) secondaryFilterCount++
  if (searchParams.has("status") && searchParams.get("status") !== "all") secondaryFilterCount++

  // Collapsible open state (default to true if secondary filters are present in URL)
  const [isOpen, setIsOpen] = useState(secondaryFilterCount > 0)

  // Centralized URL updater that immediately pushes to router
  const updateUrl = useCallback(
    (
      updates: Partial<{
        search: string
        type: string
        wallets: string
        categories: string
        minAmount: string
        maxAmount: string
        status: string
        from: string | null
        to: string | null
      }>
    ) => {
      const params = new URLSearchParams(searchParams.toString())

      // Reset pagination on filter update
      params.delete("page")

      if ("search" in updates) {
        if (updates.search) params.set("search", updates.search)
        else params.delete("search")
      }
      if ("type" in updates) {
        if (updates.type && updates.type !== "all") params.set("type", updates.type)
        else params.delete("type")
      }
      if ("wallets" in updates) {
        if (updates.wallets && updates.wallets !== "all") params.set("wallets", updates.wallets)
        else params.delete("wallets")
      }
      if ("categories" in updates) {
        if (updates.categories && updates.categories !== "all") params.set("categories", updates.categories)
        else params.delete("categories")
      }
      if ("minAmount" in updates) {
        if (updates.minAmount) params.set("minAmount", updates.minAmount)
        else params.delete("minAmount")
      }
      if ("maxAmount" in updates) {
        if (updates.maxAmount) params.set("maxAmount", updates.maxAmount)
        else params.delete("maxAmount")
      }
      if ("status" in updates) {
        if (updates.status && updates.status !== "all") params.set("status", updates.status)
        else params.delete("status")
      }
      if ("from" in updates) {
        if (updates.from) params.set("from", updates.from)
        else params.delete("from")
      }
      if ("to" in updates) {
        if (updates.to) params.set("to", updates.to)
        else params.delete("to")
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [pathname, router, searchParams]
  )

  // Debounced effect for text/numeric inputs (search, minAmount, maxAmount)
  useEffect(() => {
    if (search === urlSearch && minAmount === urlMin && maxAmount === urlMax) {
      return
    }

    const timer = setTimeout(() => {
      updateUrl({
        search,
        minAmount,
        maxAmount,
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [search, minAmount, maxAmount, urlSearch, urlMin, urlMax, updateUrl])

  // Handlers for instant updates
  const handleTypeChange = (val: string) => {
    updateUrl({ type: val })
  }

  const handleCategoryChange = (val: string) => {
    updateUrl({ categories: val })
  }

  const handleWalletChange = (val: string) => {
    updateUrl({ wallets: val })
  }

  const handleStatusChange = (val: string) => {
    updateUrl({ status: val })
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      updateUrl({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      })
    } else if (!range?.from && !range?.to) {
      updateUrl({
        from: null,
        to: null,
      })
    }
  }

  const clearFilters = () => {
    setSearch("")
    setMinAmount("")
    setMaxAmount("")
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const hasActiveFilters =
    searchParams.has("search") ||
    (searchParams.has("type") && searchParams.get("type") !== "all") ||
    (searchParams.has("wallets") && searchParams.get("wallets") !== "all") ||
    (searchParams.has("categories") && searchParams.get("categories") !== "all") ||
    searchParams.has("minAmount") ||
    searchParams.has("maxAmount") ||
    searchParams.has("from") ||
    searchParams.has("to") ||
    (searchParams.has("status") && searchParams.get("status") !== "all")

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="p-4 rounded-xl border border-border/40 bg-card shadow-sm transition-all"
    >
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateUrl({ search, minAmount, maxAmount })
              }
            }}
            className="pl-9 h-9"
          />
        </div>

        {/* Type Select */}
        <div className="w-full sm:w-36">
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Select */}
        <div className="w-full sm:w-44">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="uncategorized">
                <div className="flex items-center gap-2">
                  <CircleDashed className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Uncategorized</span>
                </div>
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id.toString()} value={c._id.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collapsible Trigger for More Filters */}
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 font-medium gap-2 transition-colors",
              isOpen && "bg-muted/60",
              secondaryFilterCount > 0 && "border-primary/40 text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <span>Filters</span>
            {secondaryFilterCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs font-mono leading-none">
                {secondaryFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 font-medium text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="size-3.5" /> Clear
          </Button>
        )}

        {/* Pending Spinner */}
        {isPending && (
          <div className="flex items-center ml-auto sm:ml-0 pr-1">
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Secondary Filters (Collapsible Content) */}
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up pt-3 border-t border-border/40 mt-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Wallet Select */}
          <div className="w-full sm:w-44">
            <Select value={wallet} onValueChange={handleWalletChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Wallets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wallets</SelectItem>
                {wallets.map((w) => (
                  <SelectItem key={w._id.toString()} value={w._id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                      <span className="truncate">{w.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Picker */}
          <div className="w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 font-medium gap-2 text-muted-foreground justify-start",
                    dateRange?.from && "text-foreground"
                  )}
                >
                  <CalendarIcon className="size-3.5" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                <div className="p-1">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                  />
                  {dateRange?.from && (
                    <div className="p-2 border-t border-border/40 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDateRangeSelect(undefined)}
                        className="text-xs h-7 text-muted-foreground hover:text-foreground"
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount range */}
          <div className="w-full sm:w-48">
            <InputGroup className="w-full h-9 rounded-xl">
              <InputGroupInput
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-9 min-w-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-3"
              />
              <Separator orientation="vertical" />
              <InputGroupInput
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-9 min-w-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-3"
              />
            </InputGroup>
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-40">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
