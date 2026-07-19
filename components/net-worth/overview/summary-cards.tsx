"use client"

import { Card } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Landmark, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react"

export function SummaryCards({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { netWorth, totalAssets, totalLiabilities, moMChangePct, currency } = viewModel
  const isPositive = moMChangePct >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Net Worth */}
      <Card className="net-worth-card rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-primary/5 to-card dark:bg-card shadow-sm hover:border-primary/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Net Worth</span>
            <span className="text-2xl font-black tracking-tight tabular-nums leading-none block">
              {formatCurrency(netWorth / 100, currency)}
            </span>
          </div>
          <div className="size-10 rounded-2xl border shrink-0 flex items-center justify-center bg-primary/10 border-primary/20 text-primary">
            <Landmark className="size-4.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Ratio</span>
            <span className="text-sm font-bold text-emerald-500">
              {totalAssets > 0 ? `${Math.round(((totalAssets - totalLiabilities) / totalAssets) * 100)}% Equity` : "100% Equity"}
            </span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Exposure</span>
            <span className="text-sm font-bold">Base: {currency}</span>
          </div>
        </div>
      </Card>

      {/* Assets */}
      <Card className="net-worth-card rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-emerald-500/5 to-card dark:bg-card shadow-sm hover:border-emerald-500/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Total Assets</span>
            <span className="text-2xl font-black text-emerald-500 tracking-tight tabular-nums leading-none block">
              {formatCurrency(totalAssets / 100, currency)}
            </span>
          </div>
          <div className="size-10 rounded-2xl border shrink-0 flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
            <ArrowUpRight className="size-4.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Liquid</span>
            <span className="text-sm font-bold">
              {formatCurrency((viewModel.totalAssets * viewModel.liquidityRatio / 100) / 100, currency)}
            </span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Non-liquid</span>
            <span className="text-sm font-bold">
              {formatCurrency((viewModel.totalAssets * (100 - viewModel.liquidityRatio) / 100) / 100, currency)}
            </span>
          </div>
        </div>
      </Card>

      {/* Liabilities */}
      <Card className="net-worth-card rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-rose-500/5 to-card dark:bg-card shadow-sm hover:border-rose-500/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Total Liabilities</span>
            <span className="text-2xl font-black text-rose-500 tracking-tight tabular-nums leading-none block">
              {formatCurrency(totalLiabilities / 100, currency)}
            </span>
          </div>
          <div className="size-10 rounded-2xl border shrink-0 flex items-center justify-center bg-rose-500/10 border-rose-500/20 text-rose-500">
            <ArrowDownRight className="size-4.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Leverage</span>
            <span className="text-sm font-bold text-rose-400">{viewModel.debtRatio}%</span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Owed</span>
            <span className="text-sm font-bold">Active Debt</span>
          </div>
        </div>
      </Card>

      {/* Growth change */}
      <Card className="net-worth-card rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-primary/5 to-card dark:bg-card shadow-sm hover:border-primary/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Trend Period</span>
            <span className={cn("text-2xl font-black tracking-tight tabular-nums leading-none block", isPositive ? "text-emerald-500" : "text-rose-500")}>
              {isPositive ? "+" : ""}{moMChangePct.toFixed(1)}%
            </span>
          </div>
          <div className={cn("size-10 rounded-2xl border shrink-0 flex items-center justify-center", isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500")}>
            {isPositive ? <TrendingUp className="size-4.5" /> : <TrendingDown className="size-4.5" />}
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">MoM Change</span>
            <span className="text-sm font-bold">Calculated</span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Asset Power</span>
            <span className="text-sm font-bold text-emerald-500">Positive</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
