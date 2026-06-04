"use client"

import { useState, useMemo } from "react"
import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface CategoryBreakdownChartProps {
  data: { category: string; value: number; color: string; icon: string }[]
  currency?: string
}

export function CategoryBreakdownChart({ data, currency = "USD" }: CategoryBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const activeData = useMemo(() => {
    return [...data]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data])

  const chartConfig = useMemo(() => {
    return activeData.reduce((acc, item) => {
      acc[item.category] = { label: item.category, color: item.color }
      return acc
    }, {} as ChartConfig)
  }, [activeData])

  // Radial stacked chart expects a single-row object with category keys
  const chartData = useMemo(() => {
    return activeData.length > 0
      ? [activeData.reduce((acc, item) => ({ ...acc, [item.category]: item.value }), {} as Record<string, number>)]
      : []
  }, [activeData])

  const totalExpense = useMemo(() => {
    return activeData.reduce((sum, d) => sum + d.value, 0)
  }, [activeData])

  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(totalExpense)
  }, [totalExpense, currency])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-bold">Category Distribution</CardTitle>
        <CardDescription>Expense category share for the selected period</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        {activeData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-[5/3] w-full max-w-[250px]"
          >
            <RadialBarChart
              data={chartData}
              endAngle={180}
              innerRadius={80}
              outerRadius={110}
              cy="85%"
            >
              <PolarAngleAxis
                type="number"
                domain={[0, totalExpense]}
                tick={false}
              />
              {activeData.map((item) => (
                <RadialBar
                  key={item.category}
                  dataKey={item.category}
                  fill={`var(--color-${item.category})`}
                  stackId="a"
                  cornerRadius={5}
                  className="stroke-transparent stroke-2"
                  isAnimationActive={true}
                />
              ))}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor: item.color || item.payload?.fill,
                          }}
                        />
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">{name}:</span>
                          <span className="font-mono font-bold text-foreground ml-2">
                            {formatCurrency(Number(value) * 100, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {formattedTotal}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
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
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm w-full">
            No expenses recorded in this period.
          </div>
        )}
      </CardContent>
      {activeData.length > 0 && (
        <CardFooter className="flex-col gap-2 pt-4">
          <div className="flex flex-col gap-1.5 w-full max-h-[200px] overflow-y-auto pr-1">
            {(() => {
              const showSummary = activeData.length > 4
              const displayData = showSummary ? activeData.slice(0, 3) : activeData
              const remainingData = showSummary ? activeData.slice(3) : []
              const remainingValue = remainingData.reduce((sum, item) => sum + item.value, 0)
              const remainingCount = remainingData.length

              return (
                <>
                  {displayData.map((entry, index) => (
                    <div
                      key={entry.category}
                      className={`flex items-center justify-between gap-3 px-2 py-1 rounded-md transition-colors cursor-default ${
                        activeIndex === index ? "bg-muted" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(undefined)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-medium truncate max-w-[140px]">
                          {entry.category}
                        </span>
                      </div>
                      <span className="text-xs font-semibold font-mono">
                        {formatCurrency(entry.value * 100, currency)}
                      </span>
                    </div>
                  ))}
                  {showSummary && (
                    <div
                      className={`flex items-center justify-between gap-3 px-2 py-1 rounded-md transition-colors cursor-default ${
                        activeIndex === 3 ? "bg-muted" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(3)}
                      onMouseLeave={() => setActiveIndex(undefined)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full shrink-0 bg-muted-foreground/30 border border-black/10" />
                        <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px]">
                          + {remainingCount} more
                        </span>
                      </div>
                      <span className="text-xs font-semibold font-mono text-muted-foreground">
                        {formatCurrency(remainingValue * 100, currency)}
                      </span>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}