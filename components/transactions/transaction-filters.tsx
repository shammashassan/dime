"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Category, Wallet } from "@/types"
import { Search, Calendar as CalendarIcon, SlidersHorizontal, X } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

interface TransactionFiltersProps {
  categories: Category[]
  wallets: Wallet[]
}

export function TransactionFilters({ categories, wallets }: TransactionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local state initialized from searchParams
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [type, setType] = useState(searchParams.get("type") || "all")
  const [wallet, setWallet] = useState(searchParams.get("wallets") || "all")
  const [category, setCategory] = useState(searchParams.get("categories") || "all")
  const [minAmount, setMinAmount] = useState(searchParams.get("minAmount") || "")
  const [maxAmount, setMaxAmount] = useState(searchParams.get("maxAmount") || "")

  // Date Range state
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam),
      }
    } else if (fromParam) {
      return { from: new Date(fromParam) }
    }
    return undefined
  })

  // Sync with searchParams
  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setType(searchParams.get("type") || "all")
    setWallet(searchParams.get("wallets") || "all")
    setCategory(searchParams.get("categories") || "all")
    setMinAmount(searchParams.get("minAmount") || "")
    setMaxAmount(searchParams.get("maxAmount") || "")

    if (fromParam && toParam) {
      setDateRange({ from: new Date(fromParam), to: new Date(toParam) })
    } else if (fromParam) {
      setDateRange({ from: new Date(fromParam) })
    } else {
      setDateRange(undefined)
    }
  }, [searchParams, fromParam, toParam])

  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Debounce/reset pagination on filter update
    params.delete("page")

    if (search) params.set("search", search)
    else params.delete("search")

    if (type && type !== "all") params.set("type", type)
    else params.delete("type")

    if (wallet && wallet !== "all") params.set("wallets", wallet)
    else params.delete("wallets")

    if (category && category !== "all") params.set("categories", category)
    else params.delete("categories")

    if (minAmount) params.set("minAmount", minAmount)
    else params.delete("minAmount")

    if (maxAmount) params.set("maxAmount", maxAmount)
    else params.delete("maxAmount")

    if (dateRange?.from) {
      params.set("from", dateRange.from.toISOString())
    } else {
      params.delete("from")
    }

    if (dateRange?.to) {
      params.set("to", dateRange.to.toISOString())
    } else {
      params.delete("to")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setType("all")
    setWallet("all")
    setCategory("all")
    setMinAmount("")
    setMaxAmount("")
    setDateRange(undefined)
    router.push(pathname)
  }

  const hasActiveFilters =
    searchParams.has("search") ||
    (searchParams.has("type") && searchParams.get("type") !== "all") ||
    (searchParams.has("wallets") && searchParams.get("wallets") !== "all") ||
    (searchParams.has("categories") && searchParams.get("categories") !== "all") ||
    searchParams.has("minAmount") ||
    searchParams.has("maxAmount") ||
    searchParams.has("from") ||
    searchParams.has("to")

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border/40 bg-card shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[240px] w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="pl-9 h-9"
        />
      </div>

      {/* Type Select */}
      <div className="w-full sm:w-36">
        <Select value={type} onValueChange={(val) => setType(val)}>
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

      {/* Wallet Select */}
      <div className="w-full sm:w-44">
        <Select value={wallet} onValueChange={(val) => setWallet(val)}>
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

      {/* Category Select */}
      <div className="w-full sm:w-44">
        <Select value={category} onValueChange={(val) => setCategory(val)}>
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

      {/* Date Range Picker */}
      <div className="w-full sm:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full h-9 font-semibold gap-1.5 text-muted-foreground">
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
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Amount range */}
      <div className="w-full sm:w-44">
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <Button onClick={applyFilters} className="flex-1 sm:flex-initial h-9 font-semibold">
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="flex-1 sm:flex-initial h-9 font-semibold text-muted-foreground gap-1">
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </div>
    </div>
  )
}
