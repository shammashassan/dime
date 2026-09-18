"use client"

import * as React from "react"
import { Asset, AssetValuation } from "@/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { Globe, RefreshCw } from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { syncAssetMarketPriceAction } from "@/lib/actions/assets"
import { TickerSearchCombobox } from "@/components/investments/ticker-search-combobox"
import { toast } from "sonner"

interface AssetMarketSyncCardProps {
  asset: Asset
  latestMarketValuation?: AssetValuation
  className?: string
}

function getDefaultSymbol(asset: Asset): string {
  if (asset.symbol) return asset.symbol.toUpperCase()
  if (asset.notes && asset.notes.includes("symbol:")) {
    const match = asset.notes.match(/symbol:\s*([A-Za-z0-9=.-]+)/i)
    if (match?.[1]) return match[1].toUpperCase()
  }

  // Category is gold: immediately return GC=F without checking name
  if (asset.category === "gold") {
    return "GC=F"
  }
  if (asset.category === "crypto") {
    const nameLower = asset.name.toLowerCase()
    if (nameLower.includes("ethereum") || nameLower.includes("eth")) return "ETH"
    if (nameLower.includes("solana") || nameLower.includes("sol")) return "SOL"
    return "BTC"
  }
  if (asset.category === "investment") {
    const trimmed = asset.name.trim().toUpperCase()
    if (/^[A-Z0-9.-]{1,6}$/.test(trimmed)) return trimmed
    return "SPY"
  }
  return "GC=F"
}

export function AssetMarketSyncCard({
  asset,
  latestMarketValuation,
  className,
}: AssetMarketSyncCardProps) {
  const [symbol, setSymbol] = React.useState(() => getDefaultSymbol(asset))
  const [quantity, setQuantity] = React.useState<string>("")
  const [isPending, startTransition] = React.useTransition()
  const [isConfiguring, setIsConfiguring] = React.useState(false)

  const isLive = asset.valuationMethod === "market" || !!latestMarketValuation

  const handleSync = () => {
    if (!symbol.trim()) {
      toast.error("Please provide a market ticker symbol (e.g. GC=F, BTC, AAPL)")
      return
    }

    startTransition(async () => {
      try {
        const qtyNum = quantity.trim() ? parseFloat(quantity) : undefined
        const res = await syncAssetMarketPriceAction({
          assetId: asset._id.toString(),
          symbol: symbol.trim(),
          quantity: qtyNum && !isNaN(qtyNum) ? qtyNum : undefined,
        })

        if (res.success && res.newValueCents !== undefined) {
          toast.success(
            `Valuation updated to ${formatCurrency(res.newValueCents, asset.currency)} (${res.symbol})`
          )
          setIsConfiguring(false)
        } else {
          toast.error(res.error || "Failed to sync market quote")
        }
      } catch (err: any) {
        toast.error(err.message || "An unexpected error occurred")
      }
    })
  }

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/40 bg-card shadow-xs gap-0 py-0 overflow-hidden flex-1 flex flex-col",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="size-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
            Market Sync
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] h-4.5 px-2 font-semibold gap-1 rounded-md",
            isLive
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
              : "border-border/40 text-muted-foreground"
          )}
        >
          {isLive && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          {isLive ? "Active Sync" : "Manual Method"}
        </Badge>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-xs">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Market Symbol</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-foreground text-[11px] bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                {symbol}
              </span>
              <button
                type="button"
                onClick={() => setIsConfiguring(!isConfiguring)}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                {isConfiguring ? "Done" : "Edit"}
              </button>
            </div>
          </div>

          {isConfiguring && (
            <div className="p-2.5 bg-muted/30 rounded-xl border border-border/30 space-y-2">
              <Field>
                <FieldLabel className="text-[10px] text-muted-foreground">
                  Ticker / Symbol (e.g. AAPL, BTC, GC=F)
                </FieldLabel>
                <TickerSearchCombobox
                  value={symbol}
                  onChange={(val) => setSymbol(val)}
                  onSelectResult={(res) => setSymbol(res.symbol)}
                  placeholder="e.g. AAPL, BTC, GC=F"
                  className="text-xs h-8"
                />
              </Field>
              <Field>
                <FieldLabel className="text-[10px] text-muted-foreground">
                  Units / Quantity (Optional)
                </FieldLabel>
                <InputGroup className="rounded-lg h-7">
                  <InputGroupInput
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 10 or 1.5"
                    className="text-xs h-7"
                  />
                </InputGroup>
              </Field>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Current Valuation</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(asset.currentValue, asset.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Last Synced</span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {latestMarketValuation
                ? formatDate(latestMarketValuation.date)
                : "Not synced yet"}
            </span>
          </div>
        </div>

        {/* ── Sync Button ── */}
        <Button
          size="sm"
          onClick={handleSync}
          disabled={isPending}
          className="rounded-xl w-full gap-2 font-bold text-xs h-8 cursor-pointer mt-1"
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          <span>{isPending ? "Syncing Market Data..." : "Sync with Live Market"}</span>
        </Button>
      </div>
    </Card>
  )
}
