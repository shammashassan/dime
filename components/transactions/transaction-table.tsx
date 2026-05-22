"use client"

import { useState, useTransition, useOptimistic } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Transaction, Category, Wallet } from "@/types"
import { deleteTransaction } from "@/lib/actions/transactions"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationFirst,
  PaginationPrevious,
  PaginationNext,
  PaginationLast,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface TransactionTableProps {
  transactions: Transaction[]
  categories: Category[]
  wallets: Wallet[]
  totalCount: number
  currentPage: number
  pageSize: number
  sortBy?: "date" | "amount" | "description"
  sortOrder?: "asc" | "desc"
  onEditClick: (transaction: Transaction) => void
}

export function TransactionTable({
  transactions,
  categories,
  wallets,
  totalCount,
  currentPage,
  pageSize,
  sortBy = "date",
  sortOrder = "desc",
  onEditClick,
}: TransactionTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
  const walletMap = new Map(wallets.map((w) => [w._id.toString(), w]))

  // Optimistic updates for deletion
  const [optimisticTransactions, removeOptimisticTx] = useOptimistic(
    transactions,
    (state, idToDelete: string) => state.filter((tx) => tx._id.toString() !== idToDelete)
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === optimisticTransactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(optimisticTransactions.map((tx) => tx._id.toString()))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    if (!deletingTxId) return
    const id = deletingTxId
    startTransition(async () => {
      try {
        removeOptimisticTx(id)
        await deleteTransaction(id)
        setSelectedIds((prev) => prev.filter((item) => item !== id))
        setDeletingTxId(null)
        toast.success("Transaction deleted successfully")
        router.refresh()
      } catch (err) {
        console.error("Failed to delete transaction:", err)
        toast.error("Failed to delete transaction")
      }
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => deleteTransaction(id)))
        setSelectedIds([])
        setShowBulkDeleteDialog(false)
        toast.success("Selected transactions deleted successfully")
        router.refresh()
      } catch (err) {
        console.error("Failed bulk deletion:", err)
        toast.error("Failed to delete selected transactions")
      }
    })
  }

  // Pagination navigation
  const totalPages = Math.ceil(totalCount / pageSize)
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageSizeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageSize", value)
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  // Sort navigation
  const handleSort = (col: "date" | "amount" | "description") => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortBy === col) {
      params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc")
    } else {
      params.set("sortBy", col)
      params.set("sortOrder", "desc")
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const SortIcon = ({ col }: { col: "date" | "amount" | "description" }) => {
    if (sortBy !== col) return <ArrowUpDown className="size-3 ml-1 opacity-40" />
    if (sortOrder === "asc") return <ArrowUp className="size-3 ml-1 text-primary" />
    return <ArrowDown className="size-3 ml-1 text-primary" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-border/40 animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isPending}
              className="gap-1 font-semibold text-xs h-8"
            >
              <Trash2 className="size-3.5" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={
                      optimisticTransactions.length > 0 &&
                      selectedIds.length === optimisticTransactions.length
                    }
                    onCheckedChange={toggleSelectAll}
                    disabled={optimisticTransactions.length === 0}
                  />
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">
                  <button
                    onClick={() => handleSort("description")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Description
                    <SortIcon col="description" />
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Category</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Wallet</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">
                  <button
                    onClick={() => handleSort("date")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Date
                    <SortIcon col="date" />
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">
                  <button
                    onClick={() => handleSort("amount")}
                    className="flex items-center ml-auto hover:text-foreground transition-colors"
                  >
                    Amount
                    <SortIcon col="amount" />
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    No transactions found. Add a transaction or adjust your filters.
                  </TableCell>
                </TableRow>
              ) : (
                optimisticTransactions.map((tx) => {
                  const category = categoryMap.get(tx.categoryId)
                  const wallet = walletMap.get(tx.walletId)
                  const isSelected = selectedIds.includes(tx._id.toString())

                  let amountColor = "text-foreground"
                  let prefix = ""
                  let Icon = ArrowLeftRight

                  if (tx.type === "income") {
                    amountColor = "text-emerald-500 font-semibold"
                    prefix = "+"
                    Icon = ArrowUpRight
                  } else if (tx.type === "expense") {
                    amountColor = "text-rose-500 font-semibold"
                    prefix = "-"
                    Icon = ArrowDownRight
                  } else if (tx.type === "transfer") {
                    amountColor = "text-blue-500 font-semibold"
                    prefix = tx.transferType === "credit" ? "+" : "-"
                    Icon = ArrowLeftRight
                  }

                  return (
                    <TableRow
                      key={tx._id.toString()}
                      className={`border-border/40 transition-colors ${
                        isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                      }`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(tx._id.toString())}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <Link
                          href={`/transactions/${tx._id.toString()}`}
                          className="flex items-center gap-2 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-accent group-hover:text-primary transition-colors">
                            <Icon className="size-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate group-hover:underline text-foreground text-xs font-semibold">
                              {tx.description}
                            </span>
                            {tx.notes && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-xs">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: category.color || "gray" }}
                            />
                            <span className="text-xs">{category.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {wallet ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-2.5 rounded-full border border-border/40 shrink-0"
                              style={{ backgroundColor: wallet.color || "gray" }}
                            />
                            <span className="text-xs font-medium">{wallet.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className={`text-right text-sm whitespace-nowrap ${amountColor}`}>
                        {prefix} {formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 p-0" disabled={isPending}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-popover border border-border/40 shadow-md">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="gap-2 text-xs">
                              <Link href={`/transactions/${tx._id.toString()}`}>
                                <Eye className="size-3.5" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditClick(tx)} className="gap-2 text-xs">
                              <Edit className="size-3.5" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="border-border/40" />
                            <DropdownMenuItem
                              onClick={() => setDeletingTxId(tx._id.toString())}
                              className="gap-2 text-xs text-rose-600 dark:text-rose-400 focus:bg-destructive/15 focus:text-destructive"
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8 py-2">
        <div className="flex-1 whitespace-nowrap text-muted-foreground text-sm">
          {selectedIds.length} of {totalCount} row(s) selected.
        </div>
        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <p className="whitespace-nowrap font-medium text-sm">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-18 data-size:h-8 border-border/40">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="border-border/40 bg-popover">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center font-medium text-sm">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent className="gap-1">
              {/* First Page */}
              <PaginationItem>
                <PaginationFirst
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1 && !isPending) handlePageChange(1)
                  }}
                  className={cn(
                    (currentPage <= 1 || isPending) && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {/* Previous Page */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1 && !isPending) handlePageChange(currentPage - 1)
                  }}
                  className={cn(
                    (currentPage <= 1 || isPending) && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {/* Next Page */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages && !isPending) handlePageChange(currentPage + 1)
                  }}
                  className={cn(
                    (currentPage >= totalPages || isPending) && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {/* Last Page */}
              <PaginationItem>
                <PaginationLast
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages && !isPending) handlePageChange(totalPages)
                  }}
                  className={cn(
                    (currentPage >= totalPages || isPending) && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Single Delete Alert */}
      <AlertDialog open={!!deletingTxId} onOpenChange={(open) => !open && setDeletingTxId(null)}>
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this transaction? This will permanently adjust the associated wallet's balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Alert */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Delete {selectedIds.length} Transactions
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete the {selectedIds.length} selected transactions? This will permanently revert all their balance modifications in their respective wallets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBulkDelete}>
              {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
