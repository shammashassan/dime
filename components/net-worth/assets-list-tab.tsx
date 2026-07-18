"use client"

import { useState, useTransition } from "react"
import { Asset } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AssetDialog } from "./asset-dialog"
import { archiveAsset, unarchiveAsset, deleteAsset } from "@/lib/actions/assets"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
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
  Trash2,
  Eye,
  Pencil,
  ArchiveRestore,
  Loader2,
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
  
  // Dialog/Modal states
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)

  // Filters state
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

  // Filter computation
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
      (categoryLabels[asset.category] || "").toLowerCase().includes(search.toLowerCase())
    
    const matchesKind = kindFilter === "all" || asset.kind === kindFilter
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && asset.status === "active") ||
      (statusFilter === "archived" && asset.status === "archived")

    return matchesSearch && matchesKind && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Search and filters bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-row gap-3 w-full">
          <div className="relative flex-1">
            <InputGroup>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Search className="size-4" />
              </div>
              <InputGroupInput
                placeholder="Search assets or liabilities..."
                className="pl-9 rounded-xl w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <Select value={kindFilter} onValueChange={(val: any) => setKindFilter(val)}>
            <SelectTrigger className="w-[130px] rounded-xl bg-transparent">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="asset">Assets</SelectItem>
              <SelectItem value="liability">Liabilities</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-[130px] rounded-xl bg-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="archived">Archived Only</SelectItem>
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AssetDialog
          trigger={
            <Button className="rounded-xl font-semibold w-full md:w-auto">
              <Plus className="size-4 mr-1.5" />
              Add Manual Item
            </Button>
          }
          onSuccess={() => router.refresh()}
        />
      </div>

      {/* Grid List */}
      {filteredAssets.length === 0 ? (
        <Card className="border border-border/40 bg-card rounded-2xl flex flex-col items-center justify-center p-12 text-center">
          <HelpCircle className="size-12 text-muted-foreground/60 mb-3 stroke-[1.5]" />
          <h3 className="font-bold text-lg">No items found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            Try adjusting your search filters or add a new manual asset or liability to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const Icon = categoryIconMap[asset.category] || HelpCircle
            const isAsset = asset.kind === "asset"
            const categoryLabel = categoryLabels[asset.category] || asset.category

            return (
              <Card
                key={asset._id.toString()}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Decorative colored glow on card */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    background: `radial-gradient(120% 100% at 0% 0%, ${
                      isAsset ? "#10B981" : "#EF4444"
                    }, transparent 60%)`,
                  }}
                />

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center shrink-0",
                          isAsset 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-rose-500/10 text-rose-500"
                        )}
                      >
                        <Icon className="size-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                          {asset.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          {categoryLabel}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
                        isAsset 
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500" 
                          : "border-rose-500/20 bg-rose-500/5 text-rose-500"
                      )}
                    >
                      {asset.kind}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-5 py-3 flex-1 flex flex-col justify-end">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                      Current Valuation
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black tabular-nums">
                        {formatCurrency(asset.currentValue, asset.currency)}
                      </span>
                      {asset.ownershipPercentage < 100 && (
                        <span className="text-[10px] text-muted-foreground/80 flex items-center font-medium bg-secondary px-1.5 py-0.5 rounded-md">
                          {asset.ownershipPercentage}% Owned
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-3 border-t border-border/40 bg-muted/30 flex gap-2 justify-end">
                  <div className="flex gap-1.5 w-full">
                    {/* View Details Button */}
                    <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0" asChild>
                      <Link href={`/net-worth/assets/${asset._id.toString()}`}>
                        <Eye className="size-3.5" />
                        <span className="sr-only">View Details</span>
                      </Link>
                    </Button>

                    {/* Edit Dialog Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-lg shrink-0"
                      onClick={() => setEditingAsset(asset)}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>

                    {/* Archive/Restore Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-lg shrink-0"
                      disabled={isPending}
                      onClick={() => handleToggleArchive(asset._id.toString(), asset.status === "archived")}
                    >
                      {isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : asset.status === "archived" ? (
                        <ArchiveRestore className="size-3.5" />
                      ) : (
                        <Archive className="size-3.5" />
                      )}
                      <span className="sr-only">
                        {asset.status === "archived" ? "Restore" : "Archive"}
                      </span>
                    </Button>

                    {/* Delete Alert Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-lg shrink-0 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 ml-auto"
                      onClick={() => setDeletingAssetId(asset._id.toString())}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Editing Dialog Modal (Controlled Dialog) */}
      <AssetDialog
        initialAsset={editingAsset || undefined}
        open={!!editingAsset}
        onOpenChange={(op) => {
          if (!op) setEditingAsset(null)
        }}
        onSuccess={() => {
          setEditingAsset(null)
          router.refresh()
        }}
      />

      {/* Deletion confirmation dialog */}
      <AlertDialog open={!!deletingAssetId} onOpenChange={(op) => { if (!op) setDeletingAssetId(null) }}>
        <AlertDialogContent className="rounded-2xl border border-border/40 shadow-xl max-w-[400px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this manual item and all of its historical valuation records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
