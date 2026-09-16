import * as React from "react"
import Link from "next/link"
import { getFinancialHealthData } from "@/lib/queries/financial-health"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HealthTier } from "@/types"
import { cn } from "@/lib/utils"
import { Activity, ArrowRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react"

interface FinancialHealthWidgetProps {
  userId: string
  className?: string
}

const tierBadges: Record<
  HealthTier,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    colorClass: string
  }
> = {
  excellent: { label: "Excellent", variant: "default", colorClass: "text-emerald-500" },
  good: { label: "Good", variant: "secondary", colorClass: "text-primary" },
  fair: { label: "Fair", variant: "outline", colorClass: "text-amber-500" },
  needs_attention: { label: "Needs Attention", variant: "destructive", colorClass: "text-rose-500" },
}

export async function FinancialHealthWidget({ userId, className }: FinancialHealthWidgetProps) {
  const healthData = await getFinancialHealthData(userId)
  const { overallScore, tier, scoreDelta, recommendations } = healthData
  const tierInfo = tierBadges[tier]
  const topRec = recommendations[0]

  return (
    <Card className={cn("rounded-2xl border-border/40 flex flex-col justify-between", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Activity className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Financial Health
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Composite wellness score
              </CardDescription>
            </div>
          </div>

          <Badge variant={tierInfo.variant} className="text-xs font-semibold px-2.5 py-0.5 rounded-lg">
            {tierInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-1 pb-4">
        {/* Score & Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-3xl font-extrabold tabular-nums tracking-tight", tierInfo.colorClass)}>
                {overallScore}
              </span>
              <span className="text-xs text-muted-foreground font-medium">/ 100</span>
            </div>

            {scoreDelta !== 0 && (
              <span
                className={cn(
                  "text-xs font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-full",
                  scoreDelta > 0
                    ? "text-emerald-500 bg-emerald-500/10"
                    : "text-rose-500 bg-rose-500/10"
                )}
              >
                {scoreDelta > 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
              </span>
            )}
          </div>

          <Progress value={overallScore} className="h-2 rounded-full" />
        </div>

        {/* Top Recommendation Snippet */}
        {topRec && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl border border-border/30 bg-muted/20 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground text-[11px]">{topRec.title}</span>
              <span className="text-[11px] leading-tight line-clamp-1">{topRec.description}</span>
            </div>
          </div>
        )}

        {/* View Full Diagnostic Button */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full rounded-xl font-medium justify-between text-xs hover:bg-primary/5 hover:text-primary transition-colors mt-1"
        >
          <Link href="/health">
            View Diagnostic & Simulator
            <ArrowRight data-icon="inline-end" className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
