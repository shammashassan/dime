"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { MetricCard } from "@/components/ui/metric-card"
import {
  calculateCapitalGainsSchedule,
  generateTaxScheduleCsv,
  buildTaxLots,
} from "@/lib/calculations/tax-lots"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { CostBasisMethod, InvestmentHolding, InvestmentTransaction } from "@/types"
import {
  Receipt,
  Download,
  Search,
  Scale,
  Sparkles,
  Layers,
  Coins,
  ShieldCheck,
} from "lucide-react"

interface TaxScheduleViewProps {
  transactions: InvestmentTransaction[]
  holdings?: InvestmentHolding[]
  currency: string
}

const METHODS: { value: CostBasisMethod; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { value: "fifo", label: "FIFO Strategy", description: "First-In, First-Out (IRS)", icon: Scale, color: "#3b82f6" },
  { value: "lifo", label: "LIFO Strategy", description: "Last-In, First-Out (Recent)", icon: Scale, color: "#8b5cf6" },
  { value: "hifo", label: "HIFO Strategy", description: "Highest-In, First-Out (Min Tax)", icon: Sparkles, color: "#10b981" },
  { value: "average_cost", label: "Average Cost", description: "Pooled Average Cost Basis", icon: Receipt, color: "#f59e0b" },
]

export interface TaxSummaryCardsProps {
  transactions: InvestmentTransaction[]
  currency: string
  method: CostBasisMethod
  setMethod: (method: CostBasisMethod) => void
  selectedYear?: number
}

export function TaxSummaryCards({
  transactions,
  currency,
  method,
  setMethod,
  selectedYear = 0,
}: TaxSummaryCardsProps) {
  const methodComparisons = useMemo(() => {
    const fifo = calculateCapitalGainsSchedule(transactions, selectedYear, "fifo")
    const lifo = calculateCapitalGainsSchedule(transactions, selectedYear, "lifo")
    const hifo = calculateCapitalGainsSchedule(transactions, selectedYear, "hifo")
    const avg = calculateCapitalGainsSchedule(transactions, selectedYear, "average_cost")

    const hifoSavingsVsFifo = Math.max(0, fifo.netRealizedGainCents - hifo.netRealizedGainCents)

    return {
      fifo: fifo.netRealizedGainCents,
      lifo: lifo.netRealizedGainCents,
      hifo: hifo.netRealizedGainCents,
      average_cost: avg.netRealizedGainCents,
      hifoSavingsVsFifo,
    }
  }, [transactions, selectedYear])

  return (
    <div className="flex flex-wrap gap-4">
      {METHODS.map((m) => {
        const gain = methodComparisons[m.value]
        const isPos = gain >= 0
        const isActive = method === m.value

        return (
          <MetricCard
            key={m.value}
            icon={m.icon}
            color={m.color}
            label={m.label}
            value={`${isPos ? "+" : ""}${formatCurrency(gain, currency)}`}
            subtext={
              m.value === "hifo" && methodComparisons.hifoSavingsVsFifo > 0
                ? `Saves ${formatCurrency(methodComparisons.hifoSavingsVsFifo, currency)} vs FIFO`
                : m.description
            }
            valueClassName={
              isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }
            active={isActive}
            badge={
              isActive ? (
                <Badge variant="secondary" className="text-[8px] font-black uppercase px-1.5 py-0">
                  Active
                </Badge>
              ) : m.value === "hifo" && methodComparisons.hifoSavingsVsFifo > 0 ? (
                <Badge
                  variant="outline"
                  className="text-[8px] font-bold px-1.5 py-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  Min Tax
                </Badge>
              ) : undefined
            }
            onClick={() => setMethod(m.value)}
          />
        )
      })}
    </div>
  )
}

interface TaxScheduleViewProps {
  transactions: InvestmentTransaction[]
  holdings?: InvestmentHolding[]
  currency: string
  method?: CostBasisMethod
  onMethodChange?: (method: CostBasisMethod) => void
}

export function TaxScheduleView({
  transactions,
  holdings = [],
  currency,
  method: controlledMethod,
  onMethodChange,
}: TaxScheduleViewProps) {
  const [internalMethod, setInternalMethod] = useState<CostBasisMethod>("fifo")
  const method = controlledMethod ?? internalMethod
  const setMethod = onMethodChange ?? setInternalMethod

  const [selectedYear, setSelectedYear] = useState<number>(0)
  const [search, setSearch] = useState("")

  const summary = useMemo(() => {
    return calculateCapitalGainsSchedule(transactions, selectedYear, method)
  }, [transactions, selectedYear, method])

  // Multi-method comparison for the active year
  const methodComparisons = useMemo(() => {
    const fifo = calculateCapitalGainsSchedule(transactions, selectedYear, "fifo")
    const lifo = calculateCapitalGainsSchedule(transactions, selectedYear, "lifo")
    const hifo = calculateCapitalGainsSchedule(transactions, selectedYear, "hifo")
    const avg = calculateCapitalGainsSchedule(transactions, selectedYear, "average_cost")

    const hifoSavingsVsFifo = Math.max(0, fifo.netRealizedGainCents - hifo.netRealizedGainCents)

    return {
      fifo: fifo.netRealizedGainCents,
      lifo: lifo.netRealizedGainCents,
      hifo: hifo.netRealizedGainCents,
      average_cost: avg.netRealizedGainCents,
      hifoSavingsVsFifo,
    }
  }, [transactions, selectedYear])

  // Open lots & Tax-loss harvesting candidates
  const { openLots } = useMemo(() => {
    return buildTaxLots(transactions, method)
  }, [transactions, method])

  const holdingPriceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const h of holdings) {
      map.set(h.symbol.toUpperCase(), h.currentPrice)
    }
    return map
  }, [holdings])

  const taxLossHarvestingCandidates = useMemo(() => {
    return openLots
      .map((lot) => {
        const currentPrice = holdingPriceMap.get(lot.symbol.toUpperCase()) ?? lot.price
        const currentVal = Math.round(lot.remainingQuantity * currentPrice)
        const unrealizedGainLoss = currentVal - lot.remainingCostBasis
        return {
          ...lot,
          currentPrice,
          currentVal,
          unrealizedGainLoss,
          isLoss: unrealizedGainLoss < 0,
        }
      })
      .filter((lot) => lot.isLoss)
      .sort((a, b) => a.unrealizedGainLoss - b.unrealizedGainLoss)
  }, [openLots, holdingPriceMap])

  const totalHarvestableLossCents = useMemo(() => {
    return taxLossHarvestingCandidates.reduce(
      (sum, lot) => sum + Math.abs(lot.unrealizedGainLoss),
      0
    )
  }, [taxLossHarvestingCandidates])

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return summary.events
    const q = search.toLowerCase()
    return summary.events.filter((e) => e.symbol.toLowerCase().includes(q))
  }, [summary.events, search])

  const handleExportCsv = () => {
    const csvContent = generateTaxScheduleCsv(summary.events, selectedYear, method)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `dime-tax-schedule-${selectedYear || "all-years"}-${method}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const isNetPositive = summary.netRealizedGainCents >= 0

  return (
    <div className="space-y-6">

      {/* ── Controls Bar: Tax Year Filter & CSV Export ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Scale className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tax Year &amp; Reporting Scope
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              Short-Term:{" "}
              <strong className="text-foreground font-mono">
                {formatCurrency(summary.shortTerm.netGainCents, currency)}
              </strong>
            </span>
            <span className="opacity-40">&bull;</span>
            <span>
              Long-Term:{" "}
              <strong className="text-foreground font-mono">
                {formatCurrency(summary.longTerm.netGainCents, currency)}
              </strong>
            </span>
          </div>
        </div>
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Showing realized gains calculated via{" "}
            <strong className="text-foreground uppercase">{method.replace("_", " ")}</strong> accounting.
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-40">
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="w-full rounded-xl border-border/40 bg-background text-xs h-9">
                  <SelectValue placeholder="Tax Year" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectItem value="0">All Tax Years</SelectItem>
                    {summary.availableTaxYears.map((yr) => (
                      <SelectItem key={yr} value={yr.toString()}>
                        Tax Year {yr}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={summary.events.length === 0}
              className="rounded-xl text-xs font-bold gap-1.5 border-border/40 shadow-xs h-9"
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tax-Loss Harvesting Opportunities Table Card (Matches Holdings Income Projection) ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tax-Loss Harvesting Opportunities
            </span>
          </div>
          <Badge
            variant={totalHarvestableLossCents > 0 ? "destructive" : "secondary"}
            className="text-[10px] font-mono px-2 py-0.5"
          >
            {taxLossHarvestingCandidates.length}{" "}
            {taxLossHarvestingCandidates.length === 1 ? "position" : "positions"}
          </Badge>
        </div>

        <div className="flex-1 min-h-0">
          {taxLossHarvestingCandidates.length === 0 ? (
            <Empty className="py-12">
              <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-3 border border-border/40">
                <Coins className="size-6 text-muted-foreground/70" />
              </div>
              <EmptyHeader>
                <EmptyTitle className="text-sm font-bold">No loss positions to harvest</EmptyTitle>
                <EmptyDescription className="text-xs max-w-sm mx-auto mt-1">
                  All active open tax lots across your portfolio are currently profitable or flat.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Holding</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Acquired</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Shares</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Cost/Sh</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Current Price</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Harvestable Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxLossHarvestingCandidates.map((lot) => (
                  <TableRow
                    key={lot.id}
                    className="hover:bg-muted/40 transition-colors border-border/40"
                  >
                    <TableCell className="py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-xs text-foreground">{lot.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums py-2.5">
                      {formatDate(lot.date)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                      {lot.remainingQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground py-2.5">
                      {formatCurrency(lot.price, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                      {formatCurrency(lot.currentPrice, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-extrabold text-xs py-2.5">
                      <span className="text-rose-600 dark:text-rose-400">
                        {formatCurrency(lot.unrealizedGainLoss, currency)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {taxLossHarvestingCandidates.length > 0 && (
          <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              <span>
                Loss Positions:{" "}
                <strong className="text-foreground font-mono">
                  {taxLossHarvestingCandidates.length}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Harvestable Loss:</span>
              <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                {formatCurrency(-totalHarvestableLossCents, currency)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Realized Tax Events Table ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Realized Tax Events Schedule
            </span>
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
              {filteredEvents.length} {filteredEvents.length === 1 ? "record" : "records"}
            </Badge>
          </div>
          <div className="w-full sm:w-56">
            <InputGroup className="rounded-xl border-border/40 bg-background">
              <Search className="size-3.5 text-muted-foreground ml-3" />
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by symbol..."
                className="text-xs h-8"
              />
            </InputGroup>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0">
          {filteredEvents.length === 0 ? (
            <Empty className="py-12">
              <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-3 border border-border/40">
                <Receipt className="size-6 text-muted-foreground/70" />
              </div>
              <EmptyHeader>
                <EmptyTitle className="text-sm font-bold">No realized tax events</EmptyTitle>
                <EmptyDescription className="text-xs max-w-sm mx-auto mt-1">
                  Tax lot gains or losses occur when sell transactions are executed. All your current positions are open or unrealized.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Term</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Acquired</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Sold</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Shares</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Cost Basis</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Proceeds</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Gain / Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((evt) => {
                  const isGain = evt.realizedGainCents >= 0
                  return (
                    <TableRow key={evt.id} className="hover:bg-muted/40 transition-colors border-border/40">
                      <TableCell className="font-bold font-mono text-foreground text-xs py-2.5">
                        {evt.symbol}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge
                          variant="secondary"
                          className={`rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5 ${
                            evt.term === "long_term"
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                              : ""
                          }`}
                        >
                          {evt.term === "long_term" ? "Long-Term" : "Short-Term"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs tabular-nums py-2.5">
                        {formatDate(evt.buyDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs tabular-nums py-2.5">
                        {formatDate(evt.sellDate)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                        {evt.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs py-2.5">
                        {formatCurrency(evt.costBasisCents, currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                        {formatCurrency(evt.proceedsCents, currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-extrabold text-xs py-2.5">
                        <span
                          className={
                            isGain
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isGain ? "+" : ""}
                          {formatCurrency(evt.realizedGainCents, currency)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        {summary.events.length > 0 && (
          <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              <span>
                Short-Term:{" "}
                <strong className="text-foreground font-mono">
                  {formatCurrency(summary.shortTerm.netGainCents, currency)}
                </strong>
              </span>
              <span>
                Long-Term:{" "}
                <strong className="text-foreground font-mono">
                  {formatCurrency(summary.longTerm.netGainCents, currency)}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Net Realized:</span>
              <span
                className={`font-mono font-bold text-xs ${
                  isNetPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isNetPositive ? "+" : ""}
                {formatCurrency(summary.netRealizedGainCents, currency)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
