"use client"

import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import Link from "next/link"
import { Wallet, HandCoins, Layers, Landmark } from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"

const iconsMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet,
  HandCoins,
  Layers,
  Landmark,
}

export function TopAssetsCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { topAssets, currency } = viewModel

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-auto lg:h-full flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Layers className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Assets</span>
      </div>

      <div className="flex-1">
        {topAssets.length > 0 ? (
          <ScrollArea className="max-h-[215px] px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
              {topAssets.map((asset) => {
                const Icon = iconsMap[asset.icon] || Layers
                return (
                  <HoverCard key={asset.id} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Item asChild className="cursor-pointer px-2.5 py-2 hover:bg-muted/60 transition-colors rounded-xl">
                        <Link href={asset.href || "#"}>
                          <ItemMedia className="size-8 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                            <Icon className="size-3.5" />
                          </ItemMedia>
                          <ItemContent className="min-w-0">
                            <ItemTitle className="font-bold text-xs block leading-tight text-foreground truncate">
                              {asset.name}
                            </ItemTitle>
                            <ItemDescription className="text-[10px] capitalize leading-tight">
                              {asset.category.replace("_", " ")}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions className="text-right shrink-0 pl-2 flex flex-col items-end gap-0.5">
                            <span className="font-bold text-xs tabular-nums block leading-tight">
                              {formatCurrency(asset.currentValue / 100, currency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                              {asset.percentage}% of portfolio
                            </span>
                          </ItemActions>
                        </Link>
                      </Item>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-56 text-xs rounded-xl border border-border/40 shadow-lg p-3" align="start" side="top">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-6 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <Icon className="size-3" />
                        </div>
                        <p className="font-bold text-xs">{asset.name}</p>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {asset.percentage}% of total portfolio value, currently worth{" "}
                        <span className="font-semibold text-foreground">{formatCurrency(asset.currentValue / 100, currency)}</span>.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-14 text-center flex items-center justify-center h-[280px]">No assets found.</div>
        )}
      </div>
    </div>
  )
}