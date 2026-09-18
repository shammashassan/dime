"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bot, CheckCircle2, AlertTriangle, Target } from "lucide-react"
import type { MonthlyReviewSummaryBrief } from "@/types"

export interface ReviewExecutiveBriefProps {
  brief: MonthlyReviewSummaryBrief
  monthLabel: string
}

export function ReviewExecutiveBrief({ brief, monthLabel }: ReviewExecutiveBriefProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xs flex flex-col justify-between">
      {/* Subtle ambient gradient highlight */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-48 rounded-full bg-primary/5 blur-[50px] pointer-events-none" />

      {/* ── Header Strip ── */}
      <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate">
              executive retrospective
              <span className="text-muted-foreground/40 font-normal mx-1 hidden sm:inline">·</span>
              <span className="font-semibold text-muted-foreground/80 normal-case hidden sm:inline">
                {monthLabel} Diagnostic Synthesis
              </span>
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-md font-semibold text-[10px] h-5 px-2 gap-1.5 border-primary/30 text-primary bg-primary/5 shrink-0"
        >
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          {brief.isAiGenerated ? (
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
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Editorial Narrative */}
        <div className="border-l-2 border-primary/60 pl-3.5 py-0.5">
          <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
            {brief.headline}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 leading-relaxed">
            {brief.summary}
          </p>
        </div>

        {/* 3 Pillars: Highlights, Watchouts, Action Focus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Highlights & Wins */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Highlights &amp; Wins</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/90 flex-1">
              {brief.highlights.length > 0 ? (
                brief.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                    <span className="leading-snug">{h}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Standard financial baseline maintained.</li>
              )}
            </ul>
          </div>

          {/* Watchouts & Leakages */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Watchouts &amp; Spikes</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/90 flex-1">
              {brief.concerns.length > 0 ? (
                brief.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                    <span className="leading-snug">{c}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Zero abnormal budget overruns detected.</li>
              )}
            </ul>
          </div>

          {/* Action Focus */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
              <Target className="size-3.5 shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Next Month Focus</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/90 flex-1">
              {brief.recommendations.length > 0 ? (
                brief.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span className="leading-snug">{r}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Maintain current budget allocation and savings velocity.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Footer Strip ── */}
      <div className="px-5 py-2.5 border-t border-border/30 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
        <span className="truncate flex items-center gap-1.5">
          <Target className="size-3.5 text-primary shrink-0" />
          <span>{brief.nextMonthOutlook || "Consistent adherence to your budget will compound into significant net worth growth."}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 shrink-0">
          variance analysis
        </span>
      </div>
    </div>
  )
}
