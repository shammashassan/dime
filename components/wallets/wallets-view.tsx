"use client"

import { useState, useTransition } from "react"
import { Wallet } from "@/types"
import { formatCurrency } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
} from "lucide-react"

interface WalletsViewProps {
  wallets: Wallet[]
}

const iconMap: Record<string, any> = {
  Landmark,
  Wallet: WalletIcon,
  Coins,
  CreditCard,
  TrendingUp,
  PiggyBank,
  HandCoins,
}

export function WalletsView({ wallets }: WalletsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null)

  const handleToggleArchive = (id: string) => {
    startTransition(async () => {
      try {
        await toggleArchiveWallet(id)
        router.refresh()
      } catch (err) {
        console.error("Failed to archive wallet:", err)
      }
    })
  }

  const handleDelete = async () => {
    if (!deletingWalletId) return

    startTransition(async () => {
      try {
        await deleteWallet(deletingWalletId)
        setDeletingWalletId(null)
        router.refresh()
      } catch (err) {
        console.error("Failed to delete wallet:", err)
      }
    })
  }

  const activeWallets = wallets.filter((w) => !w.isArchived)
  const archivedWallets = wallets.filter((w) => w.isArchived)

  const renderWalletCard = (w: Wallet) => {
    const Icon = iconMap[w.icon] || WalletIcon

    return (
      <Card
        key={w._id.toString()}
        className="border border-border/40 hover:border-primary/20 bg-card overflow-hidden shadow-sm flex flex-col group transition-all duration-300 hover:shadow-md"
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: w.color }} />

        <CardHeader className="flex flex-row items-start justify-between gap-4 p-5 pb-2">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border border-border/40 bg-muted/30 text-foreground"
              style={{ color: w.color }}
            >
              <Icon className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base font-extrabold text-foreground tracking-tight line-clamp-1">
                {w.name}
              </CardTitle>

              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                {w.type.replace("_", " ")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2 pb-4 flex-1">
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatCurrency(w.balance, w.currency)}
          </div>
        </CardContent>

        <CardFooter className="p-4 bg-muted/10 border-t border-border/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => router.push(`/wallets/${w._id.toString()}`)}
            >
              <Eye className="size-4" />
              <span className="sr-only">View</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setEditingWallet(w)}
            >
              <Edit className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => handleToggleArchive(w._id.toString())}
              disabled={isPending}
            >
              <Archive className="size-4" />
              <span className="sr-only">Archive</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setDeletingWalletId(w._id.toString())}
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
            <Landmark className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Wallets
            </h1>

            <p className="text-sm text-muted-foreground mt-0.5">
              Create and manage your bank accounts, credit cards, investments, and cash.
            </p>
          </div>
        </div>

        <div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 gap-1.5 h-10 px-4">
                <Plus className="size-4" /> Add Wallet
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md overflow-y-auto max-h-[90vh] scrollbar-hide bg-background border border-border/40 rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold tracking-tight">
                  Add Wallet
                </DialogTitle>
              </DialogHeader>

              <div className="py-2">
                <WalletForm onSuccess={() => setAddOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Wallets Grid */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Active Wallets</h2>

        {activeWallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl p-12 text-center bg-card/25">
            <WalletIcon className="size-10 text-muted-foreground mb-3 stroke-1" />

            <h3 className="text-sm font-bold text-foreground">No active wallets</h3>

            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Add a wallet to start tracking balances and transactions.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="mt-4 rounded-lg font-semibold"
            >
              Add Wallet
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeWallets.map(renderWalletCard)}
          </div>
        )}
      </div>

      {/* Archived Wallets Section */}
      {archivedWallets.length > 0 && (
        <div className="border-t border-border/20 pt-6">
          <h2 className="text-lg font-bold text-muted-foreground mb-4">
            Archived Wallets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-70">
            {archivedWallets.map((w) => {
              const Icon = iconMap[w.icon] || WalletIcon

              return (
                <Card
                  key={w._id.toString()}
                  className="border border-border/40 bg-card overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="h-1.5 w-full bg-muted" />

                  <CardHeader className="flex flex-row items-start justify-between gap-4 p-5 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl border border-border/40 bg-muted/30 text-muted-foreground">
                        <Icon className="size-5" />
                      </div>

                      <div>
                        <CardTitle className="text-base font-extrabold text-muted-foreground tracking-tight line-clamp-1">
                          {w.name}
                        </CardTitle>

                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mt-0.5">
                          Archived
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-2 pb-4 flex-1">
                    <div className="text-2xl font-black text-muted-foreground tracking-tight">
                      {formatCurrency(w.balance, w.currency)}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 bg-muted/10 border-t border-border/20 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-foreground hover:bg-muted"
                      onClick={() => handleToggleArchive(w._id.toString())}
                      disabled={isPending}
                    >
                      <Plus className="size-3.5 mr-1" /> Restore Wallet
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                      onClick={() => setDeletingWalletId(w._id.toString())}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingWallet}
        onOpenChange={(open) => !open && setEditingWallet(null)}
      >
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh] scrollbar-hide bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Edit Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {editingWallet && (
              <WalletForm
                initialWallet={editingWallet}
                onSuccess={() => setEditingWallet(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingWalletId}
        onOpenChange={(open) => !open && setDeletingWalletId(null)}
      >
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">
              Delete Wallet
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this wallet? All associated transactions will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : null}

              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
