"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { Sparkles, Info, CheckCircle, AlertTriangle } from "lucide-react"

const iconsMap: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap: Record<string, string> = {
  success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  warning: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

export function InsightsCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { insights } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between col-span-full">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Sparkles className="size-4.5 text-primary" />
            Financial Insights
          </CardTitle>
          <CardDescription className="text-xs">Dynamic rule-based diagnostics</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1">
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => {
              const Icon = iconsMap[insight.type] || Info
              return (
                <div key={insight.id} className="flex gap-3.5 p-3 rounded-xl border border-border/20 bg-card/30">
                  <div className={`size-8 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[insight.type]}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium leading-relaxed text-foreground">{insight.text}</p>
                    {insight.metric && (
                      <span className="inline-block text-[10px] font-bold text-muted-foreground">
                        Metric: {insight.metric}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-12 text-center">No insights calculated at this time.</div>
        )}
      </CardContent>
    </Card>
  )
}
