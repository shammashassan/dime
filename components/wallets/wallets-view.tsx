"use client"

import { useState, useTransition } from "react"
import { Wallet } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia
} from "@/components/ui/empty"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
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
import { WalletForm } from "./wallet-form"
import { toggleArchiveWallet, deleteWallet } from "@/lib/actions/wallets"
import { useRouter } from "next/navigation"
import {
  Landmark,
  Wallet as WalletIcon,
  Coins,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Plus,
  Archive,
  Trash2,
  Eye,
  Edit,
  Loader2,
  HandCoins,
  ArchiveRestore,
  Search,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"

interface WalletsViewProps {
  wallets: Wallet[]
}

const iconMap: Record<string, React.ElementType> = {
  Landmark,
  Wallet: WalletIcon,
  Coins,
  CreditCard,
  TrendingUp,
  PiggyBank,
  HandCoins,
}

function CardChip() {
  return (
    <div className="size-5 rounded-sm border border-amber-400/30 bg-amber-400/10 relative overflow-hidden flex items-center justify-center shrink-0">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-amber-400/25" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-amber-400/25" />
      <div className="size-2.5 rounded-xs border border-amber-400/30 bg-amber-400/10 z-10" />
    </div>
  )
}

function MetricCard({ icon: Icon, color, label, value, valueClassName, className, style }: any) {
  return (
    <Card className={cn("group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-50", className)} style={style}>
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}, transparent 60%)` }} />
      <CardContent className="relative p-4 flex items-center gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: color + "18", color }}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 truncate">{label}</p>
          <p className={cn("text-xl font-black tabular-nums leading-tight truncate", valueClassName)}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function WalletsView({ wallets }: WalletsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "active" | "archived">("active")
  const [search, setSearch] = useState("")
  const { data: session } = authClient.useSession()

  const handleToggleArchive = (id: string) => {
    const wallet = wallets.find((w) => w._id.toString() === id)
    const isArchiving = wallet ? !wallet.isArchived : true
    const archivePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await toggleArchiveWallet(id)
          if (res && !res.success) {
            reject(new Error(res.error || "Unauthorized"))
          } else {
            router.refresh()
            resolve(true)
          }
        } catch (err) { reject(err) }
      })
    })
    toast.promise(archivePromise, {
      loading: isArchiving ? "Archiving..." : "Restoring...",
      success: isArchiving ? "Wallet archived" : "Wallet restored",
      error: (err: Error) => err.message || (isArchiving ? "Failed to archive" : "Failed to restore"),
    })
  }

  const handleDelete = async () => {
    if (!deletingWalletId) return
    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteWallet(deletingWalletId)
          if (res && !res.success) {
            reject(new Error(res.error || "Unauthorized"))
          } else {
            setDeletingWalletId(null)
            router.refresh()
            resolve(true)
          }
        } catch (err) { reject(err) }
      })
    })
    toast.promise(deletePromise, {
      loading: "Deleting...",
      success: "Wallet deleted",
      error: (err: Error) => err.message || "Failed to delete",
    })
  }

  const activeWallets = wallets.filter((w) => !w.isArchived)
  const archivedWallets = wallets.filter((w) => w.isArchived)

  const displayedWallets = wallets.filter(w => {
    if (activeTab === "active") return !w.isArchived
    if (activeTab === "archived") return w.isArchived
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      if (!w.name.toLowerCase().includes(lowerSearch)) {
        return false
      }
    }
    return true
  })

  const tabCounts = {
    all: wallets.length,
    active: activeWallets.length,
    archived: archivedWallets.length,
  }

  const tabNames: Record<string, string> = {
    all: `All (${tabCounts.all})`,
    active: `Active (${tabCounts.active})`,
    archived: `Archived (${tabCounts.archived})`,
  }

  const metrics = {
    totalBalance: activeWallets.reduce((sum, w) => sum + w.balance, 0),
    activeCount: activeWallets.length,
    archivedCount: archivedWallets.length,
  }

  const renderActiveCard = (w: Wallet) => {
    const Icon = iconMap[w.icon] || WalletIcon
    const isOwner = session?.user && w.userId === session.user.id

    return (
      <Card
        key={w._id.toString()}
        className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
        onClick={() => router.push(`/wallets/${w._id.toString()}`)}
      >
        {/* Top accent */}
        <div className="h-0.75 w-full shrink-0" style={{ backgroundColor: w.color }} />

        {/* Header */}
        <CardHeader className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 flex-row">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: w.color + "18", color: w.color }}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground truncate leading-tight">{w.name}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4">
                  {w.type.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
          <CardChip />
        </CardHeader>

        {/* Balance */}
        <CardContent className="px-4 pb-4">
          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Current Balance</p>
          <p className="text-[1.6rem] font-black tracking-tight tabular-nums text-foreground select-all leading-none">
            {formatCurrency(w.balance, w.currency)}
          </p>
        </CardContent>

        {/* Footer */}
        <Separator className="bg-border/30" />
        <CardFooter className="px-2.5 py-1 flex items-center justify-between mt-auto bg-muted/20" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" size="icon" className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => router.push(`/wallets/${w._id.toString()}`)}>
                    <Eye className="size-3" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">
                View transactions
              </TooltipContent>
            </Tooltip>

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="icon" className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => setEditingWallet(w)}>
                      <Edit className="size-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-xl font-medium">
                  Edit wallet
                </TooltipContent>
              </Tooltip>
            )}

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="icon" className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => handleToggleArchive(w._id.toString())} disabled={isPending}>
                      <Archive className="size-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-xl font-medium">
                  Archive wallet
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {isOwner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" size="icon"
                    className="size-6 rounded-md text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 translate-x-0 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200 lg:translate-x-1 lg:group-hover:translate-x-0"
                    onClick={() => setDeletingWalletId(w._id.toString())} disabled={isPending}>
                    <Trash2 className="size-3" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">
                Delete wallet
              </TooltipContent>
            </Tooltip>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <WalletIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Wallets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your bank accounts, credit cards, cash, and digital wallets.
            </p>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform"><Plus className="size-4" />Add Wallet</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
            <DialogHeader><DialogTitle className="text-xl font-extrabold">Add Wallet</DialogTitle></DialogHeader>
            <div className="py-2"><WalletForm onSuccess={() => setAddOpen(false)} /></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4">
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={Coins} color="#10b981" label="Total Active Balance" value={formatCurrency(metrics.totalBalance, activeWallets[0]?.currency || "USD")} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={WalletIcon} color="#6366f1" label="Active Wallets" value={metrics.activeCount} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={Archive} color="#f59e0b" label="Archived Wallets" value={metrics.archivedCount} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Filter (visible on sm and larger screens) */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            All ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "active"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Active ({tabCounts.active})
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "archived"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Archived ({tabCounts.archived})
          </button>
        </div>

        {/* Mobile Filter (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All ({tabCounts.all})
              </SelectItem>
              <SelectItem value="active" className="rounded-lg">
                Active ({tabCounts.active})
              </SelectItem>
              <SelectItem value="archived" className="rounded-lg">
                Archived ({tabCounts.archived})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <InputGroup className="w-full sm:w-60">
            <InputGroupInput
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wallets.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
            <Empty>
              <EmptyMedia className="bg-primary/5 text-primary">
                <WalletIcon className="size-8" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No wallets yet</EmptyTitle>
                <EmptyDescription>Add a wallet to start tracking your finances.</EmptyDescription>
              </EmptyHeader>
              <div className="mt-4">
                <Button onClick={() => setAddOpen(true)} className="rounded-xl font-bold gap-2"><Plus className="size-4" /> Add Wallet</Button>
              </div>
            </Empty>
          </Card>
        ) : displayedWallets.length > 0 ? displayedWallets.map(w => {
          if (w.isArchived) {
            const Icon = iconMap[w.icon] || WalletIcon
            return (
              <Card key={w._id.toString()} className="relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/40 bg-muted/30 flex flex-col cursor-pointer h-full"
                onClick={() => router.push(`/wallets/${w._id.toString()}`)}>
                <div className="h-0.75 w-full bg-muted shrink-0" />
                <CardHeader className="flex items-center gap-2.5 px-4 py-3 flex-row justify-start">
                  <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-muted/60 text-muted-foreground"><Icon className="size-4.5" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-muted-foreground truncate">{w.name}</p>
                    <Badge variant="secondary" className="mt-0.5 rounded-full text-[9px] uppercase font-bold px-2 py-0 h-4">Archived</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-0.5">Archived Balance</p>
                  <p className="text-[1.6rem] font-black text-muted-foreground tabular-nums leading-none">{formatCurrency(w.balance, w.currency)}</p>
                </CardContent>
                <Separator className="bg-border/30" />
                <CardFooter className="px-2.5 py-1 flex items-center justify-between mt-auto bg-muted/20" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 px-2.5 rounded-md text-[10px] font-bold gap-1.5 text-foreground hover:bg-muted/80"
                    onClick={() => handleToggleArchive(w._id.toString())} disabled={isPending}>
                    <ArchiveRestore className="size-3" />Restore
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="ghost" size="icon" className="size-6 rounded-md text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setDeletingWalletId(w._id.toString())} disabled={isPending}>
                          <Trash2 className="size-3" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="rounded-xl font-medium">
                      Delete wallet
                    </TooltipContent>
                  </Tooltip>
                </CardFooter>
              </Card>
            )
          } else {
            return renderActiveCard(w)
          }
        }) : (
          <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
            <Empty>
              <EmptyMedia className="bg-primary/5 text-primary">
                <WalletIcon className="size-8" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No wallets found</EmptyTitle>
                <EmptyDescription>Adjust your filters or search to find what you're looking for.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingWallet} onOpenChange={(open) => !open && setEditingWallet(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto min-w-0">
          <DialogHeader><DialogTitle>Edit Wallet</DialogTitle></DialogHeader>
          <div className="py-2">{editingWallet && <WalletForm initialWallet={editingWallet} onSuccess={() => setEditingWallet(null)} />}</div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingWalletId} onOpenChange={(open) => !open && setDeletingWalletId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
            <AlertDialogDescription>All associated transactions will also be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}