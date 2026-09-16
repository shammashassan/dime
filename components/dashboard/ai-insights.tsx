import React from "react"
import { getFinancialInsightsData } from "@/lib/queries/insights"
import type { InsightSeverity, InsightCategory } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  AlertTriangle,
  Flame,
  PiggyBank,
  Repeat,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react"

interface AIInsightsProps {
  userId: string
  className?: string
}

const SEVERITY_STYLES: Record<InsightSeverity, string> = {
  critical: "border-red-500/20 bg-red-500/5 text-red-500",
  warning: "border-amber-500/20 bg-amber-500/5 text-amber-500",
  opportunity: "border-purple-500/20 bg-purple-500/5 text-purple-500",
  info: "border-blue-500/20 bg-blue-500/5 text-blue-500",
}

const CATEGORY_ICONS: Record<InsightCategory, React.ElementType> = {
  spikes: Flame,
  outliers: AlertTriangle,
  subscriptions: Repeat,
  savings: PiggyBank,
  cashflow: TrendingDown,
  income: Info,
}

export async function AIInsights({ userId, className = "" }: AIInsightsProps) {
  const data = await getFinancialInsightsData(userId)
  const topInsights = data.insights.slice(0, 3)

  return (
    <Card className={cn("relative overflow-hidden transition-colors duration-300 h-[400px] flex flex-col", className)}>
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-40 rounded-full bg-primary/5 blur-[40px] pointer-events-none" />

      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="size-4.5 text-primary animate-pulse" aria-hidden="true" />
            AI Financial Insights
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            {data.executiveBriefing.summary}
          </CardDescription>
        </div>

        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-bold text-primary shrink-0">
          <Link href="/insights">
            Hub
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pb-4">
        {topInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Sparkles className="size-8 text-muted-foreground/40 mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              No anomalies detected. Your spending is running in line with your baseline.
            </p>
          </div>
        ) : (
          topInsights.map((ins) => {
            const Icon = CATEGORY_ICONS[ins.category] || Info
            const style = SEVERITY_STYLES[ins.severity] || SEVERITY_STYLES.info

            return (
              <div
                key={ins.id}
                className={cn("rounded-xl border p-3 flex gap-3 text-left transition-all hover:scale-[1.01]", style)}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40 shadow-xs">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground truncate">{ins.title}</h4>
                    {ins.metricLabel && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm border-border/50 text-muted-foreground font-semibold">
                        {ins.metricLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                    {ins.description}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>

      <div className="p-3 border-t border-border/30 bg-muted/10 flex justify-between items-center text-xs text-muted-foreground px-5">
        <span>{data.insights.length} active signals</span>
        <Link
          href="/insights"
          className="font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Open Insights Hub ({data.insights.length})
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
