"use client"

import { useState } from "react"
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
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

interface CategoryBreakdownChartProps {
  data: { category: string; value: number; color: string; icon: string }[]
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const activeData = data.filter((d) => d.value > 0)

  const chartConfig = activeData.reduce((acc, item) => {
    acc[item.category] = { label: item.category, color: item.color }
    return acc
  }, {} as ChartConfig)

  // Radial stacked chart expects a single-row object with category keys
  const chartData = activeData.length > 0
    ? [activeData.reduce((acc, item) => ({ ...acc, [item.category]: item.value }), {} as Record<string, number>)]
    : []

  const totalExpense = activeData.reduce((sum, d) => sum + d.value, 0)

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
            className="mx-auto aspect-square w-full max-w-[250px]"
          >
            <RadialBarChart
              data={chartData}
              endAngle={180}
              innerRadius={80}
              outerRadius={110}
            >
              {activeData.map((item) => (
                <RadialBar
                  key={item.category}
                  dataKey={item.category}
                  fill={item.color}
                  stackId="a"
                  cornerRadius={5}
                  className="stroke-transparent stroke-2"
                  isAnimationActive={true}
                />
              ))}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
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
                            ${totalExpense.toFixed(0)}
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
            {activeData.map((entry, index) => (
              <div
                key={entry.category}
                className={`flex items-center justify-between gap-3 px-2 py-1 rounded-md transition-colors cursor-default ${activeIndex === index ? "bg-muted" : ""
                  }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium truncate max-w-[140px]">{entry.category}</span>
                </div>
                <span className="text-xs font-semibold font-mono">${entry.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}