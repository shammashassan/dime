"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TransactionForm } from "./transaction-form"
import { Category, Wallet } from "@/types"

interface AddTransactionDialogProps {
  categories: Category[]
  wallets: Wallet[]
  defaultWalletId?: string
}

export function AddTransactionDialog({ categories, wallets, defaultWalletId }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleQuickAdd = () => setOpen(true)
    window.addEventListener("dime:quick-add-transaction", handleQuickAdd)
    return () => window.removeEventListener("dime:quick-add-transaction", handleQuickAdd)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 gap-1.5 h-10 px-4">
          <Plus className="size-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] min-w-0">
        <DialogHeader className="pb-1">
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm
          categories={categories}
          wallets={wallets}
          defaultWalletId={defaultWalletId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
