"use client"

import { useState, useTransition } from "react"
import { Wallet } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  Users,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { ShareWalletDialog } from "./share-wallet-dialog"

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
      <div className="size-2.5 rounded-[2px] border border-amber-400/30 bg-amber-400/10 z-10" />
    </div>
  )
}

export function WalletsView({ wallets }: WalletsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null)
  const [sharingWallet, setSharingWallet] = useState<Wallet | null>(null)
  const { data: session } = authClient.useSession()

  const handleToggleArchive = (id: string) => {
    const wallet = wallets.find((w) => w._id.toString() === id)
    const isArchiving = wallet ? !wallet.isArchived : true
    const archivePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await toggleArchiveWallet(id)
          router.refresh()
          resolve(true)
        } catch (err) { reject(err) }
      })
    })
    toast.promise(archivePromise, {
      loading: isArchiving ? "Archiving..." : "Restoring...",
      success: isArchiving ? "Wallet archived" : "Wallet restored",
      error: isArchiving ? "Failed to archive" : "Failed to restore",
    })
  }

  const handleDelete = async () => {
    if (!deletingWalletId) return
    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await deleteWallet(deletingWalletId)
          setDeletingWalletId(null)
          router.refresh()
          resolve(true)
        } catch (err) { reject(err) }
      })
    })
    toast.promise(deletePromise, {
      loading: "Deleting...",
      success: "Wallet deleted",
      error: "Failed to delete",
    })
  }

  const activeWallets = wallets.filter((w) => !w.isArchived)
  const archivedWallets = wallets.filter((w) => w.isArchived)

  const renderActiveCard = (w: Wallet) => {
    const Icon = iconMap[w.icon] || WalletIcon
    const isOwner = session?.user && w.userId === session.user.id
    
    return (
      <div
        key={w._id.toString()}
        className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
        onClick={() => router.push(`/wallets/${w._id.toString()}`)}
      >
        {/* Top accent */}
        <div className="h-[3px] w-full" style={{ backgroundColor: w.color }} />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
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
                {w.userId !== session?.user?.id && (
                  <span title="Shared Wallet">
                    <Users className="size-3.5 text-blue-500 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4">
                  {w.type.replace("_", " ")}
                </Badge>
                {w.sharedWith && w.sharedWith.length > 0 && w.userId === session?.user?.id && (
                  <Badge variant="outline" className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4 border-blue-500/20 text-blue-500 bg-blue-500/5">
                    Shared
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <CardChip />
        </div>

        {/* Balance */}
        <div className="px-4 pb-4">
          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Current Balance</p>
          <p className="text-[1.6rem] font-black tracking-tight tabular-nums text-foreground select-all leading-none">
            {formatCurrency(w.balance, w.currency)}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-2.5 py-1.5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => router.push(`/wallets/${w._id.toString()}`)}>
                  <Eye className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">
                View transactions
              </TooltipContent>
            </Tooltip>

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => setEditingWallet(w)}>
                    <Edit className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-xl font-medium">
                  Edit wallet
                </TooltipContent>
              </Tooltip>
            )}

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    onClick={() => setSharingWallet(w)}>
                    <Users className="size-3.5 text-blue-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-xl font-medium">
                  Share wallet
                </TooltipContent>
              </Tooltip>
            )}

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => handleToggleArchive(w._id.toString())} disabled={isPending}>
                    <Archive className="size-3.5" />
                  </Button>
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
                <Button variant="ghost" size="icon"
                  className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
                  onClick={() => setDeletingWalletId(w._id.toString())} disabled={isPending}>
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">
                Delete wallet
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0"><Landmark className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Wallets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your bank accounts, cards, and cash.</p>
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

      {/* Active */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-foreground">Active Wallets</h2>
          <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 font-bold border-border/60">{activeWallets.length}</Badge>
        </div>
        {activeWallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl p-10 text-center bg-muted/20">
            <WalletIcon className="size-8 text-muted-foreground/40 mb-2.5" />
            <p className="text-sm font-semibold">No active wallets</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">Add a wallet to start tracking your finances.</p>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="mt-3 rounded-lg font-semibold">Add Wallet</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeWallets.map(renderActiveCard)}
          </div>
        )}
      </section>

      {/* Archived */}
      {archivedWallets.length > 0 && (
        <section>
          <Separator className="mb-5 opacity-40" />
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-muted-foreground">Archived</h2>
            <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0 font-bold">{archivedWallets.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
            {archivedWallets.map((w) => {
              const Icon = iconMap[w.icon] || WalletIcon
              return (
                <div key={w._id.toString()} className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30 flex flex-col cursor-pointer"
                  onClick={() => router.push(`/wallets/${w._id.toString()}`)}>
                  <div className="h-[3px] w-full bg-muted" />
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-muted/60 text-muted-foreground"><Icon className="size-4.5" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-muted-foreground truncate">{w.name}</p>
                      <Badge variant="secondary" className="mt-0.5 rounded-full text-[9px] uppercase font-bold px-2 py-0 h-4">Archived</Badge>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-0.5">Archived Balance</p>
                    <p className="text-[1.6rem] font-black text-muted-foreground tabular-nums leading-none">{formatCurrency(w.balance, w.currency)}</p>
                  </div>
                  <div className="border-t border-border/30 px-2.5 py-1.5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1.5 text-foreground hover:bg-muted/80"
                      onClick={() => handleToggleArchive(w._id.toString())} disabled={isPending}>
                      <ArchiveRestore className="size-3" />Restore
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setDeletingWalletId(w._id.toString())} disabled={isPending}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Delete wallet
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingWallet} onOpenChange={(open) => !open && setEditingWallet(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Wallet</DialogTitle></DialogHeader>
          <div className="py-2">{editingWallet && <WalletForm initialWallet={editingWallet} onSuccess={() => setEditingWallet(null)} />}</div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingWalletId} onOpenChange={(open) => !open && setDeletingWalletId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600 dark:text-rose-400">Delete Wallet</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">All associated transactions will also be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5">
              {isPending && <Loader2 className="size-3.5 animate-spin" />}Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Wallet Dialog */}
      <ShareWalletDialog
        open={!!sharingWallet}
        onOpenChange={(open) => !open && setSharingWallet(null)}
        wallet={sharingWallet}
      />
    </div>
  )
}