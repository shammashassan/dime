"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { getQuickTransactionMeta } from "@/lib/actions/transactions"
import { Loader2, Plus } from "lucide-react"
import type { Category, Wallet } from "@/types"

export function GlobalTransactionDialog() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [wallets, setWallets] = React.useState<Wallet[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [defaultWalletId, setDefaultWalletId] = React.useState<string | undefined>(undefined)
  const router = useRouter()

  const fetchMeta = React.useCallback(async () => {
    setLoading(true)
    try {
      const meta = await getQuickTransactionMeta()
      setWallets(meta.wallets)
      setCategories(meta.categories)
      setDefaultWalletId(meta.defaultWalletId)
    } catch (err) {
      console.error("Failed to load quick transaction metadata:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for global event triggered by 'c' shortcut or button click
  React.useEffect(() => {
    const handleOpen = () => {
      // If user is already on /transactions, the in-page AddTransactionDialog handles it
      if (typeof window !== "undefined" && window.location.pathname === "/transactions") return

      setOpen(true)
      fetchMeta()
    }

    window.addEventListener("dime:quick-add-transaction", handleOpen)
    return () => window.removeEventListener("dime:quick-add-transaction", handleOpen)
  }, [fetchMeta])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] min-w-0 rounded-2xl">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Plus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Quick Add Transaction</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Record an expense, income, or transfer from anywhere in Dime.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs">Loading accounts & categories...</span>
          </div>
        ) : wallets.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No active wallets found. Please create a wallet first.
          </div>
        ) : (
          <div className="py-1">
            <TransactionForm
              categories={categories}
              wallets={wallets}
              defaultWalletId={defaultWalletId}
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
