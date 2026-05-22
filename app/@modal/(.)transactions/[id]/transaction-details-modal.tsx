"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionDetails } from "@/components/transactions/transaction-details"
import { Transaction, Category, Wallet } from "@/types"

interface TransactionDetailsModalProps {
  transaction: Transaction
  category: Category | null
  wallet: Wallet | null
  linkedWallet: Wallet | null
}

export function TransactionDetailsModal({
  transaction,
  category,
  wallet,
  linkedWallet,
}: TransactionDetailsModalProps) {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        router.back()
      }
    }}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-extrabold tracking-tight">Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-2">
          <TransactionDetails
            transaction={transaction}
            category={category}
            wallet={wallet}
            linkedWallet={linkedWallet}
          />
        </div>
      </DialogContent>

    </Dialog>
  )
}
