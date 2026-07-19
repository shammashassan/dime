"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetDialog } from "../asset-dialog"
import { ValuationDialog } from "../valuation-dialog"
import { Asset } from "@/types"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, RefreshCw } from "lucide-react"

export function QuickActionsCard({ assets, onRefresh }: { assets: Asset[]; onRefresh: () => void }) {
  const [assetOpen, setAssetOpen] = React.useState(false)
  const [assetKind, setAssetKind] = React.useState<"asset" | "liability">("asset")
  const [selectedAssetId, setSelectedAssetId] = React.useState<string>("")

  const manualAssetsOnly = React.useMemo(() => {
    return assets.filter((a) => a.valuationMethod === "manual" && a.status === "active")
  }, [assets])

  const selectedAsset = React.useMemo(() => {
    return manualAssetsOnly.find((a) => a._id.toString() === selectedAssetId)
  }, [manualAssetsOnly, selectedAssetId])

  const openAssetDialog = (kind: "asset" | "liability") => {
    setAssetKind(kind)
    setAssetOpen(true)
  }

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Perform lightweight mutations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col gap-4 justify-between">
        <div className="grid grid-cols-2 gap-3.5">
          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-10 text-xs font-bold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all"
            onClick={() => openAssetDialog("asset")}
          >
            <PlusCircle className="size-4 text-emerald-500" />
            Add Asset
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-10 text-xs font-bold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all"
            onClick={() => openAssetDialog("liability")}
          >
            <PlusCircle className="size-4 text-rose-500" />
            Add Liability
          </Button>
        </div>

        <div className="border-t border-border/30 pt-4 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Log Valuation</span>
          <div className="flex flex-col gap-3">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="w-full rounded-xl border-border/40 bg-card h-10 text-xs">
                <SelectValue placeholder="Select manual item" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/40 rounded-xl">
                <SelectGroup>
                  {manualAssetsOnly.map((a) => (
                    <SelectItem key={a._id.toString()} value={a._id.toString()} className="rounded-lg text-xs">
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {selectedAsset ? (
              <ValuationDialog
                assetId={selectedAsset._id.toString()}
                assetCurrency={selectedAsset.currency}
                onSuccess={() => {
                  setSelectedAssetId("")
                  onRefresh()
                }}
                trigger={
                  <Button className="w-full rounded-xl text-xs font-bold h-10 gap-1.5 cursor-pointer active:scale-95 transition-all">
                    <RefreshCw className="size-3.5" />
                    Record Valuation
                  </Button>
                }
              />
            ) : (
              <Button disabled className="w-full rounded-xl text-xs font-bold h-10 gap-1.5">
                <RefreshCw className="size-3.5" />
                Record Valuation
              </Button>
            )}
          </div>
        </div>

        {/* Preset initialAsset to let modal correctly select asset vs liability kind */}
        <AssetDialog
          open={assetOpen}
          onOpenChange={setAssetOpen}
          initialAsset={{ kind: assetKind } as Asset}
          onSuccess={() => {
            setAssetOpen(false)
            onRefresh()
          }}
        />
      </CardContent>
    </Card>
  )
}
