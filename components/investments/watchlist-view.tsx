"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bookmark, Plus, Trash2, Tag, Target, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
  createWatchlistAction,
  deleteWatchlistAction,
  addWatchlistItemAction,
  removeWatchlistItemAction,
} from "@/lib/actions/watchlists"
import type { Watchlist, WatchlistItem } from "@/types"

interface WatchlistViewProps {
  watchlists: Array<Watchlist & { items: WatchlistItem[] }>
}

export function WatchlistView({ watchlists }: WatchlistViewProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newWatchlistName, setNewWatchlistName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  // Add Item Dialog State
  const [activeWatchlistId, setActiveWatchlistId] = React.useState<string | null>(null)
  const [itemSymbol, setItemSymbol] = React.useState("")
  const [itemName, setItemName] = React.useState("")
  const [itemAssetType, setItemAssetType] = React.useState<string>("stock")
  const [itemTargetPrice, setItemTargetPrice] = React.useState("")
  const [itemNotes, setItemNotes] = React.useState("")
  const [isAddingItem, setIsAddingItem] = React.useState(false)

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWatchlistName.trim()) return

    setIsCreating(true)
    try {
      const res = await createWatchlistAction({ name: newWatchlistName.trim() })
      if (res.success) {
        toast.success(`Created watchlist "${newWatchlistName.trim()}"`)
        setNewWatchlistName("")
        setIsCreateOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to create watchlist")
      }
    } catch {
      toast.error("An error occurred while creating watchlist")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteWatchlist = async (watchlistId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const res = await deleteWatchlistAction(watchlistId)
      if (res.success) {
        toast.success(`Deleted watchlist "${name}"`)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to delete watchlist")
      }
    } catch {
      toast.error("Failed to delete watchlist")
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWatchlistId || !itemSymbol.trim() || !itemName.trim()) return

    setIsAddingItem(true)
    try {
      const res = await addWatchlistItemAction({
        watchlistId: activeWatchlistId,
        symbol: itemSymbol.trim().toUpperCase(),
        name: itemName.trim(),
        assetType: itemAssetType as any,
        targetPrice: itemTargetPrice ? parseFloat(itemTargetPrice) : undefined,
        notes: itemNotes.trim() || undefined,
      })

      if (res.success) {
        toast.success(`Added ${itemSymbol.toUpperCase()} to watchlist`)
        setItemSymbol("")
        setItemName("")
        setItemAssetType("stock")
        setItemTargetPrice("")
        setItemNotes("")
        setActiveWatchlistId(null)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to add symbol to watchlist")
      }
    } catch {
      toast.error("Failed to add symbol")
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleRemoveItem = async (itemId: string, symbol: string) => {
    try {
      const res = await removeWatchlistItemAction(itemId)
      if (res.success) {
        toast.success(`Removed ${symbol} from watchlist`)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to remove item")
      }
    } catch {
      toast.error("Failed to remove item")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bookmark className="size-5 text-primary" />
            Watchlists & Market Monitors
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track prospective securities, target entry prices, and market ideas
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 self-start sm:self-auto">
              <Plus className="size-4" />
              <span>New Watchlist</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Watchlist</DialogTitle>
              <DialogDescription>
                Group target symbols by strategy, sector, or investment thesis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWatchlist} className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wl-name">Watchlist Name</Label>
                <Input
                  id="wl-name"
                  placeholder="e.g. High Dividend Stocks, Crypto DCA, Tech Leaders"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || !newWatchlistName.trim()}>
                  {isCreating ? <Loader2 className="animate-spin size-4" /> : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Watchlists Grid */}
      {watchlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20 gap-3">
          <Bookmark className="size-10 text-muted-foreground/50" />
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base text-foreground">No watchlists created yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Create your first watchlist to track market symbols, target buy prices, and ideas
              before committing capital.
            </p>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 mt-1">
            <Plus className="size-4" /> Create First Watchlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {watchlists.map((wl) => (
            <Card key={wl._id.toString()} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">{wl.name}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0">
                    {wl.items.length} {wl.items.length === 1 ? "symbol" : "symbols"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setActiveWatchlistId(wl._id.toString())}
                    title="Add Symbol"
                  >
                    <Plus className="size-3.5 text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDeleteWatchlist(wl._id.toString(), wl.name)}
                    title="Delete Watchlist"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-3">
                {wl.items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <span>No symbols in this watchlist yet.</span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveWatchlistId(wl._id.toString())}
                      className="gap-1 text-xs"
                    >
                      <Plus className="size-3" /> Add Symbol
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {wl.items.map((item) => (
                      <div
                        key={item._id.toString()}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant="outline" className="font-mono font-bold text-xs uppercase shrink-0">
                            {item.symbol}
                          </Badge>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              {item.assetType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {item.targetPrice && (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground">Target</span>
                              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                ${item.targetPrice}
                              </span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveItem(item._id.toString(), item.symbol)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Remove"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Symbol Dialog */}
      <Dialog
        open={activeWatchlistId !== null}
        onOpenChange={(open) => {
          if (!open) setActiveWatchlistId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Symbol to Watchlist</DialogTitle>
            <DialogDescription>
              Enter the market ticker symbol, company name, and optional target price.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-symbol">Ticker Symbol *</Label>
                <Input
                  id="item-symbol"
                  placeholder="e.g. AAPL, NVDA, BTC"
                  value={itemSymbol}
                  onChange={(e) => setItemSymbol(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-type">Asset Type</Label>
                <Select value={itemAssetType} onValueChange={setItemAssetType}>
                  <SelectTrigger id="item-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-name">Asset / Company Name *</Label>
              <Input
                id="item-name"
                placeholder="e.g. Apple Inc., Nvidia Corporation, Bitcoin"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-target">Target Entry Price (Optional)</Label>
              <Input
                id="item-target"
                type="number"
                step="any"
                placeholder="e.g. 150.00"
                value={itemTargetPrice}
                onChange={(e) => setItemTargetPrice(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-notes">Notes (Optional)</Label>
              <Input
                id="item-notes"
                placeholder="e.g. Waiting for earnings dip, long-term buy"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveWatchlistId(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingItem || !itemSymbol.trim() || !itemName.trim()}>
                {isAddingItem ? <Loader2 className="animate-spin size-4" /> : "Add to Watchlist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
