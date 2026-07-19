"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { CreditCard, HandCoins, Layers } from "lucide-react"

const iconsMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  HandCoins,
  Layers,
}

export function TopLiabilitiesCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { topLiabilities, currency } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Top Liabilities</CardTitle>
          <CardDescription className="text-xs">Largest outstanding obligations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {topLiabilities.length > 0 ? (
          <div className="space-y-3">
            {topLiabilities.map((liability) => {
              const Icon = iconsMap[liability.icon] || HandCoins
              return (
                <div key={liability.id} className="group relative flex items-center justify-between p-3 rounded-xl border border-border/20 bg-card/50 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl border flex items-center justify-center bg-rose-500/10 border-rose-500/20 text-rose-500">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      {liability.href ? (
                        <Link href={liability.href} className="font-bold text-xs hover:underline block leading-tight text-foreground">
                          {liability.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-xs block leading-tight text-foreground">{liability.name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                        {liability.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs tabular-nums block leading-tight">
                      {formatCurrency(liability.currentValue / 100, currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {liability.percentage}% of obligations
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-16 text-center">No liabilities found.</div>
        )}
      </CardContent>
    </Card>
  )
}
