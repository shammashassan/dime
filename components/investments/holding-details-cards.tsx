"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { buildHoldingReturn, calculateDividendSummary } from "@/lib/calculations/investments"
import type { InvestmentHolding, InvestmentTransaction, Wallet, PriceHistoryPoint } from "@/types"
import { Progress } from "@/components/ui/progress"
import {
  Info,
  Sparkles,
  Coins,
  Layers,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ExternalLink,
  PieChart,
  Scale,
  BarChart2,
} from "lucide-react"

interface HoldingPositionDetailsCardProps {
  holding: InvestmentHolding
  wallet: Wallet
  transactions: InvestmentTransaction[]
  currency: string
}

export function HoldingPositionDetailsCard({
  holding,
  wallet,
  transactions,
  currency,
}: HoldingPositionDetailsCardProps) {
  const sortedTx = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [transactions])

  const firstPurchaseDate = sortedTx.length > 0 ? sortedTx[0].date : null
  const buyTxCount = transactions.filter((t) => t.type === "buy").length
  const sellTxCount = transactions.filter((t) => t.type === "sell").length

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Info className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Position Details
          </span>
        </div>
        <Badge
          variant="secondary"
          className="rounded-md font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 shrink-0 text-nowrap"
        >
          {holding.assetType}
        </Badge>
      </div>

      {/* Grid Content */}
      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        {/* Brokerage Account */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
            <Building2 className="size-2.5 shrink-0" /> Account
          </span>
          <Link
            href={`/investments/${wallet._id}`}
            className="font-semibold text-xs text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1 truncate"
            title={wallet.name}
          >
            <span className="truncate">{wallet.name}</span>
            <ExternalLink className="size-2.5 opacity-60 shrink-0" />
          </Link>
        </div>

        {/* Ticker / Symbol */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
            <Tag className="size-2.5 shrink-0" /> Ticker
          </span>
          <span className="font-semibold font-mono text-xs truncate">{holding.symbol}</span>
        </div>

        {/* Average Cost Basis */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
            <Coins className="size-2.5 shrink-0" /> Avg Buy Price
          </span>
          <span className="font-semibold text-xs tabular-nums">
            {formatCurrency(holding.averageCostBasis, currency)}
          </span>
        </div>

        {/* Total Cost Basis */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
            <Receipt className="size-2.5 shrink-0" /> Total Cost
          </span>
          <span className="font-semibold text-xs tabular-nums">
            {formatCurrency(holding.totalCostBasis, currency)}
          </span>
        </div>

        {/* First Acquired */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
            <Calendar className="size-2.5 shrink-0" /> Inception
          </span>
          <span className="font-semibold text-xs truncate">
            {firstPurchaseDate ? formatDate(firstPurchaseDate) : "—"}
          </span>
        </div>

        {/* Transactions summary */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
            <Layers className="size-2.5 shrink-0" /> Trades
          </span>
          <span className="font-semibold text-xs tabular-nums">
            {transactions.length} ({buyTxCount}B / {sellTxCount}S)
          </span>
        </div>

        {/* Realized P&L (if closed/trimmed positions) */}
        {holding.realizedGain !== 0 && (
          <div className="col-span-2 pt-2 border-t border-border/30 flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              Realized P&amp;L
            </span>
            <span
              className={`font-mono font-bold text-xs tabular-nums ${
                holding.realizedGain >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {holding.realizedGain >= 0 ? "+" : ""}
              {formatCurrency(holding.realizedGain, currency)}
            </span>
          </div>
        )}

        {/* Metadata (exchange / isin) */}
        {(holding.exchange || holding.isin) && (
          <div className="col-span-2 pt-1.5 border-t border-border/30 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-muted-foreground">
            {holding.exchange && <span>Exchange: <strong className="text-foreground">{holding.exchange}</strong></span>}
            {holding.isin && <span>ISIN: <strong className="text-foreground font-mono">{holding.isin}</strong></span>}
          </div>
        )}
      </div>
    </div>
  )
}

interface HoldingDiagnosticsCardProps {
  holding: InvestmentHolding
  transactions: InvestmentTransaction[]
  currency: string
}

export function HoldingDiagnosticsCard({
  holding,
  transactions,
  currency,
}: HoldingDiagnosticsCardProps) {
  const currentValueCents = Math.round(holding.quantity * holding.currentPrice)
  const returns = useMemo(() => {
    return buildHoldingReturn(transactions, currentValueCents)
  }, [transactions, currentValueCents])

  const isProfitable = returns.absoluteGainCents >= 0
  const simpleReturnPct = returns.simpleReturn * 100
  const xirrPct = returns.xirr !== null ? returns.xirr * 100 : null

  const holdingPeriodStr = useMemo(() => {
    const days = returns.holdingPeriodDays
    if (days < 30) return `${days}d`
    if (days < 365) return `${Math.round(days / 30)}mo`
    return `${(days / 365).toFixed(1)}y`
  }, [returns.holdingPeriodDays])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
      {/* Header with responsive wrapping and concise badge */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Diagnostics
          </span>
        </div>
        <Badge
          variant="outline"
          className={`rounded-md font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 border shrink-0 text-nowrap ${
            isProfitable
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
          }`}
        >
          {isProfitable ? "Profit" : "Drawdown"}
        </Badge>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Metric Summary Grid: compact 2-col capsules with proper padding */}
        <div className="grid grid-cols-2 gap-2">
          {/* XIRR Annualized Return */}
          <div className="rounded-xl border border-border/30 bg-muted/20 px-2.5 py-2 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {xirrPct !== null && xirrPct >= 0 ? (
                <TrendingUp className="size-3 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className="size-3 text-rose-500 shrink-0" />
              )}
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider truncate">XIRR</span>
            </div>
            <span
              className={`text-xs font-bold tabular-nums shrink-0 ${
                xirrPct !== null && xirrPct >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {xirrPct !== null ? `${xirrPct >= 0 ? "+" : ""}${xirrPct.toFixed(1)}%/y` : "N/A"}
            </span>
          </div>

          {/* Simple ROI */}
          <div className="rounded-xl border border-border/30 bg-muted/20 px-2.5 py-2 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {simpleReturnPct >= 0 ? (
                <ArrowUpRight className="size-3 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownRight className="size-3 text-rose-500 shrink-0" />
              )}
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider truncate">ROI</span>
            </div>
            <span
              className={`text-xs font-bold tabular-nums shrink-0 ${
                simpleReturnPct >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {simpleReturnPct >= 0 ? "+" : ""}
              {simpleReturnPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Detailed diagnostic stats */}
        <div className="space-y-2 pt-1 border-t border-border/30 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Break-Even</span>
            <span className="font-mono font-bold text-foreground tabular-nums text-xs">
              {formatCurrency(holding.averageCostBasis, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Net Position Gain</span>
            <span
              className={`font-mono font-bold text-xs tabular-nums ${
                isProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isProfitable ? "+" : ""}
              {formatCurrency(returns.absoluteGainCents, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Holding Duration</span>
            <span className="font-medium text-foreground text-xs tabular-nums">{holdingPeriodStr}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface HoldingPositionSizingCardProps {
  holding: InvestmentHolding
  allHoldings?: InvestmentHolding[]
  wallet: Wallet
  transactions?: InvestmentTransaction[]
  currency: string
}

export function HoldingPositionSizingCard({
  holding,
  allHoldings = [],
  wallet,
  transactions = [],
  currency,
}: HoldingPositionSizingCardProps) {
  const holdingValue = holding.quantity * holding.currentPrice

  const totalPortfolioValue = useMemo(() => {
    return allHoldings.reduce(
      (sum, h) => sum + Math.max(0, h.quantity * h.currentPrice),
      0
    )
  }, [allHoldings])

  const totalAccountValue = useMemo(() => {
    return allHoldings
      .filter((h) => h.walletId === holding.walletId)
      .reduce((sum, h) => sum + Math.max(0, h.quantity * h.currentPrice), 0)
  }, [allHoldings, holding.walletId])

  const portfolioWeight = totalPortfolioValue > 0 ? (holdingValue / totalPortfolioValue) * 100 : 0
  const accountWeight = totalAccountValue > 0 ? (holdingValue / totalAccountValue) * 100 : 0

  // Capital Flows
  const totalBoughtCents = useMemo(() => {
    return transactions
      .filter((t) => t.type === "buy" || t.type === "reinvested_dividend")
      .reduce((sum, t) => sum + t.price * t.quantity, 0)
  }, [transactions])

  const totalSoldCents = useMemo(() => {
    return transactions
      .filter((t) => t.type === "sell")
      .reduce((sum, t) => sum + t.price * t.quantity, 0)
  }, [transactions])

  const totalFeesCents = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.fees || 0), 0)
  }, [transactions])

  const netCapitalInvested = Math.max(0, totalBoughtCents - totalSoldCents + totalFeesCents)
  const moic = netCapitalInvested > 0 ? (holdingValue / netCapitalInvested).toFixed(2) : "1.00"

  const concentrationTier = useMemo(() => {
    if (portfolioWeight > 30) {
      return {
        label: "Concentrated",
        badgeClass: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10",
      }
    }
    if (portfolioWeight > 15) {
      return {
        label: "Core",
        badgeClass: "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10",
      }
    }
    return {
      label: "Balanced",
      badgeClass: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    }
  }, [portfolioWeight])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
      {/* Header with responsive wrapping and concise badge */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PieChart className="size-3.5 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Position Sizing
          </span>
        </div>
        <Badge
          variant="outline"
          className={`rounded-md font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 border shrink-0 text-nowrap ${concentrationTier.badgeClass}`}
        >
          {concentrationTier.label}
        </Badge>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Progress bars: Portfolio Weight & Account Weight */}
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Scale className="size-2.5 text-muted-foreground/70" /> Portfolio Weight
              </span>
              <span className="font-mono font-bold text-foreground tabular-nums text-xs">
                {portfolioWeight.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(100, Math.max(2, portfolioWeight))} className="h-1.5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[170px]" title={`Share in ${wallet.name}`}>
                In {wallet.name}
              </span>
              <span className="font-mono font-bold text-foreground tabular-nums text-xs">
                {accountWeight.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(100, Math.max(2, accountWeight))} className="h-1.5" />
          </div>
        </div>

        {/* Capital Flows Grid */}
        <div className="pt-2 border-t border-border/30 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              Net Invested
            </span>
            <span className="font-semibold text-xs tabular-nums">
              {formatCurrency(netCapitalInvested, currency)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              Capital Multiple
            </span>
            <span className="font-semibold font-mono text-xs tabular-nums">
              {moic}x
            </span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              Trading Fees
            </span>
            <span className="font-semibold text-xs tabular-nums text-muted-foreground">
              {formatCurrency(totalFeesCents, currency)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
              Current Worth
            </span>
            <span className="font-semibold text-xs tabular-nums text-foreground">
              {formatCurrency(holdingValue, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface HoldingDividendsCardProps {
  holding: InvestmentHolding
  transactions: InvestmentTransaction[]
  currency: string
}

export function HoldingDividendsCard({
  holding,
  transactions,
  currency,
}: HoldingDividendsCardProps) {
  const dividendSummary = useMemo(() => {
    return calculateDividendSummary(
      transactions,
      holding.totalCostBasis,
      holding._id.toString(),
      holding.symbol
    )
  }, [transactions, holding])

  if (dividendSummary.dividendCount === 0) {
    return null
  }

  const yieldPct = dividendSummary.annualYield !== null ? (dividendSummary.annualYield * 100).toFixed(2) : null

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Coins className="size-3.5 text-emerald-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Dividends
          </span>
        </div>
        <Badge
          variant="secondary"
          className="rounded-md font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 text-nowrap"
        >
          {dividendSummary.dividendCount} {dividendSummary.dividendCount === 1 ? "Payout" : "Payouts"}
        </Badge>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
              Total Dividends
            </span>
            <span className="text-sm font-black tracking-tight tabular-nums text-foreground">
              {formatCurrency(dividendSummary.totalDividendCents, currency)}
            </span>
          </div>

          {yieldPct && (
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                Yield on Cost
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {yieldPct}%
              </span>
            </div>
          )}
        </div>

        {dividendSummary.lastDividendDate && (
          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs">
            <span className="text-[10px] text-muted-foreground">Last Distribution</span>
            <span className="font-semibold text-foreground text-xs">
              {formatDate(dividendSummary.lastDividendDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface HoldingPriceRangeCardProps {
  holding: InvestmentHolding
  priceHistory: PriceHistoryPoint[]
  currency: string
}

export function HoldingPriceRangeCard({
  holding,
  priceHistory,
  currency,
}: HoldingPriceRangeCardProps) {
  const stats = useMemo(() => {
    const prices = priceHistory.map((p) => p.price).filter((p) => p > 0)

    if (prices.length === 0) {
      return {
        low: holding.currentPrice,
        high: holding.currentPrice,
        avg: holding.currentPrice,
        first: holding.currentPrice,
        positionPct: 50,
        changeFromFirst: 0,
        changeFromFirstPct: 0,
        distFromHigh: 0,
        distFromHighPct: 0,
        distFromLow: 0,
        distFromLowPct: 0,
      }
    }

    const low = Math.min(...prices)
    const high = Math.max(...prices)
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length
    const first = prices[0]
    const current = holding.currentPrice
    const range = high - low

    const positionPct = range > 0 ? ((current - low) / range) * 100 : 50
    const changeFromFirst = current - first
    const changeFromFirstPct = first > 0 ? (changeFromFirst / first) * 100 : 0
    const distFromHigh = current - high
    const distFromHighPct = high > 0 ? (distFromHigh / high) * 100 : 0
    const distFromLow = current - low
    const distFromLowPct = low > 0 ? (distFromLow / low) * 100 : 0

    return {
      low,
      high,
      avg,
      first,
      positionPct: Math.min(100, Math.max(0, positionPct)),
      changeFromFirst,
      changeFromFirstPct,
      distFromHigh,
      distFromHighPct,
      distFromLow,
      distFromLowPct,
    }
  }, [priceHistory, holding.currentPrice])

  const isUp = stats.changeFromFirst >= 0
  const periodLabel = priceHistory.length > 0 ? "52-Week" : "Current"

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BarChart2 className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {periodLabel} Price Range
          </span>
        </div>
        <Badge
          variant="outline"
          className={`rounded-md font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 shrink-0 text-nowrap ${
            isUp
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
          }`}
        >
          {isUp ? "+" : ""}{stats.changeFromFirstPct.toFixed(1)}%
        </Badge>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3.5">
        {/* Range bar */}
        <div className="flex flex-col gap-2">
          {/* Low / High labels */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
            <span>52W Low</span>
            <span>52W High</span>
          </div>

          {/* Track with current price marker */}
          <div className="relative h-2">
            <div className="absolute inset-0 rounded-full bg-muted/60" />
            {/* Filled portion up to current price */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
              style={{ width: `${stats.positionPct}%` }}
            />
            {/* Current price dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-primary border-2 border-background shadow-sm"
              style={{
                left: `clamp(0%, calc(${stats.positionPct}% - 7px), calc(100% - 14px))`,
              }}
            />
          </div>

          {/* Price values */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-muted-foreground">{formatCurrency(stats.low, currency)}</span>
            <span className="text-foreground text-xs">{formatCurrency(holding.currentPrice, currency)}</span>
            <span className="text-muted-foreground">{formatCurrency(stats.high, currency)}</span>
          </div>
        </div>

        {/* Supplementary stats */}
        <div className="space-y-2 pt-0.5 border-t border-border/30 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Period Average</span>
            <span className="font-mono font-bold text-foreground tabular-nums text-xs">
              {formatCurrency(stats.avg, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">From 52W High</span>
            <span
              className={`font-mono font-bold text-xs tabular-nums ${
                stats.distFromHighPct >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {stats.distFromHighPct >= 0 ? "+" : ""}{stats.distFromHighPct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">From 52W Low</span>
            <span className="font-mono font-bold text-xs tabular-nums text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{stats.distFromLowPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
