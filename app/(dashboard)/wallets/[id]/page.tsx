import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getWalletById, getSingleWalletBalanceHistory } from "@/lib/queries/wallets"
import { getFilteredTransactions } from "@/lib/queries/transactions"
import { getCategories } from "@/lib/queries/categories"
import { WalletDetailChart } from "@/components/wallets/wallet-detail-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, CreditCard, Landmark, PiggyBank, Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownRight, ArrowLeftRight, HandCoins } from "lucide-react"
import Link from "next/link"
import { unstable_rethrow } from "next/navigation"

function ChartSkeleton() {
  return <Skeleton className="h-[380px] w-full rounded-xl" />
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WalletDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireApprovedUser()
  const userId = session.user.id

  let wallet
  let history
  let transactions
  let categories

  try {
    const [fetchedWallet, fetchedCategories] = await Promise.all([
      getWalletById(userId, id),
      getCategories(userId)
    ])

    if (!fetchedWallet) {
      notFound()
    }
    wallet = fetchedWallet
    categories = fetchedCategories

    // Fetch transactions and history in parallel
    const [fetchedTransactions, fetchedHistory] = await Promise.all([
      getFilteredTransactions(userId, { walletIds: [id] }, { limit: 10 }),
      getSingleWalletBalanceHistory(userId, id, 6)
    ])
    transactions = fetchedTransactions
    history = fetchedHistory
  } catch (error: any) {
    unstable_rethrow(error)
    notFound()
  }

  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))

  const walletIconMap: Record<string, any> = {
    bank: Landmark,
    cash: WalletIcon,
    credit_card: CreditCard,
    savings: PiggyBank,
    investment: TrendingUp,
    lent: HandCoins,
  }
  const IconComponent = walletIconMap[wallet.type] || WalletIcon

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header / Back Link */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl border-border/40 bg-card shadow-sm hover:bg-muted/50">
            <Link href="/wallets">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{wallet.name}</h1>
              <Badge
                variant="outline"
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border-border/40 shadow-sm"
                style={{
                  backgroundColor: wallet.color + "15",
                  color: wallet.color,
                  borderColor: wallet.color + "30",
                }}
              >
                {wallet.type.replace("_", " ")}
              </Badge>
              {wallet.isArchived && (
                <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Archived
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed performance, stats, and transaction history for this wallet.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Current Balance</p>
          <p className="text-3xl font-black text-foreground mt-0.5">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border/40 shadow-xl bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Type</CardTitle>
            <IconComponent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{wallet.type.replace("_", " ")}</div>
            <p className="text-xs text-muted-foreground mt-1">Primary operational account type</p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-xl bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currency</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet.currency}</div>
            <p className="text-xs text-muted-foreground mt-1">Default currency for transfers & tracking</p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-xl bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length} txs</div>
            <p className="text-xs text-muted-foreground mt-1">Recorded transactions in this wallet</p>
          </CardContent>
        </Card>
      </div>

      {/* History Chart */}
      <Suspense fallback={<ChartSkeleton />}>
        <WalletDetailChart initialData={history} currency={wallet.currency} />
      </Suspense>

      {/* Transactions list */}
      <Card className="border border-border/40 shadow-xl bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Recent Wallet Transactions</CardTitle>
            <CardDescription className="text-xs">Latest 10 transactions executed through this wallet</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-border/40 hover:bg-muted/50">
            <Link href={`/transactions?wallets=${id}`}>
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const category = categoryMap.get(tx.categoryId);
                    const isIncome = tx.type === "income";
                    const isExpense = tx.type === "expense";
                    const isTransfer = tx.type === "transfer";

                    return (
                      <tr key={tx._id.toString()} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="py-4 px-4 font-medium text-foreground max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="py-4 px-4">
                          {category ? (
                            <Badge
                              variant="outline"
                              className="rounded-full px-2 py-0.5 text-xs font-medium border-border/40"
                              style={{
                                backgroundColor: (category.color || "#A0A0A0") + "15",
                                color: category.color || "#A0A0A0",
                                borderColor: (category.color || "#A0A0A0") + "30",
                              }}
                            >
                              {category.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-medium border-border/40 text-muted-foreground">
                              Uncategorized
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold">
                          <span
                            className={
                              isIncome
                                ? "text-emerald-500"
                                : isExpense
                                ? "text-rose-500"
                                : "text-amber-500"
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              {isIncome && <ArrowDownRight className="size-3" />}
                              {isExpense && <ArrowUpRight className="size-3" />}
                              {isTransfer && <ArrowLeftRight className="size-3" />}
                              {isIncome ? "+" : isExpense ? "-" : ""}
                              {formatCurrency(tx.amount, tx.currency)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No transactions recorded in this wallet yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
