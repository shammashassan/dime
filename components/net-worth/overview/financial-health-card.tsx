"use client"

import { Progress } from "@/components/ui/progress"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Droplet, Scale, Sparkles, Activity, Info } from "lucide-react"

export function FinancialHealthCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { liquidityRatio, debtRatio, largestAsset, largestLiability, currency } = viewModel

  const debtRatioColor = debtRatio >= 50 ? "rose" : debtRatio >= 20 ? "amber" : "emerald"

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Activity className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Financial Health</span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3.5">
        <div className="flex flex-col gap-3">
          <RatioProgressRow
            icon={Droplet}
            label="Liquidity Ratio"
            value={liquidityRatio}
            color="emerald"
            tooltip="Share of total assets held in cash or bank wallets that can be accessed immediately."
          />
          <RatioProgressRow
            icon={Scale}
            label="Debt-to-Asset Ratio"
            value={debtRatio}
            color={debtRatioColor}
            tooltip="Total liabilities as a percentage of total assets. Lower is healthier."
          />
        </div>

        <div className="grid grid-cols-1 divide-y divide-border/30 border-t border-border/30 -mx-4 px-4 pt-3 text-xs">
          {largestAsset && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted-foreground text-[11px]">Largest Asset</span>
              <span className="font-bold text-emerald-500 tabular-nums text-[11px] truncate max-w-[60%] text-right">
                {largestAsset.name} · {formatCurrency(largestAsset.value / 100, currency)}
              </span>
            </div>
          )}
          {largestLiability && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted-foreground text-[11px]">Largest Liability</span>
              <span className="font-bold text-rose-500 tabular-nums text-[11px] truncate max-w-[60%] text-right">
                {largestLiability.name} · {formatCurrency(largestLiability.value / 100, currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-muted-foreground text-[11px]">Diversification Score</span>
            <span className="font-bold text-primary flex items-center gap-1 text-[11px]">
              <Sparkles className="size-3" /> Optimum
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function RatioProgressRow({
  icon: Icon,
  label,
  value,
  color,
  tooltip,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: "emerald" | "rose" | "amber"
  tooltip: string
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
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="text-muted-foreground/60 hover:text-foreground">
                <Info className="size-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-3 text-xs w-56 border border-border/40 shadow-lg rounded-xl" align="start">
              {tooltip}
            </PopoverContent>
          </Popover>
        </span>
        <span className={cn("font-bold tabular-nums", textColorMap[color])}>{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorStyle={{ backgroundColor: colorMap[color] }} />
    </div>
  )
}