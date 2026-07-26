"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from "recharts"
import { formatCurrency, cn } from "@/lib/utils"
import { NetWorthOverviewViewModel, NetWorthBreakdown } from "@/types"
import { Globe } from "lucide-react"

export function CurrencyAllocationCard({ viewModel, currencyBreakdown }: { viewModel: NetWorthOverviewViewModel; currencyBreakdown: NetWorthBreakdown["currencyBreakdown"] }) {
  const { netWorth, currency } = viewModel

  const currencyEntries = Object.entries(currencyBreakdown || {})
  const radialColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
  const currencyChartConfig = currencyEntries.reduce((acc, [curr], idx) => {
    acc[curr] = { label: curr, color: radialColors[idx % radialColors.length] }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  const radialData = currencyEntries.length > 0
    ? [
      currencyEntries.reduce((acc, [curr, breakd]) => {
        acc[curr] = Math.abs(breakd.netWorth) / 100
        return acc
      }, {} as Record<string, number>),
    ]
    : []
  const totalCurrencyMagnitude = currencyEntries.reduce((sum, [, breakd]) => sum + Math.abs(breakd.netWorth), 0)

  const getPct = (val: number, total: number) => {
    if (total === 0) return 0
    return Math.round((val / total) * 100)
  }

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Globe className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Currency Exposure</span>
      </div>

      <div className="flex flex-1 items-center justify-center p-3">
        {radialData.length > 0 ? (
          <ChartContainer config={currencyChartConfig} className="mx-auto aspect-square w-full max-w-[150px] h-[150px]">
            <RadialBarChart data={radialData} endAngle={180} innerRadius={42} outerRadius={76}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              {currencyEntries.map(([curr]) => (
                <RadialBar
                  key={curr}
                  dataKey={curr}
                  fill={`var(--color-${curr})`}
                  stackId="a"
                  cornerRadius={5}
                  className="stroke-transparent stroke-2"
                />
              ))}
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 8} className="fill-foreground text-xs font-bold">
                            {formatCurrency(netWorth / 100, currency)}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 8} className="fill-muted-foreground text-[9px]">
                            Net Worth
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        ) : (
          <div className="text-xs text-muted-foreground py-14">No currency data.</div>
        )}
      </div>

      {currencyEntries.length > 0 && (
        <div className="flex flex-col border-t border-border/30 text-xs">
          {currencyEntries.map(([curr, breakd]) => (
            <div key={curr} className="flex w-full items-center justify-between gap-2 px-4 py-1.5 not-last:border-b border-border/20">
              <span className="flex items-center gap-2 font-medium">
                <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: currencyChartConfig[curr]?.color as string }} />
                {curr}
                <span className="text-[10px] font-normal text-muted-foreground">
                  {getPct(Math.abs(breakd.netWorth), totalCurrencyMagnitude)}%
                </span>
              </span>
              <span className={cn("font-bold tabular-nums shrink-0 text-[11px]", breakd.netWorth >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {formatCurrency(breakd.netWorth / 100, curr)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}