"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bot, AlertCircle, ShieldCheck } from "lucide-react"

interface InsightsBriefingCardProps {
  briefing: {
    summary: string
    focalAdvice: string
    isAiGenerated: boolean
  }
}

export function InsightsBriefingCard({ briefing }: InsightsBriefingCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm flex flex-col justify-between h-full">
      {/* Subtle ambient gradient highlight */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-48 rounded-full bg-primary/5 blur-[50px] pointer-events-none" />

      {/* ── Header Strip ── */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              title="Executive AI Briefing · Diagnostic Synthesis"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate"
            >
              Executive AI Briefing
              <span className="text-muted-foreground/40 font-normal mx-1 hidden sm:inline">·</span>
              <span className="font-semibold text-muted-foreground/80 normal-case hidden sm:inline">
                Diagnostic Synthesis
              </span>
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-md font-semibold text-[10px] h-5 px-2 gap-1.5 border-primary/30 text-primary bg-primary/5 shrink-0"
        >
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          {briefing.isAiGenerated ? (
            <span className="flex items-center gap-1">
              <Bot className="size-3" aria-hidden="true" />
              Gemini 1.5 Analysis
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Sparkles className="size-3" aria-hidden="true" />
              Deterministic Engine
            </span>
          )}
        </Badge>
      </div>

      {/* ── Body ── */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 flex-1 justify-between">
        {/* Editorial Narrative */}
        <div className="border-l-2 border-primary/60 pl-3 py-0.5">
          <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
            {briefing.summary}
          </p>
        </div>

        {/* Action Recommendation Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 sm:p-3 flex items-start gap-2.5">
          <div className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="size-3.5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Focal Actionable Recommendation
            </span>
            <p className="text-xs text-foreground/90 font-medium leading-relaxed">
              {briefing.focalAdvice}
            </p>
          </div>
        </div>

        {/* Diagnostic Metadata 3-Cell Strip (Visible when briefing card has 2 columns at lg+, hidden only when cards share 50% width at md) */}
        <div className="hidden lg:grid grid-cols-3 gap-2 pt-2 border-t border-border/20 text-center">
          <div className="rounded-lg bg-muted/40 p-2 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Audit Baseline
            </span>
            <span className="text-xs font-extrabold text-foreground">120 Days</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Pattern AI
            </span>
            <span className="text-xs font-extrabold text-primary">Multi-Vector</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Diagnostic Sync
            </span>
            <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="size-3" /> Real-Time
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer Strip (Visible at lg+, hidden only when cards share 50% width at md) ── */}
      <div className="hidden lg:flex px-4 py-2 border-t border-border/30 bg-muted/10 items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
        <span className="truncate">Variance analysis across budgets, categories &amp; recurring rules</span>
        {briefing.isAiGenerated ? (
          <span className="flex items-center gap-1 font-semibold text-foreground shrink-0">
            <Sparkles className="size-3 text-primary" aria-hidden="true" />
            Powered by Gemini
          </span>
        ) : (
          <span className="shrink-0">Deterministic rules engine</span>
        )}
      </div>
    </div>
  )
}
