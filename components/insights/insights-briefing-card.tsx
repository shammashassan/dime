"use client"

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
    <Card className="relative overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs rounded-2xl">
      {/* Background glow accent */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-56 rounded-full bg-primary/10 blur-[50px] pointer-events-none" />

      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <h2 className="text-base font-bold text-foreground">Executive AI Briefing</h2>
          </div>

          <Badge
            variant="outline"
            className="rounded-lg font-semibold text-[11px] h-6 px-2.5 gap-1.5 border-primary/30 text-primary bg-primary/5"
          >
            {briefing.isAiGenerated ? <Bot className="size-3" /> : <Sparkles className="size-3" />}
            {briefing.isAiGenerated ? "Gemini 1.5 Analysis" : "Diagnostic Summary"}
          </Badge>
        </div>

        <p className="text-sm font-medium text-foreground leading-relaxed">
          {briefing.summary}
        </p>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-normal">
            <span className="font-bold text-foreground mr-1">Focal Recommendation:</span>
            {briefing.focalAdvice}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
