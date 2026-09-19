"use client"

import React, { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
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
import { calculateForwardDividends } from "@/lib/calculations/dividend-forecast"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { InvestmentHolding, InvestmentTransaction } from "@/types"
import {
  Coins,
  Calendar,
  TrendingUp,
  Percent,
  Layers,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface DividendForecastViewProps {
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  currency: string
}

const chartConfig = {
  income: {
    label: "Projected Dividend",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export interface DividendSummaryCardsProps {
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  currency: string
}

export function DividendSummaryCards({
  holdings,
  transactions,
  currency,
}: DividendSummaryCardsProps) {
  const forecast = useMemo(() => {
    return calculateForwardDividends(holdings, transactions)
  }, [holdings, transactions])

  const dividendPayingHoldings = forecast.holdings.filter(
    (h) => h.projectedAnnualIncomeCents > 0
  )

  return (
    <div className="flex flex-wrap gap-4">
      <MetricCard
        icon={Coins}
        color="#10b981"
        label="Forward 12M Income"
        value={formatCurrency(forecast.projectedAnnualIncomeCents, currency)}
        subtext="Estimated annual dividend cash flow"
        valueClassName="text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        icon={Percent}
        color="#6366f1"
        label="Dividend Yield"
        value={
          forecast.projectedYieldOnValuePct !== null
            ? `${forecast.projectedYieldOnValuePct}%`
            : "—"
        }
        subtext="On current portfolio market value"
      />
      <MetricCard
        icon={TrendingUp}
        color="#f59e0b"
        label="Yield on Cost"
        value={
          forecast.projectedYieldOnCostPct !== null
            ? `${forecast.projectedYieldOnCostPct}%`
            : "—"
        }
        subtext="Based on purchase price cost basis"
        valueClassName="text-amber-600 dark:text-amber-400"
      />
      <MetricCard
        icon={Layers}
        color="#3b82f6"
        label="Income Assets"
        value={dividendPayingHoldings.length}
        subtext={`Out of ${forecast.holdings.length} active holdings`}
      />
    </div>
  )
}

export function DividendForecastView({
  holdings,
  transactions,
  currency,
}: DividendForecastViewProps) {
  const forecast = useMemo(() => {
    return calculateForwardDividends(holdings, transactions)
  }, [holdings, transactions])

  const dividendPayingHoldings = useMemo(
    () => forecast.holdings.filter((h) => h.projectedAnnualIncomeCents > 0),
    [forecast.holdings]
  )

  const chartData = forecast.monthlyDistribution.map((m) => ({
    month: m.monthLabel.split(" ")[0],
    fullMonth: m.monthLabel,
    income: m.projectedIncomeCents,
    hasIncome: m.projectedIncomeCents > 0,
  }))

  return (
    <div className="space-y-6">

      {/* ── 12-Month Dividend Calendar Chart ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              12-Month Projected Dividend Calendar
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
            Forward Schedule
          </Badge>
        </div>
        <div className="p-4 flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground mb-3">
            Expected month-by-month cash inflow based on recurring payment schedules.
          </p>
          {forecast.projectedAnnualIncomeCents > 0 ? (
            <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={60}
                  tickFormatter={(v: number) => {
                    if (v === 0) return ""
                    return formatCurrency(v, currency)
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(_, payload) => {
                        return payload?.[0]?.payload?.fullMonth || ""
                      }}
                      formatter={(value) => (
                        <div className="flex flex-1 justify-between items-center leading-none gap-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: "var(--color-income)" }}
                            />
                            <span className="text-muted-foreground font-medium">
                              Projected Income
                            </span>
                          </div>
                          <span className="font-mono font-bold text-foreground">
                            {formatCurrency(Number(value), currency)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="income"
                  fill="var(--color-income)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.hasIncome ? "var(--color-income)" : "hsl(var(--muted))"}
                      fillOpacity={entry.hasIncome ? 1 : 0.25}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-1.5">
              <span>No projected dividend income across the next 12 months.</span>
              <span className="text-[11px] text-muted-foreground/60">
                Log dividend payouts or add dividend-bearing assets to view projection.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Holdings Income Projection Table ── */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Holdings Income Projection
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
            {forecast.holdings.length} {forecast.holdings.length === 1 ? "holding" : "holdings"}
          </Badge>
        </div>

        <div className="flex-1 min-h-0">
          {forecast.holdings.length === 0 ? (
            <Empty className="py-12">
              <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-3 border border-border/40">
                <Coins className="size-6 text-muted-foreground/70" />
              </div>
              <EmptyHeader>
                <EmptyTitle className="text-sm font-bold">No holdings available</EmptyTitle>
                <EmptyDescription className="text-xs max-w-sm mx-auto mt-1">
                  Add investment holdings or log dividend transactions to project future dividend cash flows.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Holding</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Cadence</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Shares</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Trailing Div/Sh</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Yield</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Forward 12M</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Next Est. Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast.holdings.map((h) => {
                  const isPayer = h.projectedAnnualIncomeCents > 0
                  return (
                    <TableRow
                      key={`${h.walletId}_${h.symbol}`}
                      className="hover:bg-muted/40 transition-colors border-border/40"
                    >
                      <TableCell className="py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold font-mono text-xs text-foreground">{h.symbol}</span>
                          {h.name && h.name !== h.symbol && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                              {h.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[9px] uppercase font-extrabold px-2 py-0.5"
                        >
                          {h.frequency.replace("_", "-")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                        {h.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground py-2.5">
                        {isPayer ? formatCurrency(h.trailingAnnualDividendPerShare, currency) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-xs py-2.5">
                        {isPayer ? `${h.projectedAnnualYieldPct}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-extrabold text-xs py-2.5">
                        <span
                          className={
                            isPayer
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }
                        >
                          {isPayer ? formatCurrency(h.projectedAnnualIncomeCents, currency) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums py-2.5">
                        {h.nextEstimatedPaymentDate
                          ? formatDate(h.nextEstimatedPaymentDate)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {forecast.holdings.length > 0 && (
          <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              <span>
                Income Assets:{" "}
                <strong className="text-foreground font-mono">
                  {dividendPayingHoldings.length}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Forward 12M:</span>
              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {formatCurrency(forecast.projectedAnnualIncomeCents, currency)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
