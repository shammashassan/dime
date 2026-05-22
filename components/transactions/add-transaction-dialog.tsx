"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TransactionForm } from "./transaction-form"
import { Category, Wallet } from "@/types"

interface AddTransactionDialogProps {
  categories: Category[]
  wallets: Wallet[]
}

export function AddTransactionDialog({ categories, wallets }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 gap-1.5 h-10 px-4">
          <Plus className="size-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <TransactionForm
            categories={categories}
            wallets={wallets}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
