"use client"

import { InvestmentTransaction } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { format } from "date-fns"
import Link from "next/link"
import { Clock, ArrowUpRight, ArrowDownLeft, Coins, Split } from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"

interface RecentTransactionsCardProps {
  transactions?: InvestmentTransaction[]
  currency: string
}

export function RecentTransactionsCard({ transactions = [], currency }: RecentTransactionsCardProps) {
  const recentList = transactions.slice(0, 5)

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-auto lg:h-full flex flex-col bg-card">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent Investment Activity</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{recentList.length} recent</span>
      </div>

      <div className="flex-1">
        {recentList.length > 0 ? (
          <ScrollArea className="max-h-[220px] px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-1.5">
              {recentList.map((tx) => {
                const isBuy = tx.type === "buy"
                const isSell = tx.type === "sell"
                const isDividend = tx.type === "cash_dividend"

                const totalAmount = tx.quantity * tx.price + tx.fees

                const badgeColor = isBuy
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : isSell
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  : isDividend
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"

                const href = `/investments/${tx.walletId}/${tx.symbol}`

                return (
                  <HoverCard key={tx._id.toString()} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Item asChild className="cursor-pointer px-2.5 py-1.5 hover:bg-muted/60 transition-colors rounded-xl">
                        <Link href={href}>
                          <ItemMedia className="size-7 rounded-lg border bg-muted/60 text-foreground font-black text-[9px] uppercase flex items-center justify-center">
                            {isBuy ? (
                              <ArrowDownLeft className="size-3 text-emerald-500" />
                            ) : isSell ? (
                              <ArrowUpRight className="size-3 text-rose-500" />
                            ) : isDividend ? (
                              <Coins className="size-3 text-blue-500" />
                            ) : (
                              <Split className="size-3 text-amber-500" />
                            )}
                          </ItemMedia>
                          <ItemContent className="min-w-0">
                            <ItemTitle className="font-bold text-xs flex items-center gap-1.5 leading-tight text-foreground truncate">
                              <span className="uppercase">{tx.symbol}</span>
                              <Badge variant="outline" className={`rounded-full text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0 h-3.5 ${badgeColor}`}>
                                {tx.type.replace("_", " ")}
                              </Badge>
                            </ItemTitle>
                            <ItemDescription className="text-[10px] leading-tight truncate">
                              {format(new Date(tx.date), "MMM d, yyyy")} &middot; {tx.quantity} units @ {formatCurrency(tx.price, currency)}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions className="text-right shrink-0 pl-2 flex flex-col items-end gap-0.5">
                            <span className="font-bold text-xs tabular-nums block leading-tight">
                              {formatCurrency(totalAmount, currency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight capitalize">
                              {tx.assetType}
                            </span>
                          </ItemActions>
                        </Link>
                      </Item>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60 text-xs rounded-xl border border-border/40 shadow-lg p-3" align="start" side="top">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-6 rounded-lg border bg-muted/50 flex items-center justify-center font-bold text-[10px] uppercase">
                          {tx.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{tx.symbol} &middot; {tx.type.replace("_", " ").toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date), "PPP")}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-muted-foreground leading-relaxed text-[11px]">
                        <p>
                          Quantity: <span className="font-semibold text-foreground">{tx.quantity}</span>
                        </p>
                        <p>
                          Price per Unit: <span className="font-semibold text-foreground">{formatCurrency(tx.price, currency)}</span>
                        </p>
                        {tx.fees > 0 && (
                          <p>
                            Fees: <span className="font-semibold text-foreground">{formatCurrency(tx.fees, currency)}</span>
                          </p>
                        )}
                        <p>
                          Total Impact: <span className="font-semibold text-foreground">{formatCurrency(totalAmount, currency)}</span>
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-10 text-center flex items-center justify-center h-[220px]">
            No recent activity recorded.
          </div>
        )}
      </div>
    </div>
  )
}
