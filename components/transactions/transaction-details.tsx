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
  categories?: Category[]
}

export function TransactionDetails({
  transaction,
  category,
  wallet,
  linkedWallet,
  categories = [],
}: TransactionDetailsProps) {
  const categoriesAllMap = new Map(categories.map((c) => [c._id.toString(), c]))
  let typeColor = "text-foreground bg-muted"
  let iconBg = "bg-muted text-muted-foreground"
  let amountColor = "text-blue-500"
  let prefix = ""
  let Icon = ArrowLeftRight
  let typeLabel = "Transfer"

  if (transaction.type === "income") {
    typeColor = "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
    iconBg = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
    amountColor = "text-emerald-500"
    prefix = "+"
    Icon = ArrowUpRight
    typeLabel = "Income"
  } else if (transaction.type === "expense") {
    typeColor = "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30"
    iconBg = "bg-rose-100 text-rose-600 dark:bg-rose-900/40"
    amountColor = "text-rose-500"
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

  // Small inline row used for the core-details grid — much tighter than the old card layout
  function InfoRow({
    icon: RowIcon,
    label,
    children,
  }: {
    icon: React.ElementType
    label: string
    children: React.ReactNode
  }) {
    return (
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/40 transition-colors">
        <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
          <RowIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            {label}
          </span>
          <div className="text-sm font-bold text-foreground truncate mt-0.5">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-4 text-sm">
      {/* Hero — horizontal so the icon can stay full-size and space is used, not centered into empty margins */}
      <div className="flex items-center gap-4 pb-4 border-b border-border/20">
        <div className={`p-4 rounded-2xl ${iconBg} shrink-0`}>
          <Icon className="size-8" />
        </div>
        <div className="flex flex-col min-w-0 flex-1 gap-1.5">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground truncate">
            {transaction.description}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={`text-[10px] font-bold rounded-full ${typeColor}`} variant="outline">
              {typeLabel}
            </Badge>
            {transaction.isRecurring && (
              <Badge className="text-[10px] font-bold rounded-full text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30" variant="outline">
                <RefreshCw className="size-3 mr-1 animate-spin-slow" /> Recurring
              </Badge>
            )}
            {transaction.isFlagged && (
              <Badge className="text-[10px] font-bold rounded-full text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30" variant="outline">
                Flagged
              </Badge>
            )}
            {transaction.needsReview && (
              <Badge className="text-[10px] font-bold rounded-full text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" variant="outline">
                Needs Review
              </Badge>
            )}
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight shrink-0 ${amountColor}`}>
          {prefix} {formatCurrency(transaction.amount, transaction.currency)}
        </div>
      </div>

      {/* Core details — single tight card instead of a grid of separate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1.5 rounded-2xl border border-border/40 bg-card/40">
        <InfoRow icon={WalletIcon} label="Wallet">
          {wallet ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: wallet.color }} />
              {wallet.name}
            </span>
          ) : (
            "Unknown Wallet"
          )}
        </InfoRow>

        {transaction.type === "transfer" && linkedWallet && (
          <InfoRow
            icon={WalletIcon}
            label={transaction.transferType === "debit" ? "Destination Wallet" : "Source Wallet"}
          >
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: linkedWallet.color }} />
              {linkedWallet.name}
            </span>
          </InfoRow>
        )}

        <InfoRow
          icon={(props) => (
            <CategoryIcon
              {...props}
              name={transaction.splits && transaction.splits.length > 0 ? "Folder" : (category?.icon ?? "")}
              fallback={Folder}
            />
          )}
          label="Category"
        >
          {transaction.splits && transaction.splits.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full shrink-0 bg-purple-500" />
              Multiple (Split)
            </span>
          ) : category ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          ) : (
            "Uncategorized"
          )}
        </InfoRow>

        <InfoRow icon={Calendar} label="Transaction Date">
          {formatDate(transaction.date)}
        </InfoRow>

        <InfoRow icon={Clock} label="Logged On">
          <span className="font-medium text-muted-foreground">{formatDate(transaction.createdAt)}</span>
        </InfoRow>
      </div>

      {/* Splits Breakdown */}
      {transaction.splits && transaction.splits.length > 0 && (
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl border border-border/40 bg-card/40">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Folder className="size-3.5 shrink-0" /> Splits Breakdown
          </div>
          <div className="divide-y divide-border/20 flex flex-col">
            {transaction.splits.map((split, i) => {
              const splitCat = categoriesAllMap.get(split.categoryId)
              return (
                <div key={split.id || i} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-col text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: splitCat?.color || "gray" }} />
                      <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                        {splitCat?.name || "Uncategorized"}
                      </span>
                      {((split.percentage !== undefined && split.percentage !== null && !isNaN(split.percentage)) || (transaction.amount > 0)) && (
                        <span className="text-[10px] text-muted-foreground font-bold px-1.5 py-0.5 rounded bg-muted/40 shrink-0">
                          {split.percentage !== undefined && split.percentage !== null && !isNaN(split.percentage)
                            ? split.percentage
                            : Math.round((split.amount / transaction.amount) * 100)}%
                        </span>
                      )}
                    </div>
                    {split.notes && (
                      <span className="text-xs text-muted-foreground italic mt-0.5 pl-3.5 truncate">
                        "{split.notes}"
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-foreground text-xs sm:text-sm whitespace-nowrap ml-2">
                    {formatCurrency(split.amount, transaction.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes + Tags combined row when both are short, otherwise stacked naturally */}
      {transaction.notes && (
        <div className="flex flex-col gap-1 p-3.5 rounded-2xl border border-border/40 bg-card/40">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <AlignLeft className="size-3.5 shrink-0" /> Notes
          </div>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {transaction.notes}
          </p>
        </div>
      )}

      {transaction.tags && transaction.tags.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border/40 bg-card/40">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Tag className="size-3.5 shrink-0" /> Tags
          </div>
          <div className="flex flex-wrap gap-1.5">
            {transaction.tags.map((t) => (
              <Badge key={t} variant="secondary" className="px-2.5 py-0.5 text-[10px] font-semibold">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}