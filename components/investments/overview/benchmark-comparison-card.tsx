"use client"

import React, { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { MetricCard } from "@/components/ui/metric-card"
import {
  calculateBenchmarkComparison,
  BENCHMARK_CATALOG,
} from "@/lib/calculations/benchmarks"
import type {
  BenchmarkSymbol,
  InvestmentHolding,
  InvestmentTransaction,
} from "@/types"
import {
  TrendingUp,
  TrendingDown,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Layers,
  Sparkles,
} from "lucide-react"

export const TIMEFRAMES = ["1M", "3M", "6M", "1Y", "YTD", "ALL"] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

export interface BenchmarkSummaryCardsProps {
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  benchmarkId: BenchmarkSymbol
  timeframe: Timeframe
}

export function BenchmarkSummaryCards({
  holdings,
  transactions,
  benchmarkId,
  timeframe,
}: BenchmarkSummaryCardsProps) {
  const comparison = useMemo(() => {
    return calculateBenchmarkComparison(transactions, holdings, benchmarkId, timeframe)
  }, [transactions, holdings, benchmarkId, timeframe])

  const selectedBenchmarkInfo =
    BENCHMARK_CATALOG.find((b) => b.id === benchmarkId) || BENCHMARK_CATALOG[0]

  const relativeMultiple =
    comparison.benchmarkReturnPct !== 0
      ? (comparison.portfolioReturnPct / Math.abs(comparison.benchmarkReturnPct)).toFixed(2)
      : "1.00"

  return (
    <div className="flex flex-wrap gap-4">
      <MetricCard
        icon={TrendingUp}
        color="#3b82f6"
        label="Portfolio Return"
        value={`${comparison.portfolioReturnPct >= 0 ? "+" : ""}${comparison.portfolioReturnPct}%`}
        subtext={`Over ${timeframe} horizon`}
        valueClassName={
          comparison.portfolioReturnPct >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        }
      />
      <MetricCard
        icon={Compass}
        color="#8b5cf6"
        label={selectedBenchmarkInfo.name}
        value={`${comparison.benchmarkReturnPct >= 0 ? "+" : ""}${comparison.benchmarkReturnPct}%`}
        subtext={selectedBenchmarkInfo.category}
      />
      <MetricCard
        icon={comparison.isOutperforming ? ArrowUpRight : ArrowDownRight}
        color={comparison.isOutperforming ? "#10b981" : "#f43f5e"}
        label="Alpha (Excess Return)"
        value={`${comparison.alphaPct >= 0 ? "+" : ""}${comparison.alphaPct}%`}
        subtext={
          comparison.isOutperforming
            ? `Beating ${selectedBenchmarkInfo.name} by ${Math.abs(comparison.alphaPct)}%`
            : `Trailing ${selectedBenchmarkInfo.name} by ${Math.abs(comparison.alphaPct)}%`
        }
        valueClassName={
          comparison.isOutperforming
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        }
      />
      <MetricCard
        icon={Target}
        color="#f59e0b"
        label="Performance Ratio"
        value={`${relativeMultiple}x`}
        subtext="Portfolio vs Benchmark"
        valueClassName="text-amber-600 dark:text-amber-400"
      />
    </div>
  )
}

interface BenchmarkComparisonCardProps {
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  benchmarkId?: BenchmarkSymbol
  onBenchmarkChange?: (id: BenchmarkSymbol) => void
  timeframe?: Timeframe
  onTimeframeChange?: (tf: Timeframe) => void
}

export function BenchmarkComparisonCard({
  holdings,
  transactions,
  benchmarkId: controlledBenchmarkId,
  onBenchmarkChange,
  timeframe: controlledTimeframe,
  onTimeframeChange,
}: BenchmarkComparisonCardProps) {
  const [internalBenchmarkId, setInternalBenchmarkId] = useState<BenchmarkSymbol>("^GSPC")
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>("1Y")

  const benchmarkId = controlledBenchmarkId ?? internalBenchmarkId
  const setBenchmarkId = onBenchmarkChange ?? setInternalBenchmarkId

  const timeframe = controlledTimeframe ?? internalTimeframe
  const setTimeframe = onTimeframeChange ?? setInternalTimeframe

  const comparison = useMemo(() => {
    return calculateBenchmarkComparison(transactions, holdings, benchmarkId, timeframe)
  }, [transactions, holdings, benchmarkId, timeframe])

  const allBenchmarkComparisons = useMemo(() => {
    return BENCHMARK_CATALOG.map((b) => {
      const comp = calculateBenchmarkComparison(transactions, holdings, b.id, timeframe)
      return {
        ...b,
        comp,
      }
    })
  }, [transactions, holdings, timeframe])

  const outperformingCount = useMemo(() => {
    return allBenchmarkComparisons.filter((b) => b.comp.isOutperforming).length
  }, [allBenchmarkComparisons])

  const selectedBenchmarkInfo =
    BENCHMARK_CATALOG.find((b) => b.id === benchmarkId) || BENCHMARK_CATALOG[0]

  const maxAbsReturn = Math.max(
    Math.abs(comparison.portfolioReturnPct),
    Math.abs(comparison.benchmarkReturnPct),
    10
  )
  const portfolioProgress = Math.min(
    100,
    Math.max(5, (Math.abs(comparison.portfolioReturnPct) / maxAbsReturn) * 100)
  )
  const benchmarkProgress = Math.min(
    100,
    Math.max(5, (Math.abs(comparison.benchmarkReturnPct) / maxAbsReturn) * 100)
  )

  return (
    <div className="space-y-6">
      {/* ── Active Benchmark Comparison Card ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        {/* Card Header */}
        <div className="pl-4 pr-3 py-2 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Portfolio Benchmarking
            </span>
          </div>
          {/* Benchmark Selector */}
          <div className="w-full sm:w-64 shrink-0 sm:ml-auto flex justify-end">
            <Select
              value={benchmarkId}
              onValueChange={(val) => setBenchmarkId(val as BenchmarkSymbol)}
            >
              <SelectTrigger className="w-full rounded-xl border-border/40 bg-background text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {BENCHMARK_CATALOG.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Timeframe chip tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Horizon
            </span>
            <div className="flex rounded-xl bg-muted/80 p-1 gap-0.5">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                    timeframe === t
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Comparative Progress Bars */}
          <div className="space-y-3">
            {/* Portfolio Return */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary inline-block" />
                  Dime Portfolio
                </span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    comparison.portfolioReturnPct >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {comparison.portfolioReturnPct >= 0 ? "+" : ""}
                  {comparison.portfolioReturnPct}%
                </span>
              </div>
              <Progress value={portfolioProgress} className="h-2 rounded-full bg-muted" />
            </div>

            {/* Benchmark Return */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-muted-foreground inline-block" />
                  {comparison.benchmarkName}
                </span>
                <span className="font-mono font-bold tabular-nums text-foreground">
                  {comparison.benchmarkReturnPct >= 0 ? "+" : ""}
                  {comparison.benchmarkReturnPct}%
                </span>
              </div>
              <Progress value={benchmarkProgress} className="h-2 rounded-full bg-muted" />
            </div>
          </div>

          {/* Benchmark Context Footer */}
          <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              Category:{" "}
              <strong className="text-foreground">{selectedBenchmarkInfo.category}</strong>
            </span>
            <span className="truncate max-w-[280px]">
              {selectedBenchmarkInfo.description}
            </span>
          </div>
        </div>
      </div>

      {/* ── Multi-Index Benchmark Matrix Table ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Index Comparison Matrix ({timeframe})
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
            {BENCHMARK_CATALOG.length} Indices &middot; Horizon: {timeframe}
          </Badge>
        </div>

        <div className="flex-1 min-h-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Index</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Index Return</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Portfolio Return</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Alpha (α)</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBenchmarkComparisons.map((item) => {
                const isBeating = item.comp.isOutperforming
                const isSelected = item.id === benchmarkId

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => setBenchmarkId(item.id)}
                    className={`hover:bg-muted/40 transition-colors border-border/40 cursor-pointer ${
                      isSelected ? "bg-muted/25 font-semibold" : ""
                    }`}
                  >
                    <TableCell className="py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-xs text-foreground flex items-center gap-1.5">
                          {item.name}
                          {isSelected && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 uppercase font-black">
                              Active
                            </Badge>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {item.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="secondary" className="rounded-full text-[9px] font-bold px-2 py-0.5">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-xs py-2.5">
                      {item.comp.benchmarkReturnPct >= 0 ? "+" : ""}
                      {item.comp.benchmarkReturnPct}%
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                      {item.comp.portfolioReturnPct >= 0 ? "+" : ""}
                      {item.comp.portfolioReturnPct}%
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-extrabold text-xs py-2.5">
                      <span
                        className={
                          isBeating
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {item.comp.alphaPct >= 0 ? "+" : ""}
                        {item.comp.alphaPct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <Badge
                        variant="secondary"
                        className={`rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5 ${
                          isBeating
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {isBeating ? "Outperforming" : "Trailing"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {allBenchmarkComparisons.length > 0 && (
          <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              <span>
                Outperforming:{" "}
                <strong className="text-foreground font-mono">
                  {outperformingCount} / {allBenchmarkComparisons.length}
                </strong>
              </span>
              <span className="opacity-40">&bull;</span>
              <span>
                Selected:{" "}
                <strong className="text-foreground font-mono">
                  {selectedBenchmarkInfo.name}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Portfolio Return:</span>
              <span
                className={`font-mono font-bold text-xs ${
                  comparison.portfolioReturnPct >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {comparison.portfolioReturnPct >= 0 ? "+" : ""}
                {comparison.portfolioReturnPct}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
