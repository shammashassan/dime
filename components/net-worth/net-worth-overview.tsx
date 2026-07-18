"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { NetWorthBreakdown, HistoricalNetWorthPoint } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldAlert, Building2, Wallet, Coins, Landmark, CreditCard, HelpCircle, HandCoins, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const chartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "hsl(var(--primary))",
  },
  totalAssets: {
    label: "Total Assets",
    color: "hsl(var(--emerald-500, 142 72% 29%))",
  },
  totalLiabilities: {
    label: "Total Liabilities",
    color: "hsl(var(--rose-500, 346 84% 61%))",
  },
} satisfies ChartConfig

interface NetWorthOverviewProps {
  current: NetWorthBreakdown
  history: HistoricalNetWorthPoint[]
  currency: string
}

export function NetWorthOverview({ current, history, currency }: NetWorthOverviewProps) {
  // Sort history ascending for chart display
  const chartData = React.useMemo(() => {
    return [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [history])

  // Calculate Net Worth change compared to previous month
  const netWorthChange = React.useMemo(() => {
    if (history.length < 2) return null
    const sortedPoints = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const latest = sortedPoints[0].netWorth
    const previous = sortedPoints[1].netWorth
    
    if (previous === 0) return null
    
    const diff = latest - previous
    const pct = (diff / Math.abs(previous)) * 100
    
    return {
      diff,
      pct,
      isPositive: diff >= 0
    }
  }, [history])

  const assetsBreakdown = current.assetsBreakdown
  const liabilitiesBreakdown = current.liabilitiesBreakdown
  const totalAssets = current.totalAssets
  const totalLiabilities = current.totalLiabilities

  // Allocation percent helper
  const getPct = (val: number, total: number) => {
    if (total === 0) return 0
    return Math.round((val / total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Worth Card */}
        <Card className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-gradient-to-r from-primary to-transparent" />
          <CardHeader className="p-5 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
              Total Net Worth
            </span>
            <CardTitle className="text-3xl font-black tabular-nums tracking-tight mt-1">
              {formatCurrency(current.netWorth / 100, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {netWorthChange ? (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-lg",
                    netWorthChange.isPositive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  )}
                >
                  {netWorthChange.isPositive ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ArrowDownRight className="size-3.5" />
                  )}
                  {Math.abs(netWorthChange.pct).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">
                  {netWorthChange.isPositive ? "increase" : "decrease"} since last month
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No historical comparison yet</span>
            )}
          </CardContent>
        </Card>

        {/* Total Assets Card */}
        <Card className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-gradient-to-r from-emerald-500 to-transparent" />
          <CardHeader className="p-5 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
              Total Assets
            </span>
            <CardTitle className="text-2xl font-black tabular-nums tracking-tight text-emerald-500 mt-1">
              {formatCurrency(totalAssets / 100, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {assetsBreakdown.cash > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 font-bold">
                  Cash: {formatCurrency(assetsBreakdown.cash / 100, currency)}
                </Badge>
              )}
              {assetsBreakdown.bank > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 font-bold">
                  Bank: {formatCurrency(assetsBreakdown.bank / 100, currency)}
                </Badge>
              )}
              {assetsBreakdown.investments > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 font-bold">
                  Investments: {formatCurrency(assetsBreakdown.investments / 100, currency)}
                </Badge>
              )}
              {assetsBreakdown.loans > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 font-bold">
                  Receivables: {formatCurrency(assetsBreakdown.loans / 100, currency)}
                </Badge>
              )}
              {assetsBreakdown.manualAssets > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 font-bold">
                  Other: {formatCurrency(assetsBreakdown.manualAssets / 100, currency)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Liabilities Card */}
        <Card className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-gradient-to-r from-rose-500 to-transparent" />
          <CardHeader className="p-5 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/80">
              Total Liabilities
            </span>
            <CardTitle className="text-2xl font-black tabular-nums tracking-tight text-rose-500 mt-1">
              {formatCurrency(totalLiabilities / 100, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {liabilitiesBreakdown.creditCards > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-rose-500/5 text-rose-600 border border-rose-500/10 font-bold">
                  Credit Cards: {formatCurrency(liabilitiesBreakdown.creditCards / 100, currency)}
                </Badge>
              )}
              {liabilitiesBreakdown.loans > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-rose-500/5 text-rose-600 border border-rose-500/10 font-bold">
                  Loans: {formatCurrency(liabilitiesBreakdown.loans / 100, currency)}
                </Badge>
              )}
              {liabilitiesBreakdown.manualLiabilities > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-lg bg-rose-500/5 text-rose-600 border border-rose-500/10 font-bold">
                  Other: {formatCurrency(liabilitiesBreakdown.manualLiabilities / 100, currency)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Trend Chart */}
      <Card className="rounded-2xl border border-border/40 bg-card">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-base font-bold">Net Worth Timeline</CardTitle>
          <CardDescription>Progression of assets, liabilities, and overall net worth.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillLiabilities" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(239, 68, 68)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="rgb(239, 68, 68)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="dateStr"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs font-medium text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs font-medium text-muted-foreground"
                  tickFormatter={(val) => {
                    if (val >= 100000000) return `${(val / 100000000).toFixed(0)}M`
                    if (val >= 100000) return `${(val / 100000).toFixed(0)}k`
                    if (val <= -100000) return `-${(Math.abs(val) / 100000).toFixed(0)}k`
                    return (val / 100).toFixed(0)
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name) => {
                        let colorVar = "var(--color-netWorth)"
                        if (name === "totalAssets") colorVar = "rgb(16, 185, 129)"
                        if (name === "totalLiabilities") colorVar = "rgb(239, 68, 68)"
                        
                        return (
                          <>
                            <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: colorVar }} />
                            <div className="flex flex-1 justify-between items-center leading-none">
                              <span className="text-muted-foreground capitalize mr-4">
                                {name === "netWorth" ? "Net Worth" : name === "totalAssets" ? "Assets" : "Liabilities"}
                              </span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {formatCurrency(Number(value) / 100, currency)}
                              </span>
                            </div>
                          </>
                        )
                      }}
                    />
                  }
                />
                <Area
                  dataKey="totalAssets"
                  type="monotone"
                  fill="url(#fillAssets)"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
                <Area
                  dataKey="totalLiabilities"
                  type="monotone"
                  fill="url(#fillLiabilities)"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
                <Area
                  dataKey="netWorth"
                  type="monotone"
                  fill="url(#fillNetWorth)"
                  stroke="var(--color-netWorth)"
                  strokeWidth={3}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              No historical data available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocation Breakdown and Currency breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset and Liability Allocation */}
        <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base">Allocation Breakdown</h3>
            <p className="text-xs text-muted-foreground">Portfolio weight breakdown of your assets and liabilities.</p>
          </div>

          <div className="space-y-5">
            {/* Assets weight */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500">Asset Weighting</h4>
              {totalAssets > 0 ? (
                <div className="space-y-2.5">
                  {/* Cash */}
                  {assetsBreakdown.cash > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><Coins className="size-3.5 text-emerald-500" /> Cash</span>
                        <span>{getPct(assetsBreakdown.cash, totalAssets)}%</span>
                      </div>
                      <Progress value={getPct(assetsBreakdown.cash, totalAssets)} className="h-1.5 bg-emerald-500/10 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                    </div>
                  )}
                  {/* Bank */}
                  {assetsBreakdown.bank > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><Landmark className="size-3.5 text-emerald-500" /> Bank Balances</span>
                        <span>{getPct(assetsBreakdown.bank, totalAssets)}%</span>
                      </div>
                      <Progress value={getPct(assetsBreakdown.bank, totalAssets)} className="h-1.5 bg-emerald-500/10 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                    </div>
                  )}
                  {/* Investments */}
                  {assetsBreakdown.investments > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><TrendingUp className="size-3.5 text-emerald-500" /> Investments & Equities</span>
                        <span>{getPct(assetsBreakdown.investments, totalAssets)}%</span>
                      </div>
                      <Progress value={getPct(assetsBreakdown.investments, totalAssets)} className="h-1.5 bg-emerald-500/10 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                    </div>
                  )}
                  {/* Loans / Receivables */}
                  {assetsBreakdown.loans > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><HandCoins className="size-3.5 text-emerald-500" /> Receivables</span>
                        <span>{getPct(assetsBreakdown.loans, totalAssets)}%</span>
                      </div>
                      <Progress value={getPct(assetsBreakdown.loans, totalAssets)} className="h-1.5 bg-emerald-500/10 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                    </div>
                  )}
                  {/* Manual Assets */}
                  {assetsBreakdown.manualAssets > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-emerald-500" /> Real Estate & Vehicles</span>
                        <span>{getPct(assetsBreakdown.manualAssets, totalAssets)}%</span>
                      </div>
                      <Progress value={getPct(assetsBreakdown.manualAssets, totalAssets)} className="h-1.5 bg-emerald-500/10 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2">No active assets.</div>
              )}
            </div>

            {/* Liabilities weight */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-500">Liability Weighting</h4>
              {totalLiabilities > 0 ? (
                <div className="space-y-2.5">
                  {/* Credit cards */}
                  {liabilitiesBreakdown.creditCards > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><CreditCard className="size-3.5 text-rose-500" /> Credit Card Balances</span>
                        <span>{getPct(liabilitiesBreakdown.creditCards, totalLiabilities)}%</span>
                      </div>
                      <Progress value={getPct(liabilitiesBreakdown.creditCards, totalLiabilities)} className="h-1.5 bg-rose-500/10 [&>[data-slot=progress-indicator]]:bg-rose-500" />
                    </div>
                  )}
                  {/* Loans */}
                  {liabilitiesBreakdown.loans > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><HandCoins className="size-3.5 text-rose-500" /> Loans & Borrowings</span>
                        <span>{getPct(liabilitiesBreakdown.loans, totalLiabilities)}%</span>
                      </div>
                      <Progress value={getPct(liabilitiesBreakdown.loans, totalLiabilities)} className="h-1.5 bg-rose-500/10 [&>[data-slot=progress-indicator]]:bg-rose-500" />
                    </div>
                  )}
                  {/* Manual liabilities */}
                  {liabilitiesBreakdown.manualLiabilities > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-rose-500" /> Mortgages & Manual Debt</span>
                        <span>{getPct(liabilitiesBreakdown.manualLiabilities, totalLiabilities)}%</span>
                      </div>
                      <Progress value={getPct(liabilitiesBreakdown.manualLiabilities, totalLiabilities)} className="h-1.5 bg-rose-500/10 [&>[data-slot=progress-indicator]]:bg-rose-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2">No active liabilities.</div>
              )}
            </div>
          </div>
        </Card>

        {/* Currency Allocation Card */}
        <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-base">Currency Allocation</h3>
            <p className="text-xs text-muted-foreground">Distribution of your assets and liabilities across currencies.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            {Object.keys(current.currencyBreakdown).length > 0 ? (
              Object.entries(current.currencyBreakdown).map(([curr, breakd]) => (
                <div key={curr} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-secondary/50 text-foreground font-black text-xs flex items-center justify-center">
                      {curr}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{curr}</p>
                      <p className="text-[10px] text-muted-foreground flex gap-2">
                        <span>Assets: {formatCurrency(breakd.assets / 100, curr)}</span>
                        <span>Liabs: {formatCurrency(breakd.liabilities / 100, curr)}</span>
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-black tabular-nums",
                    breakd.netWorth >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {formatCurrency(breakd.netWorth / 100, curr)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">No currency data available.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
