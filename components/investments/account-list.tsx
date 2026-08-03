"use client"

import { AccountViewModel } from "@/lib/calculations/investments"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Landmark, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronRight, Layers, Coins, Eye } from "lucide-react"

function CardChip() {
  return (
    <div className="size-5 rounded-sm border border-amber-400/30 bg-amber-400/10 relative overflow-hidden flex items-center justify-center shrink-0">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-amber-400/25" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-amber-400/25" />
      <div className="size-2.5 rounded-[2px] border border-amber-400/30 bg-amber-400/10 z-10" />
    </div>
  )
}

export function AccountList({ accounts, currency }: { accounts: AccountViewModel[], currency: string }) {
  const router = useRouter()

  if (accounts.length === 0) {
    return null
  }

  const grandTotalValue = accounts.reduce((sum, a) => sum + Math.max(0, a.totalValue), 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {accounts.map(account => {
        const isPositive = account.unrealizedGain >= 0
        const returnPercentage = account.totalCostBasis > 0 ? (account.unrealizedGain / account.totalCostBasis) * 100 : 0
        const walletColor = account.color || "#8b5cf6"
        const sharePct = grandTotalValue > 0 ? Math.min(100, Math.max(0, (account.totalValue / grandTotalValue) * 100)) : 0

        return (
          <Card
            key={account.accountId}
            className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full justify-between"
            onClick={() => router.push(`/investments/${account.accountId}`)}
          >
            {/* Top Accent Line (Matches AssetCard) */}
            <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: walletColor }} />

            {/* Header (Matches AssetCard exactly) */}
            <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: walletColor + "18", color: walletColor }}
                >
                  <Landmark className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                    {account.accountName}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
                      style={{
                        backgroundColor: `${walletColor}15`,
                        color: walletColor,
                        borderColor: `${walletColor}30`,
                      }}
                    >
                      BROKERAGE
                    </Badge>
                    <Badge variant="outline" className="rounded-md font-semibold text-[10px] h-4 px-1.5 text-muted-foreground">
                      {account.holdings.length} {account.holdings.length === 1 ? 'holding' : 'holdings'}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardChip />
            </CardHeader>

            {/* Body — Two-Stat Metric Row (Current Value / Unrealized P&L) + Progress Bar (Matches AssetCard) */}
            <CardContent className="px-4 pb-3 flex flex-col gap-3">
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                    Current Value
                  </p>
                  <p className="text-[1.5rem] font-black tabular-nums text-foreground leading-none select-all">
                    {formatCurrency(account.totalValue, account.currency || currency)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                    Unrealized P&L
                  </p>
                  <p className={cn("text-[1.1rem] font-black tabular-nums leading-none flex items-center justify-end gap-0.5", isPositive ? "text-emerald-500" : "text-rose-500")}>
                    {isPositive ? <ArrowUpRight className="size-3.5 shrink-0" /> : <ArrowDownRight className="size-3.5 shrink-0" />}
                    <span>{isPositive ? '+' : ''}{formatCurrency(account.unrealizedGain, currency)}</span>
                  </p>
                  <span className={cn("text-[10px] font-bold block mt-0.5", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    ({isPositive ? '+' : ''}{returnPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div>
                <Progress
                  value={sharePct}
                  indicatorStyle={{ backgroundColor: walletColor }}
                  className="h-2 bg-muted/60"
                />
                <div className="flex justify-between text-[9px] font-medium text-muted-foreground mt-1">
                  <span>Portfolio Share</span>
                  <span>{sharePct.toFixed(1)}% of portfolio</span>
                </div>
              </div>
            </CardContent>

            {/* Footer — currency chip + quick action Details button (Matches AssetCard exactly) */}
            <Separator className="bg-border/30" />
            <CardFooter className="px-3 py-2 flex items-center justify-between bg-muted/20 mt-auto" onClick={(e) => e.stopPropagation()}>
              <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <Coins className="size-3 text-muted-foreground" />
                {account.currency || currency}
              </span>

              <Button
                size="sm"
                variant="outline"
                asChild
                className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
              >
                <Link href={`/investments/${account.accountId}`}>
                  <Eye className="size-3 mr-1" />
                  View Account
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
