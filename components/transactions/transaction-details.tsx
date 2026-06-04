"use client"

import { Transaction, Category, Wallet } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Calendar, Wallet as WalletIcon, Folder, Tag, AlignLeft, RefreshCw, Clock } from "lucide-react"
import { CategoryIcon } from "../categories/category-icon"

interface TransactionDetailsProps {
  transaction: Transaction
  category: Category | null
  wallet: Wallet | null
  linkedWallet?: Wallet | null
}

export function TransactionDetails({
  transaction,
  category,
  wallet,
  linkedWallet,
}: TransactionDetailsProps) {
  let typeColor = "text-foreground bg-muted"
  let iconBg = "bg-muted text-muted-foreground"
  let prefix = ""
  let Icon = ArrowLeftRight
  let typeLabel = "Transfer"

  if (transaction.type === "income") {
    typeColor = "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
    iconBg = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
    prefix = "+"
    Icon = ArrowUpRight
    typeLabel = "Income"
  } else if (transaction.type === "expense") {
    typeColor = "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30"
    iconBg = "bg-rose-100 text-rose-600 dark:bg-rose-900/40"
    prefix = "-"
    Icon = ArrowDownRight
    typeLabel = "Expense"
  } else if (transaction.type === "transfer") {
    typeColor = "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30"
    iconBg = "bg-blue-100 text-blue-600 dark:bg-blue-900/40"
    prefix = transaction.transferType === "credit" ? "+" : "-"
    Icon = ArrowLeftRight
    typeLabel = transaction.transferType === "credit" ? "Transfer (Deposit)" : "Transfer (Withdrawal)"
  }

  return (
    <div className="w-full flex flex-col gap-6 text-sm">
      <div className="flex flex-col items-center text-center pb-6 border-b border-border/20">
        <div className={`p-4 rounded-full ${iconBg} mb-3`}>
          <Icon className="size-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground truncate max-w-full">
          {transaction.description}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={`text-xs font-bold rounded-full ${typeColor}`} variant="outline">
            {typeLabel}
          </Badge>
          {transaction.isRecurring && (
            <Badge className="text-xs font-bold rounded-full text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30 border-purple-200" variant="outline">
              <RefreshCw className="size-3 mr-1 animate-spin-slow" /> Recurring
            </Badge>
          )}
        </div>
        <div className={`text-3xl font-black mt-4 tracking-tight ${
          transaction.type === "income" ? "text-emerald-500" :
          transaction.type === "expense" ? "text-rose-500" : "text-blue-500"
        }`}>
          {prefix} {formatCurrency(transaction.amount, transaction.currency)}
        </div>
      </div>
      
      <div className="grid gap-6 pt-6">
        {/* Core details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wallet */}
          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
            <WalletIcon className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-muted-foreground">Wallet</span>
              {wallet ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: wallet.color }} />
                  <span className="font-bold text-foreground text-xs sm:text-sm">{wallet.name}</span>
                </div>
              ) : (
                <span className="font-bold text-foreground text-xs sm:text-sm mt-1.5">Unknown Wallet</span>
              )}
            </div>
          </div>

          {/* Transfer Linked Wallet */}
          {transaction.type === "transfer" && linkedWallet && (
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
              <WalletIcon className="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-muted-foreground">
                  {transaction.transferType === "debit" ? "Destination Wallet" : "Source Wallet"}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: linkedWallet.color }} />
                  <span className="font-bold text-foreground text-xs sm:text-sm">{linkedWallet.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
            <CategoryIcon name={category?.icon ?? ""} className="size-5 text-muted-foreground mt-0.5 shrink-0" fallback={Folder} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-muted-foreground">Category</span>
              {category ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="font-bold text-foreground text-xs sm:text-sm">{category.name}</span>
                </div>
              ) : (
                <span className="font-bold text-foreground text-xs sm:text-sm mt-1.5">Uncategorized</span>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
            <Calendar className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground">Transaction Date</span>
              <span className="font-bold text-foreground text-xs sm:text-sm mt-1.5">
                {formatDate(transaction.date)}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
            <Clock className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground">Logged On</span>
              <span className="font-medium text-muted-foreground text-xs sm:text-sm mt-1.5">
                {formatDate(transaction.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="flex flex-col gap-1.5 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <AlignLeft className="size-4 text-muted-foreground shrink-0" /> Notes
            </div>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap mt-2 pl-6">
              {transaction.notes}
            </p>
          </div>
        )}

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex flex-col gap-2 p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Tag className="size-4 text-muted-foreground shrink-0" /> Tags
            </div>
            <div className="flex flex-wrap gap-1.5 pl-6 mt-2">
              {transaction.tags.map((t) => (
                <Badge key={t} variant="secondary" className="px-2.5 py-0.5 text-[10px] font-semibold">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
