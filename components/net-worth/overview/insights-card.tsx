"use client"

import { NetWorthOverviewViewModel } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/components/ui/item"

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
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Sparkles className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Financial Insights</span>
      </div>

      <div className="flex-1">
        {insights.length > 0 ? (
          <ScrollArea className="h-53.75 px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
              {insights.map((insight) => {
                const Icon = iconsMap[insight.type] || Info
                const iconColor = colorMap[insight.type]
                return (
                  <Item
                    key={insight.id}
                    asChild
                    className="items-start px-2.5 py-2 hover:bg-muted/60 transition-colors rounded-xl cursor-pointer"
                  >
                    <Link href={insight.href || "#"} className="w-full flex items-start gap-2.5">
                      <ItemMedia className={cn("size-7 rounded-lg border shrink-0 mt-0.5", iconColor)}>
                        <Icon className="size-3.5" />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <p className="text-[11px] font-medium leading-relaxed text-foreground">{insight.text}</p>
                        {insight.metric && (
                          <ItemDescription className="inline-block text-[10px] font-bold mt-0.5 leading-none">
                            Metric: {insight.metric}
                          </ItemDescription>
                        )}
                      </ItemContent>
                    </Link>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-10 text-center h-53.75 flex items-center justify-center">
            No insights calculated at this time.
          </div>
        )}
      </div>
    </div>
  )
}