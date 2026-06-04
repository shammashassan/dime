"use client"

import { useState } from "react"
import { TransactionTable } from "./transaction-table"
import { TransactionFilters } from "./transaction-filters"
import { AddTransactionDialog } from "./add-transaction-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionForm } from "./transaction-form"
import { Category, Wallet, Transaction } from "@/types"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeftRight, FileSpreadsheet } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CSVImportModal } from "./csv-import-modal"

interface TransactionsViewProps {
  transactions: Transaction[]
  categories: Category[]
  wallets: Wallet[]
  totalCount: number
  currentPage: number
  pageSize: number
  sortBy?: "date" | "amount" | "description"
  sortOrder?: "asc" | "desc"
}

export function TransactionsView({
  transactions,
  categories,
  wallets,
  totalCount,
  currentPage,
  pageSize,
  sortBy = "date",
  sortOrder = "desc",
}: TransactionsViewProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  // CSV Export
  const handleExportCSV = () => {
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
    const walletMap = new Map(wallets.map((w) => [w._id.toString(), w]))

    const headers = [
      "Date",
      "Description",
      "Type",
      "Category",
      "Wallet",
      "Amount",
      "Currency",
      "Tags",
      "Notes",
    ]
    const rows = transactions.map((tx) => [
      formatDate(tx.date),
      tx.description,
      tx.type,
      categoryMap.get(tx.categoryId)?.name || "Uncategorized",
      walletMap.get(tx.walletId)?.name || "Unknown",
      tx.amount / 100,
      tx.currency,
      tx.tags.join("; "),
      tx.notes || "",
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((field) => `"${field}"`).join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `dime_transactions_${new Date().toISOString().split("T")[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
            <ArrowLeftRight className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track and manage your income, expenses, and wallet transfers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial h-10 border-border/40 text-xs font-semibold gap-1.5 rounded-xl shadow-sm hover:bg-muted/50"
            disabled={transactions.length === 0}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          {wallets.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="flex-1 sm:flex-initial h-10 border-border/40 text-xs font-semibold gap-1.5 rounded-xl shadow-sm hover:bg-muted/50 cursor-pointer"
            >
              <FileSpreadsheet className="size-4 text-emerald-500" />
              Import CSV
            </Button>
          )}
          {wallets.length > 0 ? (
            <div className="flex-1 sm:flex-initial">
              <AddTransactionDialog categories={categories} wallets={wallets} />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">Create a wallet first to add transactions.</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters categories={categories} wallets={wallets} />

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        categories={categories}
        wallets={wallets}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onEditClick={(tx) => setEditingTransaction(tx)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {editingTransaction && (
              <TransactionForm
                categories={categories}
                wallets={wallets}
                transactions={transactions}
                initialTransaction={editingTransaction}
                onSuccess={() => setEditingTransaction(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      {wallets.length > 0 && (
        <CSVImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          wallets={wallets}
          categories={categories}
        />
      )}
    </div>
  )
}
