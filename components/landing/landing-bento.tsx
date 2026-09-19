"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Sparkles,
  Command,
  LineChart,
  Repeat,
  Activity,
  Users,
  Handshake,
  Zap,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

gsap.registerPlugin(ScrollTrigger)

// ── Feature card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
  badge?: string
  children?: React.ReactNode
}

function FeatureCard({ icon, title, description, className = "", badge, children }: FeatureCardProps) {
  return (
    <Card
      className={`bento-card group relative overflow-hidden border-border/40 bg-card/45 shadow-xs
        hover:shadow-md transition-[background-color,border-color,box-shadow,transform] duration-300 hover:bg-card/75 hover:-translate-y-1
        flex flex-col justify-between p-5 sm:p-6 ${className}`}
    >
      <div className="absolute inset-0 bg-linear-to-tr from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div>
        <div className="flex justify-between items-start mb-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30">
              {badge}
            </span>
          )}
        </div>
        <CardTitle className="text-lg font-bold tracking-tight mb-1.5 text-foreground">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</CardDescription>
      </div>

      {children && (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-border/20 bg-muted/20 p-3 sm:p-3.5
          transition-colors duration-300 group-hover:bg-muted/40 flex flex-col justify-center">
          {children}
        </div>
      )}
    </Card>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function LandingBento() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // ── Hide everything immediately on mount ─────────────────────
    gsap.set(".bento-card", { autoAlpha: 0, y: 45, scale: 0.96 })
    gsap.set(".bento-eyebrow", { autoAlpha: 0, y: 12 })
    gsap.set(".reveal-heading", { clipPath: "inset(0 100% 0 0)" })

    // ── Section heading: horizontal clip-path wipe ──────────────
    const headingEls = headingRef.current?.querySelectorAll(".reveal-heading")
    if (headingEls) {
      gsap.fromTo(
        headingEls,
        { clipPath: "inset(0 100% 0 0)", autoAlpha: 1 },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.1,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      )
    }

    // Eyebrow badge
    gsap.fromTo(
      ".bento-eyebrow",
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    )

    // ── Cards: batched stagger reveal ───────────────────────────
    ScrollTrigger.batch(".bento-card", {
      start: "top 88%",
      once: true,
      interval: 0.08,
      batchMax: 3,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: "expo.out",
          overwrite: true,
        }),
    })

    // ── Micro-animations (fire once on scroll) ──────────────────
    const hasEl = (selector: string) => Boolean(containerRef.current?.querySelector(selector))

    // Scanner sweep (infinite)
    if (hasEl(".bento-scanner-line")) {
      gsap.fromTo(
        ".bento-scanner-line",
        { y: 0 },
        { y: 35, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" }
      )
    }

    // Net Worth Chart Line & Area
    if (hasEl(".bento-networth-line")) {
      gsap.fromTo(
        ".bento-networth-line",
        { strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: "power2.inOut",
          scrollTrigger: { trigger: ".bento-networth-line", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }
    if (hasEl(".bento-networth-area")) {
      gsap.fromTo(
        ".bento-networth-area",
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.8,
          delay: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bento-networth-area", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Subscription radar items
    if (hasEl(".bento-sub-item")) {
      gsap.fromTo(
        ".bento-sub-item",
        { autoAlpha: 0, x: -10 },
        {
          autoAlpha: 1, x: 0,
          duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-sub-item", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Calendar cells
    if (hasEl(".bento-calendar-cell")) {
      gsap.fromTo(
        ".bento-calendar-cell",
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1, y: 0,
          duration: 0.45, stagger: 0.08, ease: "back.out(1.4)",
          scrollTrigger: { trigger: ".bento-calendar-cell", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Shared avatars
    if (hasEl(".bento-avatar")) {
      gsap.fromTo(
        ".bento-avatar",
        { autoAlpha: 0, scale: 0.5 },
        {
          autoAlpha: 1, scale: 1,
          duration: 0.5, stagger: 0.1, ease: "back.out(1.5)",
          scrollTrigger: { trigger: ".bento-avatar", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Split progress bars
    if (hasEl(".bento-split-bar-1")) {
      gsap.fromTo(
        ".bento-split-bar-1",
        { width: "0%" },
        {
          width: "60%",
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bento-split-bar-1", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }
    if (hasEl(".bento-split-bar-2")) {
      gsap.fromTo(
        ".bento-split-bar-2",
        { width: "0%" },
        {
          width: "40%",
          duration: 1,
          delay: 0.2,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bento-split-bar-2", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Investment items
    if (hasEl(".bento-invest-item")) {
      gsap.fromTo(
        ".bento-invest-item",
        { autoAlpha: 0, x: -8 },
        {
          autoAlpha: 1, x: 0,
          duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-invest-item", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

  }, { scope: containerRef })

  return (
    <section id="features" ref={containerRef} className="mx-auto max-w-6xl px-6 py-20 sm:py-28">

      {/* ── Section heading ──────────────────────────────────────── */}
      <div ref={headingRef} className="mb-14 text-center">
        <div className="bento-eyebrow inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm mb-4" style={{ opacity: 0 }}>
          <ShieldCheck className="size-3.5 text-primary" />
          Autonomous Financial Operating System
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="reveal-heading block">Engineered for absolute clarity.</span>
        </h2>
        <p className="mt-4 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground reveal-heading">
          From Gemini-powered OCR and automated recurring radars to group debt simplification and net worth reconstruction.
        </p>
      </div>

      {/* ── Bento grid (Compact 3-column layout) ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">

        {/* 1. AI Receipt Scanner & Universal Command Center (Col Span 2) */}
        <FeatureCard
          icon={<Sparkles className="size-5" />}
          title="AI Receipt Scanner & Command Center"
          description="Drag-and-drop receipts to extract merchants and amounts via Gemini OCR, or hit ⌘K to log, split, and search in natural language."
          badge="AI Powered"
          className="md:col-span-2 bg-linear-to-br from-card/30 via-card/50 to-primary/5"
        >
          <div className="space-y-2.5 w-full">
            {/* Scanner line preview */}
            <div className="relative overflow-hidden rounded-lg border border-border/30 bg-background/60 p-2.5 shadow-xs">
              <div className="bento-scanner-line absolute top-0 left-0 right-0 h-[1.5px] bg-primary/70 shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-muted-foreground uppercase">RECEIPT:</span>
                  <span className="font-semibold text-foreground truncate">Blue Bottle Coffee · $14.25</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold shrink-0">99.4% Match</span>
              </div>
            </div>
            {/* Quick Command Prompt */}
            <div className="flex items-center justify-between rounded-lg border border-border/20 bg-background/40 px-2.5 py-1.5 text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-2 truncate">
                <Command className="size-3.5 text-primary shrink-0" />
                <span className="text-foreground text-[11px] truncate">&quot;Split $48 dinner with Sarah &amp; tag Dining&quot;</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/40 bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground shrink-0">⌘K</kbd>
            </div>
          </div>
        </FeatureCard>

        {/* 2. Net Worth & Asset Tracker (Col Span 1) */}
        <FeatureCard
          icon={<LineChart className="size-5" />}
          title="Net Worth & Asset Tracker"
          description="Real-time multi-asset valuation across bank accounts, crypto, investments, and personal lending."
          badge="Overview"
          className="md:col-span-1"
        >
          <div className="w-full">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Total Net Worth</span>
              <span className="text-[10px] font-bold text-emerald-500 font-mono">+4.8% mo</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-xl font-extrabold text-foreground tracking-tight">$362,450</span>
              <span className="text-[10px] text-muted-foreground">USD</span>
            </div>
            {/* Sparkline Chart */}
            <div className="w-full h-8 relative mb-2">
              <svg className="w-full h-full" viewBox="0 0 160 32" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="netWorthGradCompact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(var(--primary), 0.3)" />
                    <stop offset="100%" stopColor="rgba(var(--primary), 0)" />
                  </linearGradient>
                </defs>
                <path
                  className="bento-networth-area"
                  d="M0 32 L0 24 Q40 14 80 18 T160 4 L160 32 Z"
                  fill="url(#netWorthGradCompact)"
                />
                <path
                  className="bento-networth-line"
                  d="M0 24 Q40 14 80 18 T160 4"
                  fill="none"
                  stroke="rgba(var(--primary), 1)"
                  strokeWidth="2"
                  strokeDasharray="200"
                  strokeDashoffset="200"
                />
              </svg>
            </div>
            {/* Allocation Pills */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <div className="rounded bg-background/50 px-2 py-1 border border-border/20 flex justify-between">
                <span className="text-muted-foreground">Assets</span>
                <span className="font-semibold text-foreground">$447K</span>
              </div>
              <div className="rounded bg-background/50 px-2 py-1 border border-border/20 flex justify-between">
                <span className="text-muted-foreground">Debts</span>
                <span className="font-semibold text-rose-500">-$85K</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* 3. Subscription & Bill Radar (Col Span 1) */}
        <FeatureCard
          icon={<Repeat className="size-5" />}
          title="Subscriptions & Bill Radar"
          description="Track recurring renewals, variable bill cycles, free trials, and price increases automatically."
          badge="Radar"
          className="md:col-span-1"
        >
          <div className="space-y-1.5 w-full text-[11px]">
            <div className="bento-sub-item flex items-center justify-between rounded-lg bg-background/40 p-1.5 border border-border/20">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-foreground">Netflix 4K</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-muted-foreground">$22.99</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">in 3d</span>
              </div>
            </div>
            <div className="bento-sub-item flex items-center justify-between rounded-lg bg-background/40 p-1.5 border border-border/20">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="font-medium text-foreground">ChatGPT Plus</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-muted-foreground">$20.00</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-semibold">Trial ends</span>
              </div>
            </div>
            <div className="bento-sub-item flex items-center justify-between rounded-lg bg-background/40 p-1.5 border border-border/20">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-purple-500" />
                <span className="font-medium text-foreground">Electric Utility</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-muted-foreground">$114.20</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">Due Oct 1</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* 4. Cash Flow & Financial Health Score (Col Span 1) */}
        <FeatureCard
          icon={<Activity className="size-5" />}
          title="Cash Flow & Health Score"
          description="Forward-looking cash flow projections paired with a 0–100 benchmark of liquidity, debt, and savings."
          badge="Forecasting"
          className="md:col-span-1"
        >
          <div className="w-full flex flex-col gap-2 text-[11px]">
            {/* Health Score Gauge */}
            <div className="flex items-center justify-between rounded-lg bg-background/40 p-2 border border-border/20">
              <div>
                <div className="text-[9px] uppercase font-mono text-muted-foreground">Health Score</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-foreground">88</span>
                  <span className="text-[10px] font-bold text-emerald-500">Optimal</span>
                </div>
              </div>
              <div className="flex flex-col items-end text-[9px] text-muted-foreground font-mono">
                <span>Savings: 34%</span>
                <span>Runway: 8.2 mo</span>
              </div>
            </div>
            {/* 5-day Cash Flow Forecast */}
            <div className="grid grid-cols-5 gap-1 text-center font-mono">
              {[
                { day: "M 18", val: "+$3.2k", pos: true },
                { day: "T 19", val: "-$85", pos: false },
                { day: "W 20", val: "-$220", pos: false },
                { day: "T 21", val: "+$150", pos: true },
                { day: "F 22", val: "-$42", pos: false },
              ].map((d, i) => (
                <div key={i} className="bento-calendar-cell rounded bg-background/50 p-1 border border-border/15">
                  <div className="text-[8px] text-muted-foreground">{d.day}</div>
                  <div className={`text-[9px] font-bold ${d.pos ? "text-emerald-500" : "text-foreground"}`}>{d.val}</div>
                </div>
              ))}
            </div>
          </div>
        </FeatureCard>

        {/* 5. Shared Spaces & Group Debt Simplification (Col Span 1) */}
        <FeatureCard
          icon={<Users className="size-5" />}
          title="Shared Spaces & Group Debts"
          description="Couples and roommate workspaces with Splitwise-style minimal debt transfers for trips and expenses."
          badge="Collaboration"
          className="md:col-span-1"
        >
          <div className="w-full space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="bento-avatar size-6 rounded-full border border-background bg-primary/20 flex items-center justify-center text-[9px] font-bold">JD</div>
                  <div className="bento-avatar size-6 rounded-full border border-background bg-purple-500/20 flex items-center justify-center text-[9px] font-bold">AS</div>
                </div>
                <span className="text-xs font-semibold text-foreground">Apartment Hub</span>
              </div>
              <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="rounded-lg bg-background/40 p-2 border border-border/20 text-[10px] space-y-1">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Trip to Alps (4 people)</span>
                <span className="font-mono text-foreground font-semibold">$840</span>
              </div>
              <div className="text-primary font-medium text-[9px] flex items-center gap-1">
                <Handshake className="size-3" />
                Simplified 6 debts → 2 transfers
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* 6. Automation Rules & Transaction Splitting (Col Span 2) */}
        <FeatureCard
          icon={<Zap className="size-5" />}
          title="Automation Rules Engine & Split Transactions"
          description="Build custom IF/THEN triggers on merchants, accounts, and amounts to auto-tag, categorize, and split bills into multiple budget buckets."
          badge="Rules Engine"
          className="md:col-span-2 bg-linear-to-br from-card/30 via-card/50 to-primary/5"
        >
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            {/* Rule Trigger Node */}
            <div className="rounded-lg bg-background/50 p-2.5 border border-border/20 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>RULE #14</span>
                <span className="text-emerald-500 font-semibold">Live Trigger</span>
              </div>
              <div className="text-foreground text-[10px] font-semibold">
                IF Merchant contains <span className="text-primary">&quot;Whole Foods&quot;</span>
              </div>
              <div className="text-[9px] text-muted-foreground">
                THEN Auto-Categorize &amp; Split 60/40
              </div>
            </div>
            {/* Split Breakdown */}
            <div className="rounded-lg bg-background/50 p-2.5 border border-border/20 space-y-1.5 flex flex-col justify-center">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground font-semibold">Split Breakdown ($140.00)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden flex">
                <div className="bento-split-bar-1 h-full bg-primary" style={{ width: "60%" }} />
                <div className="bento-split-bar-2 h-full bg-purple-500" style={{ width: "40%" }} />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Groceries: $84 (60%)</span>
                <span>Home: $56 (40%)</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* 7. Investment Portfolio & Asset Tracking (Col Span 1) */}
        <FeatureCard
          icon={<TrendingUp className="size-5" />}
          title="Investment Portfolio"
          description="Track stocks, ETFs, crypto, and private equity with live ROI, cost basis, and asset weighting."
          badge="Markets"
          className="md:col-span-1"
        >
          <div className="w-full space-y-2 text-[11px]">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Portfolio Return</span>
              <span className="text-[10px] font-bold text-emerald-500 font-mono">+19.4% all-time</span>
            </div>
            <div className="space-y-1.5 font-mono">
              <div className="bento-invest-item flex items-center justify-between rounded-lg bg-background/40 p-1.5 border border-border/20">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-medium text-foreground truncate">VOO (S&P 500)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 shrink-0">+22.4%</span>
              </div>
              <div className="bento-invest-item flex items-center justify-between rounded-lg bg-background/40 p-1.5 border border-border/20">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-medium text-foreground truncate">Bitcoin (BTC)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 shrink-0">+41.8%</span>
              </div>
            </div>
            {/* Allocation Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: "65%" }} />
                <div className="h-full bg-amber-500" style={{ width: "25%" }} />
                <div className="h-full bg-emerald-500" style={{ width: "10%" }} />
              </div>
              <div className="flex justify-between text-[8px] text-muted-foreground font-mono">
                <span>Equities 65%</span>
                <span>Crypto 25%</span>
                <span>Cash 10%</span>
              </div>
            </div>
          </div>
        </FeatureCard>

      </div>
    </section>
  )
}