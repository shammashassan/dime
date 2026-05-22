import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getRecentTransactions } from "@/lib/queries/transactions"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface RecentTransactionsProps {
  userId: string
}

export async function RecentTransactions({ userId }: RecentTransactionsProps) {
  const [transactions, categories, wallets] = await Promise.all([
    getRecentTransactions(userId, 5),
    getCategories(userId),
    getWallets(userId),
  ])

  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
  const walletMap = new Map(wallets.map((w) => [w._id.toString(), w]))

  return (
    <Card className="relative overflow-hidden bg-card border border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
          <CardDescription className="text-xs">Your last few financial activities</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs font-semibold gap-1">
          <Link href="/transactions">
            View All <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <ArrowLeftRight className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Start tracking your expenses and income by adding your first transaction.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/transactions?new=true">Add Transaction</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Description</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Category</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Wallet</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const category = categoryMap.get(tx.categoryId)
                  const wallet = walletMap.get(tx.walletId)

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
                    <TableRow key={tx._id.toString()} className="border-border/40 hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0`}>
                            <Icon className="size-3.5" />
                          </div>
                          <span className="truncate">{tx.description}</span>
                        </div>
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
