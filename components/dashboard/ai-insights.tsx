import React from "react"
import { getFinancialInsights, FinancialInsight } from "@/lib/queries/insights"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  Info, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert
} from "lucide-react"

interface AIInsightsProps {
  userId: string
  className?: string
}

const INSIGHT_STYLES: Record<string, {
  border: string
  bg: string
  text: string
  icon: React.ComponentType<any>
}> = {
  warning: {
    border: "border-red-500/20 dark:border-red-500/10",
    bg: "bg-red-500/5",
    text: "text-red-500",
    icon: AlertTriangle,
  },
  success: {
    border: "border-emerald-500/20 dark:border-emerald-500/10",
    bg: "bg-emerald-500/5",
    text: "text-emerald-500",
    icon: CheckCircle,
  },
  info: {
    border: "border-blue-500/20 dark:border-blue-500/10",
    bg: "bg-blue-500/5",
    text: "text-blue-500",
    icon: Info,
  },
  tip: {
    border: "border-purple-500/20 dark:border-purple-500/10",
    bg: "bg-purple-500/5",
    text: "text-purple-500",
    icon: Lightbulb,
  },
}

export async function AIInsights({ userId, className = "" }: AIInsightsProps) {
  const insights = await getFinancialInsights(userId)

  return (
    <Card className={cn("relative overflow-hidden bg-card transition-colors duration-300", className)}>
      {/* Top background accent */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-40 rounded-full bg-primary/5 blur-[40px]" />

      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="size-5 text-primary animate-pulse" />
          AI Financial Insights
        </CardTitle>
        <CardDescription>
          Automated recommendations based on your spending habits.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pb-6 max-h-[310px] overflow-y-auto scrollbar-hide">
        {insights.map((ins) => {
          const style = INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.info
          const Icon = style.icon

          return (
            <div 
              key={ins.id}
              className={`rounded-2xl border ${style.border} ${style.bg} p-4 flex gap-3 text-left transition-all hover:scale-[1.01]`}
            >
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl bg-background border border-border/40 ${style.text} shadow-xs`}>
                <Icon className="size-4.5" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">{ins.title}</h4>
                <p className="text-xs text-muted-foreground leading-normal">{ins.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
