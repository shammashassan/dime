"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Label } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { NetWorthOverviewViewModel, NetWorthBreakdown } from "@/types"
import { PieChart as PieChartIcon } from "lucide-react"

const assetPieConfig = {
  value: { label: "Value", color: undefined },
  cash: { label: "Cash", color: "var(--chart-1)" },
  bank: { label: "Bank", color: "var(--chart-2)" },
  investments: { label: "Investments", color: "var(--chart-3)" },
  loans: { label: "Receivables", color: "var(--chart-4)" },
  manualAssets: { label: "Other Assets", color: "var(--chart-5)" },
} as const

export function AssetAllocationCard({ viewModel, breakdowns }: { viewModel: NetWorthOverviewViewModel; breakdowns: NetWorthBreakdown["assetsBreakdown"] }) {
  const { totalAssets, currency } = viewModel

  const getPct = (val: number, total: number) => {
    if (total === 0) return 0
    return Math.round((val / total) * 100)
  }

  const assetPieData = [
    { type: "cash", value: breakdowns.cash / 100, fill: "var(--color-cash)" },
    { type: "bank", value: breakdowns.bank / 100, fill: "var(--color-bank)" },
    { type: "investments", value: breakdowns.investments / 100, fill: "var(--color-investments)" },
    { type: "loans", value: breakdowns.loans / 100, fill: "var(--color-loans)" },
    { type: "manualAssets", value: breakdowns.manualAssets / 100, fill: "var(--color-manualAssets)" },
  ].filter((item) => item.value > 0)

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <PieChartIcon className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asset Allocation</span>
      </div>

      <div className="flex flex-1 items-center justify-center p-3">
        {assetPieData.length > 0 ? (
          <ChartContainer config={assetPieConfig} className="mx-auto aspect-square w-full max-w-[180px] h-[180px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={assetPieData} dataKey="value" nameKey="type" innerRadius={48} strokeWidth={4}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 8} className="fill-foreground text-sm font-bold">
                            {formatCurrency(totalAssets / 100, currency)}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-[10px]">
                            Assets
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="text-xs text-muted-foreground py-14">No assets to allocate.</div>
        )}
      </div>

      {assetPieData.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 py-2.5 px-4 border-t border-border/30 text-[11px]">
          {assetPieData.map((item) => (
            <span key={item.type} className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: assetPieConfig[item.type as keyof typeof assetPieConfig]?.color as string }}
              />
              {assetPieConfig[item.type as keyof typeof assetPieConfig]?.label}
              <span className="text-foreground font-medium">{getPct(item.value, totalAssets / 100)}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}