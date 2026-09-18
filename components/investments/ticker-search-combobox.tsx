"use client"

import * as React from "react"
import { Search, Loader2, Check, Coins, TrendingUp } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { searchMarketTickersAction } from "@/lib/actions/market-prices"
import type { TickerSearchResult } from "@/lib/ticker-search"
import { cn } from "@/lib/utils"

export interface TickerSearchComboboxProps {
  value: string
  onChange: (val: string) => void
  onSelectResult?: (result: TickerSearchResult) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export function TickerSearchCombobox({
  value,
  onChange,
  onSelectResult,
  placeholder = "Search ticker or asset (e.g. AAPL, BTC, SOL)...",
  className,
  id,
  disabled,
}: TickerSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState(value || "")
  const [results, setResults] = React.useState<TickerSearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  // Keep internal input text in sync if external value changes
  React.useEffect(() => {
    setSearchTerm(value || "")
  }, [value])

  // Debounced search query
  React.useEffect(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed || trimmed.length < 1) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchMarketTickersAction(trimmed)
        if (res.success) {
          setResults(res.results || [])
        }
      } catch (err) {
        console.warn("Search ticker error:", err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value.toUpperCase()
    setSearchTerm(newVal)
    onChange(newVal)
    if (!open && newVal.length > 0) {
      setOpen(true)
    }
  }

  const handleSelect = (item: TickerSearchResult) => {
    setSearchTerm(item.symbol)
    onChange(item.symbol)
    if (onSelectResult) {
      onSelectResult(item)
    }
    setOpen(false)
  }

  const handleUseCustom = () => {
    const custom = searchTerm.trim().toUpperCase()
    if (custom) {
      onChange(custom)
      if (onSelectResult) {
        onSelectResult({
          symbol: custom,
          name: custom,
          assetType: "stock",
        })
      }
    }
    setOpen(false)
  }

  return (
    <Popover open={open && searchTerm.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            id={id}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchTerm.trim().length > 0) setOpen(true)
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("uppercase font-mono font-medium rounded-xl pr-8", className)}
            autoComplete="off"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            {loading ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Search className="size-3.5 opacity-60" />
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-1 w-[320px] sm:w-[360px] rounded-2xl shadow-xl border-border/50 bg-popover"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[260px] overflow-y-auto space-y-0.5">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2 font-sans">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Searching market tickers...</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-3 text-center text-xs text-muted-foreground font-sans">
              <p>No exact market match found.</p>
              <button
                type="button"
                onClick={handleUseCustom}
                className="mt-2 text-primary hover:underline font-semibold block mx-auto text-[11px] cursor-pointer"
              >
                Use &ldquo;{searchTerm.trim().toUpperCase()}&rdquo; as custom symbol
              </button>
            </div>
          )}

          {results.map((item) => {
            const isSelected = item.symbol.toUpperCase() === value?.toUpperCase()
            const isCrypto = item.assetType === "crypto"

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "w-full text-left flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer hover:bg-muted/60",
                  isSelected && "bg-muted/80 font-semibold"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0 border border-border/40",
                      isCrypto ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                    )}
                  >
                    {isCrypto ? (
                      <Coins className="size-3.5" />
                    ) : (
                      <TrendingUp className="size-3.5" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-xs text-foreground shrink-0">
                        {item.symbol}
                      </span>
                      {item.exchange && (
                        <span className="text-[9px] font-mono text-muted-foreground/70 truncate">
                          • {item.exchange}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate font-sans">
                      {item.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono uppercase px-1.5 py-0 rounded-md border-border/40"
                  >
                    {item.assetType}
                  </Badge>
                  {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                </div>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
