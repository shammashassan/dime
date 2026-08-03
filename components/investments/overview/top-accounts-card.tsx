"use client"

import { AccountViewModel } from "@/lib/calculations/investments"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import Link from "next/link"
import { Landmark, TrendingUp } from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"

export function TopAccountsCard({
  accounts,
  currency,
}: {
  accounts: AccountViewModel[]
  currency: string
}) {
  const totalValue = accounts.reduce((sum, a) => sum + Math.max(0, a.totalValue), 0)

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-auto lg:h-full flex flex-col bg-card">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Brokerage Accounts</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{accounts.length} total</span>
      </div>

      <div className="flex-1">
        {accounts.length > 0 ? (
          <ScrollArea className="max-h-[220px] px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-1.5">
              {accounts.map((account) => {
                const percentage = totalValue > 0 ? ((account.totalValue / totalValue) * 100).toFixed(1) : "0.0"
                const color = account.color || "#8b5cf6"
                const isPositive = account.unrealizedGain >= 0

                return (
                  <HoverCard key={account.accountId} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Item asChild className="cursor-pointer px-2.5 py-1.5 hover:bg-muted/60 transition-colors rounded-xl">
                        <Link href={`/investments/${account.accountId}`}>
                          <ItemMedia
                            className="size-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: color + "18", color }}
                          >
                            <TrendingUp className="size-3.5" />
                          </ItemMedia>
                          <ItemContent className="min-w-0">
                            <ItemTitle className="font-bold text-xs block leading-tight text-foreground truncate">
                              {account.accountName}
                            </ItemTitle>
                            <ItemDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 leading-tight">
                              Brokerage &middot; {account.holdings.length} {account.holdings.length === 1 ? 'holding' : 'holdings'}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions className="text-right shrink-0 pl-2 flex flex-col items-end gap-0.5">
                            <span className="font-bold text-xs tabular-nums block leading-tight">
                              {formatCurrency(account.totalValue, account.currency || currency)}
                            </span>
                            <span className={`text-[10px] font-bold leading-tight ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(account.unrealizedGain, currency)}
                            </span>
                          </ItemActions>
                        </Link>
                      </Item>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60 text-xs rounded-xl border border-border/40 shadow-lg p-3" align="start" side="top">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="size-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color + "18", color }}
                        >
                          <TrendingUp className="size-3" />
                        </div>
                        <p className="font-bold text-xs">{account.accountName}</p>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Account value is <span className="font-semibold text-foreground">{formatCurrency(account.totalValue, account.currency || currency)}</span> ({percentage}% of portfolio) with <span className="font-semibold text-foreground">{account.holdings.length} holdings</span>.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-10 text-center flex items-center justify-center h-[220px]">
            No brokerage accounts found.
          </div>
        )}
      </div>
    </div>
  )
}
