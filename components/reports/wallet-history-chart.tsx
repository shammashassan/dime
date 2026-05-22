"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Wallet } from "@/types"

interface WalletHistoryChartProps {
  data: Record<string, any>[]
  wallets: Wallet[]
}

export function WalletHistoryChart({ data, wallets }: WalletHistoryChartProps) {
  const chartConfig = wallets.reduce((acc, w, index) => {
    acc[w.name] = {
      label: w.name,
      color: w.color || `var(--chart-${(index % 5) + 1})`,
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Wallet Balance History</CardTitle>
        <CardDescription>End-of-month balances over time per wallet</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 && wallets.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              {wallets.map((w, index) => (
                <Area
                  key={w._id.toString()}
                  dataKey={w.name}
                  type="monotone"
                  fill={w.color || `var(--chart-${(index % 5) + 1})`}
                  fillOpacity={0.4}
                  stroke={w.color || `var(--chart-${(index % 5) + 1})`}
                  stackId="a"
                  isAnimationActive={true}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No historical wallet data available.
          </div>
        )}
      </CardContent>
      {data.length > 0 && wallets.length > 0 && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                Balance history across wallets <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                End-of-month snapshots
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}