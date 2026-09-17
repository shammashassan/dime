import * as React from "react"
import Link from "next/link"
import { getCoachOverviewData } from "@/lib/queries/coach"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"
import {
  Compass,
  ArrowRight,
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
  const { summaryBrief, emergencyFund, debtComparison, strategies, targetCurrency } = coachData
  const topStrategy = strategies[0]

  return (
    <Card className={cn("border-border/40 shadow-sm flex flex-col justify-between overflow-hidden rounded-2xl", className)}>
      {/* ── Header Strip ── */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Compass className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              Financial Coach
            </h3>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md border-border/50 text-muted-foreground">
          {strategies.length} Playbooks
        </Badge>
      </div>

      {/* ── Content Body ── */}
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        {/* Focal Advice Snippet */}
        <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground flex items-start gap-2.5">
          <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed font-medium">
            {summaryBrief.focalAdvice || topStrategy?.description || "Maintain positive monthly cash flow."}
          </p>
        </div>

        {/* Telemetry Quick Chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl border border-border/30 bg-muted/20 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-500" />
              Runway
            </span>
            <span className="text-sm font-black tabular-nums text-foreground">
              {emergencyFund.currentRunwayMonths} Months
            </span>
          </div>

          <div className="p-2 rounded-xl border border-border/30 bg-muted/20 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingDown className="size-3 text-indigo-500" />
              Debt Horizon
            </span>
            <span className="text-sm font-black tabular-nums text-foreground">
              {debtComparison ? `${debtComparison.acceleratedPayoffMonths} Months` : "Debt Free"}
            </span>
          </div>
        </div>

        {/* Action Link to /coach */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="rounded-xl font-bold gap-1.5 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-8 w-full mt-0.5"
        >
          <Link href="/coach">
            <span>Open Coach Hub</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
