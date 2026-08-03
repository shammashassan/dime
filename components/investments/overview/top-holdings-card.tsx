"use client"

import { InvestmentHolding } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import Link from "next/link"
import { Layers } from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"

export function TopHoldingsCard({
  holdings,
  currency,
}: {
  holdings: InvestmentHolding[]
  currency: string
}) {
  const activeHoldings = holdings.filter((h) => h.status === "active")
  const holdingsWithValue = activeHoldings.map((h) => ({
    ...h,
    currentValue: h.quantity * h.currentPrice,
  }))

  const totalValue = holdingsWithValue.reduce((sum, h) => sum + Math.max(0, h.currentValue), 0)

  const topHoldings = [...holdingsWithValue].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5)

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-auto lg:h-full flex flex-col bg-card">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Holdings</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{activeHoldings.length} total</span>
      </div>

      <div className="flex-1">
        {topHoldings.length > 0 ? (
          <ScrollArea className="max-h-[220px] px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-1.5">
              {topHoldings.map((holding) => {
                const percentage = totalValue > 0 ? ((holding.currentValue / totalValue) * 100).toFixed(1) : "0.0"
                const href = `/investments/${holding.walletId}/${holding.symbol}`

                return (
                  <HoverCard key={`${holding.walletId}_${holding.symbol}`} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Item asChild className="cursor-pointer px-2.5 py-1.5 hover:bg-muted/60 transition-colors rounded-xl">
                        <Link href={href}>
                          <ItemMedia className="size-7 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-500 font-extrabold text-[9px] uppercase flex items-center justify-center">
                            {holding.symbol.slice(0, 3)}
                          </ItemMedia>
                          <ItemContent className="min-w-0">
                            <ItemTitle className="font-bold text-xs block leading-tight text-foreground truncate">
                              {holding.symbol}
                            </ItemTitle>
                            <ItemDescription className="text-[10px] capitalize leading-tight truncate">
                              {holding.name}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions className="text-right shrink-0 pl-2 flex flex-col items-end gap-0.5">
                            <span className="font-bold text-xs tabular-nums block leading-tight">
                              {formatCurrency(holding.currentValue, currency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                              {percentage}% of portfolio
                            </span>
                          </ItemActions>
                        </Link>
                      </Item>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60 text-xs rounded-xl border border-border/40 shadow-lg p-3" align="start" side="top">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-6 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-500 font-bold text-[10px] flex items-center justify-center uppercase">
                          {holding.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{holding.symbol}</p>
                          <p className="text-[10px] text-muted-foreground">{holding.name}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-muted-foreground leading-relaxed text-[11px]">
                        <p>
                          Quantity: <span className="font-semibold text-foreground">{holding.quantity}</span>
                        </p>
                        <p>
                          Current Value: <span className="font-semibold text-foreground">{formatCurrency(holding.currentValue, currency)}</span> ({percentage}%)
                        </p>
                        <p>
                          Avg Cost: <span className="font-semibold text-foreground">{formatCurrency(holding.averageCostBasis, currency)}</span>
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
            No holdings found.
          </div>
        )}
      </div>
    </div>
  )
}
