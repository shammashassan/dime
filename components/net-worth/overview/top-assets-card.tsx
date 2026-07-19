"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Wallet, HandCoins, Layers, Landmark } from "lucide-react"

const iconsMap: Record<string, any> = {
  Wallet,
  HandCoins,
  Layers,
  Landmark,
}

export function TopAssetsCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { topAssets, currency } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Top Assets</CardTitle>
          <CardDescription className="text-xs">Highest value holdings</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {topAssets.length > 0 ? (
          <div className="space-y-3">
            {topAssets.map((asset) => {
              const Icon = iconsMap[asset.icon] || Layers
              return (
                <div key={asset.id} className="group relative flex items-center justify-between p-3 rounded-xl border border-border/20 bg-card/50 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      {asset.href ? (
                        <Link href={asset.href} className="font-bold text-xs hover:underline block leading-tight text-foreground">
                          {asset.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-xs block leading-tight text-foreground">{asset.name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                        {asset.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs tabular-nums block leading-tight">
                      {formatCurrency(asset.currentValue / 100, currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {asset.percentage}% of portfolio
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-16 text-center">No assets found.</div>
        )}
      </CardContent>
    </Card>
  )
}
