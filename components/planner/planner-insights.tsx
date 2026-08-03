"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sparkles, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlannerInsight } from "@/types"
import { Item, ItemMedia, ItemGroup } from "@/components/ui/item"

interface PlannerInsightsProps {
  insights: PlannerInsight[]
}

const iconsMap: Record<string, React.ComponentType<{ className?: string }>> = {
  warning: AlertTriangle,
  positive: CheckCircle2,
  info: Info,
}

const colorMap: Record<string, string> = {
  warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  positive: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

const badgeColorMap: Record<string, string> = {
  warning: "text-amber-600 dark:text-amber-400 border-amber-500/30",
  positive: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  info: "text-blue-600 dark:text-blue-400 border-blue-500/30",
}

export function PlannerInsights({ insights }: PlannerInsightsProps) {
  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card h-auto lg:h-full flex flex-col">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Sparkles className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Planner Insights</span>
      </div>

      <div className="flex-1">
        {insights.length > 0 ? (
          <ScrollArea className="max-h-85 lg:h-85 px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
              {insights.map((insight) => {
                const Icon = iconsMap[insight.type] || Info
                const iconColor = colorMap[insight.type]

                return (
                  <Item
                    key={insight.id}
                    className="items-start px-2.5 py-2.5 hover:bg-muted/60 transition-colors rounded-xl w-full"
                  >
                    {/* Manual flex wrapper (not ItemContent) keeps the badge from pushing text off the right edge */}
                    <div className="w-full flex items-start gap-2.5 min-w-0">
                      <ItemMedia className={cn("size-7 rounded-lg border shrink-0 mt-0.5", iconColor)}>
                        <Icon className="size-3.5" />
                      </ItemMedia>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-bold leading-tight text-foreground min-w-0 wrap-break-word">
                            {insight.title}
                          </p>
                          {insight.metricImpact && (
                            <Badge
                              variant="outline"
                              className={cn("text-[9px] font-mono px-1.5 py-0 h-4 rounded-md shrink-0 whitespace-nowrap", badgeColorMap[insight.type])}
                            >
                              {insight.metricImpact}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed wrap-break-word">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-8 text-center flex items-center justify-center px-6 min-h-30 lg:min-h-85">
            No insights calculated for the current scenario.
          </div>
        )}
      </div>
    </div>
  )
}