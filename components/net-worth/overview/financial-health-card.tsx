"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Droplet, Scale, Sparkles, Activity } from "lucide-react"

export function FinancialHealthCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { liquidityRatio, debtRatio, largestAsset, largestLiability, currency } = viewModel

  const debtRatioColor = debtRatio >= 50 ? "rose" : debtRatio >= 20 ? "amber" : "emerald"

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Activity className="size-4.5 text-primary" />
            Financial Health
          </CardTitle>
          <CardDescription className="text-xs">KPI health diagnostics</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-4">
          <RatioProgressRow icon={Droplet} label="Liquidity Ratio" value={liquidityRatio} color="emerald" />
          <RatioProgressRow icon={Scale} label="Debt-to-Asset Ratio" value={debtRatio} color={debtRatioColor} />
        </div>

        <div className="border-t border-border/30 pt-4 flex flex-col gap-2.5 text-xs">
          {largestAsset && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Largest Asset</span>
              <span className="font-semibold text-emerald-500 tabular-nums">
                {largestAsset.name} ({formatCurrency(largestAsset.value / 100, currency)})
              </span>
            </div>
          )}
          {largestLiability && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Largest Liability</span>
              <span className="font-semibold text-rose-500 tabular-nums">
                {largestLiability.name} ({formatCurrency(largestLiability.value / 100, currency)})
              </span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-border/20 pt-2.5">
            <span className="text-muted-foreground">Diversification Score</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <Sparkles className="size-3" /> Optimum
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RatioProgressRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: "emerald" | "rose" | "amber"
}) {
  const colorMap: Record<string, string> = {
    emerald: "#10b981",
    rose: "#ef4444",
    amber: "#f59e0b",
  }
  const textColorMap: Record<string, string> = {
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className={cn("font-bold tabular-nums", textColorMap[color])}>{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorStyle={{ backgroundColor: colorMap[color] }} />
    </div>
  )
}
