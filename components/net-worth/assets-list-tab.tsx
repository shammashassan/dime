"use client"

import { useState, useTransition } from "react"
import { Asset } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
} from "@/components/ui/empty"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import { AssetDialog } from "./asset-dialog"
import { ValuationDialog } from "./valuation-dialog"
import { archiveAsset, unarchiveAsset, deleteAsset } from "@/lib/actions/assets"
import {
  Home,
  Car,
  Coins,
  Globe,
  TrendingUp,
  Wallet,
  Building,
  GraduationCap,
  HandCoins,
  CreditCard,
  HelpCircle,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  SquarePen,
  Eye,
  Loader2,
  Layers,
} from "lucide-react"

const categoryIconMap: Record<string, React.ElementType> = {
  real_estate: Home,
  vehicle: Car,
  gold: Coins,
  crypto: Globe,
  investment: TrendingUp,
  cash: Wallet,
  mortgage: Building,
  student_loan: GraduationCap,
  auto_loan: Car,
  personal_loan: HandCoins,
  credit_card: CreditCard,
  other: HelpCircle,
}

const categoryLabels: Record<string, string> = {
  real_estate: "Real Estate",
  vehicle: "Vehicle",
  gold: "Gold",
  crypto: "Crypto",
  investment: "Investment",
  cash: "Cash",
  mortgage: "Mortgage",
  student_loan: "Student Loan",
  auto_loan: "Auto Loan",
  personal_loan: "Personal Loan",
  credit_card: "Credit Card",
  other: "Other",
}

interface AssetsListTabProps {
  assets: Asset[]
}

export function AssetsListTab({ assets }: AssetsListTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<"all" | "asset" | "liability">("all")
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active")

  const handleToggleArchive = (id: string, isCurrentlyArchived: boolean) => {
    startTransition(async () => {
      try {
        const result = isCurrentlyArchived
          ? await unarchiveAsset(id)
          : await archiveAsset(id)

        if (result.success) {
          toast.success(isCurrentlyArchived ? "Item restored" : "Item archived")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to update item status")
        }
      } catch (err) {
        console.error(err)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteAsset(id)
        if (result.success) {
          toast.success("Item deleted successfully")
          setDeletingAssetId(null)
          router.refresh()
        } else {
          toast.error(result.error || "Failed to delete item")
        }
      } catch (err) {
        console.error(err)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      (categoryLabels[asset.category] || "").toLowerCase().includes(search.toLowerCase())

    const matchesKind = kindFilter === "all" || asset.kind === kindFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && asset.status === "active") ||
      (statusFilter === "archived" && asset.status === "archived")

    return matchesSearch && matchesKind && matchesStatus
  })

  const activeCount = assets.filter((a) => a.status === "active").length
  const archivedCount = assets.filter((a) => a.status === "archived").length

  const tabNames: Record<string, string> = {
    active: `Active Only (${activeCount})`,
    archived: `Archived Only (${archivedCount})`,
    all: `Show All (${assets.length})`,
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Filter & Control Row — matches Loans list page pattern */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <InputGroup className="w-full sm:w-64">
            <InputGroupInput
              placeholder="Search assets or liabilities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>

          <Select value={kindFilter} onValueChange={(val: any) => setKindFilter(val)}>
            <SelectTrigger className="w-full sm:w-[140px] rounded-xl border-border/40 bg-card h-10">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">All Types</SelectItem>
              <SelectItem value="asset" className="rounded-lg">Assets</SelectItem>
              <SelectItem value="liability" className="rounded-lg">Liabilities</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-full sm:w-[150px] rounded-xl border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[statusFilter]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="active" className="rounded-lg">Active Only ({activeCount})</SelectItem>
              <SelectItem value="archived" className="rounded-lg">Archived Only ({archivedCount})</SelectItem>
              <SelectItem value="all" className="rounded-lg">Show All ({assets.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AssetDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          trigger={
            <Button
              type="button"
              className="w-full sm:w-auto rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform shrink-0"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add Manual Item
            </Button>
          }
          onSuccess={() => {
            setAddOpen(false)
            router.refresh()
          }}
        />
      </div>

      {/* Grid List — card layout mirrors the Loans card 1:1 (accent bar, header, two-stat row,
          Progress bar, footer with quick-action + Details) */}
      {assets.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Layers className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No assets or liabilities yet</EmptyTitle>
              <EmptyDescription>
                You haven't recorded any manual items yet. Track property, vehicles, investments, and debts here.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Button type="button" className="rounded-xl font-bold gap-2" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add your first item
              </Button>
            </div>
          </Empty>
        </Card>
      ) : filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const Icon = categoryIconMap[asset.category] || HelpCircle
            const isAsset = asset.kind === "asset"
            const categoryLabel = categoryLabels[asset.category] || asset.category
            const netOwnedValue = Math.round(asset.currentValue * (asset.ownershipPercentage / 100))
            const accent = isAsset ? "#10b981" : "#ef4444"
            const ownershipPct = asset.ownershipPercentage

            return (
              <Card
                key={asset._id.toString()}
                className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full justify-between"
                onClick={() => router.push(`/net-worth/assets/${asset._id.toString()}`)}
              >
                {/* Top accent — same as loan card */}
                <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: accent }} />

                {/* Header — icon + name + type/status badges, hover-revealed actions (matches loan card exactly) */}
                <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: `${accent}18`, color: accent }}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                        {asset.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
                          style={{
                            backgroundColor: `${accent}15`,
                            color: accent,
                            borderColor: `${accent}30`,
                          }}
                        >
                          {isAsset ? "Asset" : "Liability"}
                        </Badge>
                        <Badge variant="outline" className="rounded-md font-semibold text-[10px] h-4 px-1.5">
                          {categoryLabel}
                        </Badge>
                        {asset.status === "archived" && (
                          <Badge variant="outline" className="rounded-md font-semibold text-muted-foreground text-[10px] h-4 px-1.5">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg hover:bg-muted/70"
                            onClick={() => setEditingAsset(asset)}
                          >
                            <SquarePen className="size-3.5 text-muted-foreground" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Edit item
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg hover:bg-muted/70"
                          disabled={isPending}
                          onClick={() => handleToggleArchive(asset._id.toString(), asset.status === "archived")}
                        >
                          {isPending ? (
                            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                          ) : asset.status === "archived" ? (
                            <ArchiveRestore className="size-3.5 text-muted-foreground" />
                          ) : (
                            <Archive className="size-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        {asset.status === "archived" ? "Restore item" : "Archive item"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setDeletingAssetId(asset._id.toString())}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Delete item
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>

                {/* Body — two-stat row (Current Value / Ownership %) + Progress bar,
                    same visual weight as the loan card's Remaining / Repaid % + Progress */}
                <CardContent className="px-4 pb-3 flex flex-col gap-3">
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                        Current Value
                      </p>
                      <p className="text-[1.5rem] font-black tabular-nums text-foreground leading-none select-all">
                        {formatCurrency(asset.currentValue / 100, asset.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                        Owned
                      </p>
                      <p className={cn("text-[1.5rem] font-black tabular-nums leading-none", isAsset ? "text-emerald-500" : "text-rose-500")}>
                        {ownershipPct}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <Progress
                      value={ownershipPct}
                      indicatorStyle={{ backgroundColor: accent }}
                      className="h-2 bg-muted/60"
                    />
                    <div className="flex justify-between text-[9px] font-medium text-muted-foreground mt-1">
                      <span>{formatCurrency(netOwnedValue / 100, asset.currency)} net owned</span>
                      <span className="capitalize">{asset.valuationMethod} valuation</span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer — currency chip + quick action (Add Valuation, mirrors loan card's "Pay") + Details,
                    same button sizing/placement as the loan card */}
                <Separator className="bg-border/30" />
                <CardFooter className="px-3 py-2 flex items-center justify-between bg-muted/20 mt-auto" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Coins className="size-3" />
                    {asset.currency}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <ValuationDialog
                      assetId={asset._id.toString()}
                      assetCurrency={asset.currency}
                      trigger={
                        <Button size="sm" className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0">
                          Log Value
                        </Button>
                      }
                      onSuccess={() => router.refresh()}
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
                    >
                      <Link href={`/net-worth/assets/${asset._id.toString()}`}>
                        <Eye className="size-3 mr-1" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Layers className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No items found</EmptyTitle>
              <EmptyDescription>Adjust your filters or search to find what you're looking for.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}

      {/* Editing Dialog Modal (Controlled Dialog) */}
      <AssetDialog
        initialAsset={editingAsset || undefined}
        open={!!editingAsset}
        onOpenChange={(op) => {
          if (!op) setEditingAsset(null)
        }}
        trigger={null}
        onSuccess={() => {
          setEditingAsset(null)
          router.refresh()
        }}
      />

      {/* Deletion confirmation dialog */}
      <AlertDialog open={!!deletingAssetId} onOpenChange={(open) => !open && setDeletingAssetId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this manual item and all of its historical valuation records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold" disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-xl font-semibold"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                if (deletingAssetId) handleDelete(deletingAssetId)
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}