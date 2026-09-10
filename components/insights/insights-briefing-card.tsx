import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bot, AlertCircle } from "lucide-react"

interface InsightsBriefingCardProps {
  briefing: {
    summary: string
    focalAdvice: string
    isAiGenerated: boolean
  }
}

export function InsightsBriefingCard({ briefing }: InsightsBriefingCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xs flex flex-col justify-between h-full">
      {/* Background glow accent */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-48 rounded-full bg-primary/10 blur-[45px] pointer-events-none" />

      {/* Header Strip */}
      <div className="px-5 py-3 border-b border-border/30 bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5 animate-pulse" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-foreground leading-none">Executive AI Briefing</h2>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              Diagnostic Synthesis &amp; Health Pulse
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-md font-semibold text-[10px] h-5 px-2 gap-1.5 border-primary/30 text-primary bg-primary/5"
        >
          {briefing.isAiGenerated ? (
            <Bot className="size-3" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3" aria-hidden="true" />
          )}
          {briefing.isAiGenerated ? "Gemini 1.5 Analysis" : "Diagnostic Summary"}
        </Badge>
      </div>

      {/* Body */}
      <CardContent className="p-5 flex flex-col gap-4 flex-1 justify-between">
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {briefing.summary}
        </p>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <div className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Focal Actionable Recommendation
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed font-medium">
              {briefing.focalAdvice}
            </p>
          </div>
        </div>
      </CardContent>

      {/* Footer Strip */}
      <div className="px-5 py-2.5 border-t border-border/30 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
        <span>120-day historical baseline analysis</span>
        {briefing.isAiGenerated ? (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Sparkles className="size-3 text-primary" aria-hidden="true" />
            Powered by Gemini
          </span>
        ) : (
          <span>Deterministic rules engine</span>
        )}
      </div>
    </Card>
  )
}
