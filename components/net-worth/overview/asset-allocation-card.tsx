"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Label } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { NetWorthOverviewViewModel } from "@/types"

const assetPieConfig = {
  value: {
    label: "Value",
    color: undefined,
  },
  cash: {
    label: "Cash",
    color: "var(--chart-1)",
  },
  bank: {
    label: "Bank",
    color: "var(--chart-2)",
  },
  investments: {
    label: "Investments",
    color: "var(--chart-3)",
  },
  loans: {
    label: "Receivables",
    color: "var(--chart-4)",
  },
  manualAssets: {
    label: "Other Assets",
    color: "var(--chart-5)",
  },
} as const

export function AssetAllocationCard({ viewModel, breakdowns }: { viewModel: NetWorthOverviewViewModel; breakdowns: any }) {
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
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Asset Allocation</CardTitle>
          <CardDescription className="text-xs">Portfolio weight distribution</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center p-4">
        {assetPieData.length > 0 ? (
          <ChartContainer config={assetPieConfig} className="mx-auto aspect-square w-full max-w-[210px] h-[210px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={assetPieData} dataKey="value" nameKey="type" innerRadius={52} strokeWidth={4}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-base font-bold"
                          >
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
          <div className="text-xs text-muted-foreground py-16">No assets to allocate.</div>
        )}
      </CardContent>
      {assetPieData.length > 0 && (
        <CardFooter className="flex flex-wrap justify-center gap-x-3 gap-y-1 py-3 px-5 border-t text-[11px] [.border-t]:pt-3">
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
        </CardFooter>
      )}
    </Card>
  )
}
