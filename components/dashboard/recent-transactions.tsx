import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getRecentTransactions } from "@/lib/queries/transactions"
import { getCategories } from "@/lib/queries/categories"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface RecentTransactionsProps {
  userId: string
  className?: string
}

export async function RecentTransactions({ userId, className }: RecentTransactionsProps) {
  const [transactions, categories, wallets] = await Promise.all([
    getRecentTransactions(userId, 6),
    getCategories(userId),
    getAllWalletsIncludingArchived(userId),
  ])

  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
  const walletMap = new Map(wallets.map((w) => [w._id.toString(), w]))

  return (
    <Card className={cn("flex flex-col border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0", className)}>
      {/* Top compact micro-label header matching top dashboard cards */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            recent transactions
          </span>
          {transactions.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground">
              {transactions.length}
            </span>
          )}
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>View all</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-2 shadow-xs">
            <ArrowLeftRight className="size-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">No transactions recorded yet</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5">
            Start tracking your expenses and income to see your recent financial stream here.
          </p>
          <Link
            href="/transactions?new=true"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>Add transaction</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-9 text-[11px] uppercase tracking-wider font-bold text-muted-foreground pl-5">
                  Transaction
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Wallet
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wider font-bold text-muted-foreground text-right">
                  Amount
                </TableHead>
                <TableHead className="h-9 w-[44px] pr-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const category = categoryMap.get(tx.categoryId || "")
                const wallet = walletMap.get(tx.walletId)

                let amountColor = "text-foreground"
                let prefix = ""
                let iconStyles = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                let Icon = ArrowLeftRight
                const itemHref = tx.isInvestment
                  ? "/investments"
                  : `/transactions/${tx._id.toString()}`

                if (tx.isInvestment) {
                  Icon = TrendingUp
                  if (tx.type === "income") {
                    amountColor = "text-emerald-600 dark:text-emerald-400"
                    prefix = "+"
                    iconStyles = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  } else {
                    amountColor = "text-foreground"
                    prefix = "-"
                    iconStyles = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                  }
                } else if (tx.type === "income") {
                  amountColor = "text-emerald-600 dark:text-emerald-400"
                  prefix = "+"
                  Icon = ArrowUpRight
                  iconStyles = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                } else if (tx.type === "expense") {
                  amountColor = "text-rose-600 dark:text-rose-400"
                  prefix = "-"
                  Icon = ArrowDownRight
                  iconStyles = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                } else if (tx.type === "transfer") {
                  amountColor = "text-blue-600 dark:text-blue-400"
                  prefix = tx.transferType === "credit" ? "+" : "-"
                  Icon = ArrowLeftRight
                  iconStyles = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                }

                return (
                  <TableRow
                    key={tx._id.toString()}
                    className="group hover:bg-muted/40 transition-colors border-border/40"
                  >
                    <TableCell className="font-medium py-2.5 pl-5">
                      <Link
                        href={itemHref}
                        className="flex items-center gap-3 group/link text-left"
                      >
                        <div
                          className={cn(
                            "size-8 rounded-lg flex items-center justify-center shrink-0 border shadow-xs transition-transform group-hover/link:scale-105",
                            iconStyles
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[220px] md:max-w-[260px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-foreground truncate group-hover/link:text-primary transition-colors">
                              {tx.description}
                            </span>
                            {tx.isInvestment && (
                              <Badge
                                variant="outline"
                                className="rounded-full text-[8px] uppercase tracking-wider font-extrabold px-1 py-0 h-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shrink-0"
                              >
                                Investment
                              </Badge>
                            )}
                            {tx.isRecurring && (
                              <Badge
                                variant="outline"
                                className="rounded-full text-[8px] uppercase tracking-wider font-extrabold px-1 py-0 h-3.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shrink-0"
                              >
                                Recurring
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                            {tx.notes ? (
                              <span className="truncate">{tx.notes}</span>
                            ) : (
                              <span className="capitalize">{tx.type}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="py-2.5">
                      {tx.splits && tx.splits.length > 0 ? (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[9px] font-bold px-1.5 py-0 h-4 bg-muted/40 border-border/60 text-muted-foreground"
                        >
                          Split ({tx.splits.length})
                        </Badge>
                      ) : category ? (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[9px] font-semibold px-2 py-0 h-4 bg-muted/30 border-border/50 inline-flex items-center gap-1 max-w-[130px] truncate"
                        >
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: category.color || "#888888" }}
                          />
                          <span className="truncate">{category.name}</span>
                        </Badge>
                      ) : tx.isInvestment ? (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[9px] font-semibold px-2 py-0 h-4 bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 max-w-[130px] truncate"
                        >
                          <TrendingUp className="size-2.5 shrink-0" />
                          <span className="truncate">Investment</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      {wallet ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[9px] font-semibold px-2 py-0 h-4 bg-secondary/50 text-secondary-foreground border border-border/40 inline-flex items-center gap-1 max-w-[120px] truncate"
                        >
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: wallet.color || "#888888" }}
                          />
                          <span className="truncate">{wallet.name}</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap tabular-nums">
                      {formatDate(tx.date)}
                    </TableCell>

                    <TableCell className="py-2.5 text-right tabular-nums whitespace-nowrap">
                      <div
                        className={cn(
                          "inline-flex items-center justify-end gap-0.5 font-bold text-xs",
                          amountColor
                        )}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight className="size-3" />
                        ) : tx.type === "expense" ? (
                          <ArrowDownRight className="size-3" />
                        ) : (
                          <ArrowLeftRight className="size-3" />
                        )}
                        <span>
                          {prefix}
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 text-right pr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="size-6 rounded-md text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 group-hover:bg-muted transition-all"
                      >
                        <Link
                          href={itemHref}
                          aria-label={`View ${tx.isInvestment ? "investment" : "transaction"} ${tx.description}`}
                        >
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
