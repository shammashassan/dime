import * as React from "react"
import Link from "next/link"
import { getCoachOverviewData } from "@/lib/queries/coach"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"
import {
  Compass,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  TrendingDown,
} from "lucide-react"

interface CoachWidgetProps {
  userId: string
  className?: string
}

export async function CoachWidget({ userId, className }: CoachWidgetProps) {
  const coachData = await getCoachOverviewData(userId)
  const { summaryBrief, emergencyFund, debtComparison, strategies } = coachData
  const topStrategy = strategies[0]

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            financial coach
          </span>
          {strategies.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground shrink-0">
              {strategies.length}
            </span>
          )}
        </div>
        <Link
          href="/coach"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0 whitespace-nowrap ml-auto"
        >
          <span>Open hub</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* ── Content Body ── */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Focal Advice Snippet */}
        <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground flex items-start gap-2.5">
          <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed font-medium">
            {summaryBrief.focalAdvice || topStrategy?.description || "Maintain positive monthly cash flow."}
          </p>
        </div>

        {/* Telemetry Quick Chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl border border-border/30 bg-muted/20 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-500" />
              Runway
            </span>
            <span className="text-sm font-black tabular-nums text-foreground">
              {emergencyFund.currentRunwayMonths} {emergencyFund.currentRunwayMonths === 1 ? "Month" : "Months"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-border/30 bg-muted/20 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingDown className="size-3 text-indigo-500" />
              Debt Horizon
            </span>
            <span className="text-sm font-black tabular-nums text-foreground">
              {debtComparison ? `${debtComparison.acceleratedPayoffMonths} Months` : "Debt Free"}
            </span>
          </div>
        </div>

        {/* Top Playbook / Strategy Action Item */}
        {topStrategy ? (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Item
                asChild
                variant="outline"
                size="xs"
                className="p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer no-underline group w-full overflow-hidden"
              >
                <Link href={topStrategy.actionUrl || "/coach"} className="flex items-center justify-between w-full min-w-0 gap-2 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                    <ItemMedia className="size-7.5 rounded-lg flex items-center justify-center shrink-0 border border-border/50 bg-primary/10 text-primary">
                      <Compass className="size-3.5" />
                    </ItemMedia>
                    <ItemContent className="min-w-0 flex-1 gap-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <ItemTitle className="text-xs font-bold text-foreground truncate block group-hover:text-primary transition-colors">
                          {topStrategy.title}
                        </ItemTitle>
                      </div>
                      <ItemDescription className="text-[10px] text-muted-foreground truncate block min-w-0 mt-0.5">
                        {topStrategy.description}
                      </ItemDescription>
                    </ItemContent>
                  </div>
                  {topStrategy.impact && (
                    <Badge
                      variant="outline"
                      className="text-[8px] font-bold uppercase tracking-wider h-3.5 px-1.5 bg-muted/40 text-muted-foreground border-border/60 shrink-0"
                    >
                      {topStrategy.impact}
                    </Badge>
                  )}
                </Link>
              </Item>
            </HoverCardTrigger>
            <HoverCardContent
              className="w-72 max-w-[calc(100vw-2rem)] text-xs rounded-xl border border-border/40 shadow-lg p-3 bg-popover"
              align="start"
              side="top"
            >
              <div className="flex items-start gap-2 mb-1.5">
                <div className="size-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 bg-primary/10 text-primary border-primary/20">
                  <Compass className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-foreground leading-snug wrap-break-word">
                    {topStrategy.title}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Keep on schedule
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {topStrategy.description}
              </p>
              {topStrategy.impact && (
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground font-medium">Potential Impact</span>
                  <span className="font-semibold text-foreground">{topStrategy.impact}</span>
                </div>
              )}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="p-2.5 rounded-xl border border-border/30 bg-muted/20 text-xs text-muted-foreground text-center">
            All financial playbooks on track
          </div>
        )}
      </div>
    </Card>
  )
}
