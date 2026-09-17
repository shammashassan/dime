"use client"

import React, { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  CheckCircle2,
  Lightbulb,
  RotateCw,
  Bot,
} from "lucide-react"
import { toast } from "sonner"
import { refreshAiBriefingAction } from "@/lib/actions/coach"
import type { CoachSummaryBrief } from "@/types"

interface CoachOverviewCardProps {
  initialBrief: CoachSummaryBrief
}

export function CoachOverviewCard({ initialBrief }: CoachOverviewCardProps) {
  const [brief, setBrief] = useState<CoachSummaryBrief>(initialBrief)
  const [isPending, startTransition] = useTransition()

  const handleRefreshAi = () => {
    startTransition(async () => {
      const res = await refreshAiBriefingAction()
      if (res.success && res.brief) {
        setBrief(res.brief)
        toast.success("AI coaching analysis refreshed")
      } else {
        toast.error(res.error || "Failed to generate AI analysis")
      }
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm flex flex-col justify-between w-full">
      {/* Subtle ambient gradient highlight */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-48 rounded-full bg-primary/5 blur-[50px] pointer-events-none" />

      {/* ── Header Strip ── */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Executive Coaching Assessment
              <span className="text-muted-foreground/40 font-normal mx-1 hidden sm:inline">·</span>
              <span className="font-semibold text-muted-foreground/80 normal-case hidden sm:inline">
                Diagnostic Synthesis
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <Badge
            variant="outline"
            className="rounded-md font-semibold text-[10px] h-5 px-2 gap-1.5 border-primary/30 text-primary bg-primary/5 shrink-0"
          >
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {brief.isAiGenerated ? (
              <span className="flex items-center gap-1">
                <Bot className="size-3" aria-hidden="true" />
                Gemini Analysis
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Sparkles className="size-3" aria-hidden="true" />
                Deterministic Engine
              </span>
            )}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRefreshAi}
            className="rounded-lg font-bold gap-1.5 text-[11px] border-border/40 hover:bg-muted/40 cursor-pointer h-7 px-2.5 shrink-0"
          >
            <RotateCw className={`size-3 ${isPending ? "animate-spin" : ""}`} />
            <span>{isPending ? "Analyzing..." : "Refresh AI"}</span>
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-3 flex-1 justify-between">
        {/* Editorial Narrative */}
        <div className="border-l-2 border-primary/60 pl-3 py-0.5">
          <h2 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
            {brief.headline}
          </h2>
        </div>

        {/* Action Recommendation Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 sm:p-3 flex items-start gap-2.5">
          <div className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="size-3.5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Focal Actionable Recommendation
            </span>
            <p className="text-xs text-foreground/90 font-medium leading-relaxed">
              {brief.focalAdvice}
            </p>
          </div>
        </div>

        {/* 3 Highlights Bullets */}
        {brief.keyHighlights && brief.keyHighlights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/20">
            {brief.keyHighlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg border border-border/30 bg-muted/20 text-xs"
              >
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-foreground/80 font-medium text-[11px]">
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
