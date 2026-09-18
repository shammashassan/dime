"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Coins, Calendar, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { calculateDividendSummary } from "@/lib/calculations/investments"
import type { InvestmentTransaction } from "@/types"

interface DividendHistoryCardProps {
  transactions: InvestmentTransaction[]
  currency?: string
}

const chartConfig = {
  dividend: {
    label: "Dividend",
    color: "#10b981",
  },
} satisfies ChartConfig

export function DividendHistoryCard({
  transactions,
  currency = "USD",
}: DividendHistoryCardProps) {
  // Approximate cost basis from all buy transactions
  const totalCostBasis = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === "buy")
      .reduce((sum, t) => sum + t.price * t.quantity + t.fees, 0)
  }, [transactions])

  const summary = React.useMemo(() => {
    return calculateDividendSummary(transactions, totalCostBasis)
  }, [transactions, totalCostBasis])

  const chartData = React.useMemo(() => {
    return [...summary.byYear]
      .sort((a, b) => a.year - b.year)
      .map((d) => ({
        year: String(d.year),
        amount: d.totalCents / 100,
      }))
  }, [summary.byYear])

  const hasDividends = summary.dividendCount > 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-emerald-500 shrink-0" />
            <CardTitle className="text-base font-bold">Dividend Income</CardTitle>
          </div>
          <CardDescription>Passive cash flow from investment payouts</CardDescription>
        </div>

        {hasDividends && (
          <div className="flex flex-col items-end shrink-0">
            <span className="font-mono font-bold text-base text-foreground">
              {formatCurrency(summary.totalDividendCents, currency)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {summary.dividendCount} {summary.dividendCount === 1 ? "payout" : "payouts"}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-2">
        {hasDividends && chartData.length > 0 ? (
          <div className="flex flex-col gap-4">
            <ChartContainer config={chartConfig} className="w-full h-36 min-h-[140px]">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => `$${val}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex justify-between items-center w-32 text-xs">
                          <span className="text-muted-foreground">Dividends:</span>
                          <span className="font-mono font-bold">
                            {formatCurrency(Number(value) * 100, currency)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px]">Trailing Yield</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.annualYield !== null
                    ? `${(summary.annualYield * 100).toFixed(2)}%`
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px]">Last Payment</span>
                <span className="font-medium text-foreground">
                  {summary.lastDividendDate
                    ? summary.lastDividendDate.toISOString().slice(0, 10)
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-44 text-center p-4 rounded-xl border border-dashed border-border/60 text-muted-foreground gap-2">
            <Coins className="size-6 opacity-40" />
            <p className="text-xs">No dividend transactions recorded yet.</p>
            <p className="text-[11px] text-muted-foreground/80">
              Log dividend receipts via &quot;Record Transaction&quot; to track payouts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
