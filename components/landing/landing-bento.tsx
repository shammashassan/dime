"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Coins,
  Target,
  Sparkles,
  Users,
  BarChart3,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  LineChart,
  Handshake,
  Repeat,
  Scissors,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
        flex flex-col justify-between ${className}`}
    >
      <div className="absolute inset-0 bg-linear-to-tr from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="p-8 pb-0 gap-0">
        <div className="flex justify-between items-start mb-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30">
              {badge}
            </span>
          )}
        </div>
        <CardTitle className="text-xl font-bold tracking-tight mb-2 text-foreground">{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-8 pt-0 pb-8 flex-1 flex flex-col justify-end">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">{description}</CardDescription>
        {children && (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/20 bg-muted/20 p-4
            transition-colors duration-300 group-hover:bg-muted/40 flex-1 min-h-30 flex flex-col justify-center">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function LandingBento() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // ── Hide everything immediately on mount ─────────────────────
    // Cards must be invisible from first paint so the scroll reveal
    // animates them in from nothing, not re-animates already-visible cards.
    gsap.set(".bento-card", { autoAlpha: 0, y: 55, scale: 0.94 })
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
          duration: 1.15,
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
          duration: 0.9,
          stagger: 0.1,
          ease: "expo.out",
          overwrite: true,
        }),
    })

    // ── Micro-animations (fire once on scroll) ──────────────────
    const hasEl = (selector: string) => Boolean(containerRef.current?.querySelector(selector))

    // Currency pills
    if (hasEl(".bento-currency-pill")) {
      gsap.fromTo(
        ".bento-currency-pill",
        { autoAlpha: 0, scale: 0.75, y: 8 },
        {
          autoAlpha: 1, scale: 1, y: 0,
          duration: 0.55, stagger: 0.1, ease: "back.out(1.5)",
          scrollTrigger: { trigger: ".bento-currency-pill", start: "top 90%", toggleActions: "play none none none" },
        }
      )
    }

    // Goal progress bar
    if (hasEl(".bento-goal-progress")) {
      gsap.fromTo(
        ".bento-goal-progress",
        { width: "0%" },
        {
          width: "75%",
          duration: 1.3, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-goal-progress", start: "top 90%", toggleActions: "play none none none" },
        }
      )
    }

    // Scanner sweep (infinite)
    if (hasEl(".bento-scanner-line")) {
      gsap.fromTo(
        ".bento-scanner-line",
        { y: 0 },
        { y: 65, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" }
      )
    }

    // Scanner text reveal
    if (hasEl(".bento-scanner-text")) {
      gsap.fromTo(
        ".bento-scanner-text",
        { autoAlpha: 0.15, filter: "blur(1.5px)" },
        {
          autoAlpha: 1, filter: "blur(0px)",
          duration: 0.75, stagger: 0.2,
          scrollTrigger: { trigger: ".bento-scanner-text", start: "top 90%", toggleActions: "play none none none" },
        }
      )
    }

    // Shared-account avatars
    if (hasEl(".bento-avatar")) {
      gsap.fromTo(
        ".bento-avatar",
        { autoAlpha: 0, scale: 0.4, x: -8 },
        {
          autoAlpha: 1, scale: 1, x: 0,
          duration: 0.6, stagger: 0.15, ease: "back.out(1.7)",
          scrollTrigger: { trigger: ".bento-avatar", start: "top 90%", toggleActions: "play none none none" },
        }
      )
    }

    // CSV importer rows
    if (hasEl(".bento-importer-row")) {
      gsap.fromTo(
        ".bento-importer-row",
        { autoAlpha: 0, x: -14 },
        {
          autoAlpha: 1, x: 0,
          duration: 0.5, stagger: 0.12, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-importer-row", start: "top 90%", toggleActions: "play none none none" },
        }
      )
    }

    // Chart bars
    if (hasEl(".bento-chart-bar")) {
      gsap.fromTo(
        ".bento-chart-bar",
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.85, stagger: 0.08, ease: "expo.out",
          scrollTrigger: { trigger: ".bento-chart-bar", start: "top 90%", toggleActions: "play none none none" },
        }
      )
    }

    // Rules Engine Trigger
    if (hasEl(".bento-rule-trigger")) {
      gsap.fromTo(
        ".bento-rule-trigger",
        { autoAlpha: 0, y: -5 },
        {
          autoAlpha: 1, y: 0,
          duration: 0.5,
          scrollTrigger: { trigger: ".bento-rule-trigger", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Rules Engine Actions
    if (hasEl(".bento-rule-action")) {
      gsap.fromTo(
        ".bento-rule-action",
        { autoAlpha: 0, scale: 0.9 },
        {
          autoAlpha: 1, scale: 1,
          duration: 0.6, stagger: 0.15, ease: "back.out(1.4)",
          scrollTrigger: { trigger: ".bento-rule-action", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Net Worth Chart Line & Area
    if (hasEl(".bento-networth-line")) {
      gsap.fromTo(
        ".bento-networth-line",
        { strokeDashoffset: 400 },
        {
          strokeDashoffset: 0,
          duration: 1.5,
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
          delay: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bento-networth-area", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Loan Progress Bar
    if (hasEl(".bento-loan-progress")) {
      gsap.fromTo(
        ".bento-loan-progress",
        { width: "0%" },
        {
          width: "33.3%",
          duration: 1.2, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-loan-progress", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Recurring Items
    if (hasEl(".bento-recurring-item")) {
      gsap.fromTo(
        ".bento-recurring-item",
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1, y: 0,
          duration: 0.6, stagger: 0.12, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-recurring-item", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

    // Split Items
    if (hasEl(".bento-split-item")) {
      gsap.fromTo(
        ".bento-split-item",
        { autoAlpha: 0, x: -10 },
        {
          autoAlpha: 1, x: 0,
          duration: 0.5, stagger: 0.15, ease: "power2.out",
          scrollTrigger: { trigger: ".bento-split-item", start: "top 90%", toggleActions: "play none none none" }
        }
      )
    }

  }, { scope: containerRef })

  return (
    <section id="features" ref={containerRef} className="mx-auto max-w-6xl px-6 py-24 sm:py-32">

      {/* ── Section heading ──────────────────────────────────────── */}
      <div ref={headingRef} className="mb-20 text-center">
        <div className="bento-eyebrow inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm mb-4" style={{ opacity: 0 }}>
          <ShieldCheck className="size-3.5 text-primary" />
          Production-Ready & Secure
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="reveal-heading block">Everything you need.</span>
        </h2>
        <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground reveal-heading">
          Dime combines simple logging with advanced automation to give you absolute control over your global net worth.
        </p>
      </div>

      {/* ── Bento grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Row 1 */}
        <FeatureCard
          icon={<Sparkles className="size-6" />}
          title="AI Receipt Scanner"
          description="Drag-and-drop receipts to extract vendors, categories, dates, and amounts automatically. Powered by Gemini OCR models."
          badge="AI Powered"
          className="md:col-span-2 bg-linear-to-br from-card/20 via-card/45 to-primary/5"
        >
          <div className="w-full relative overflow-hidden rounded-xl border border-border/20 bg-background/40 p-3 shadow-xs">
            <div className="bento-scanner-line absolute top-0 left-0 right-0 h-[1.5px] bg-primary/40 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <div className="space-y-1.5 text-[11px]">
              <div className="bento-scanner-text flex justify-between font-mono">
                <span className="text-muted-foreground text-[10px]">VENDOR:</span>
                <span className="font-semibold text-foreground">Starbucks Coffee</span>
              </div>
              <div className="bento-scanner-text flex justify-between font-mono">
                <span className="text-muted-foreground text-[10px]">TOTAL:</span>
                <span className="font-semibold text-primary">$12.50</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<Coins className="size-6" />}
          title="Multi-Currency Wallets"
          description="Support per-wallet currencies. Live exchange rates updated hourly and cached inside your local MongoDB database for instantaneous conversion."
        >
          <div className="flex flex-wrap gap-2.5 justify-center w-full">
            <div className="bento-currency-pill rounded-xl border border-border/20 bg-background/40 p-2 flex items-center gap-2 shadow-xs">
              <span className="text-xs font-bold">USD</span>
              <span className="text-[11px] text-muted-foreground">$1,250.00</span>
            </div>
            <div className="bento-currency-pill rounded-xl border border-border/20 bg-background/40 p-2 flex items-center gap-2 shadow-xs">
              <span className="text-xs font-bold">EUR</span>
              <span className="text-[11px] text-muted-foreground">€1,150.00</span>
            </div>
          </div>
        </FeatureCard>

        {/* Row 2 */}
        <FeatureCard
          icon={<Users className="size-6" />}
          title="Shared Budgeting (Spaces)"
          description="Collaborate with your partner or household. Safely share access to organization spaces and track joint categories in real-time."
          badge="Collaboration"
        >
          <div className="flex items-center gap-3 w-full justify-center">
            <div className="flex -space-x-2">
              <div className="bento-avatar size-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold shadow-xs">JD</div>
              <div className="bento-avatar size-8 rounded-full border-2 border-background bg-purple-500/20 flex items-center justify-center text-[10px] font-bold shadow-xs">AS</div>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Household Workspace</p>
              <p className="text-[10px] text-muted-foreground">Sync active</p>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<Zap className="size-6" />}
          title="Automation Rules Engine"
          description="Define triggers based on merchant names, wallets, or amounts to automatically categorize and tag transactions as they arrive."
          badge="Automation"
        >
          <div className="w-full relative overflow-hidden rounded-xl border border-border/20 bg-background/40 p-2.5 shadow-xs">
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="bento-rule-trigger flex items-center justify-between border-b border-border/10 pb-1">
                <span className="text-muted-foreground text-[9px]">IF MERCHANT:</span>
                <span className="font-semibold text-foreground">&quot;Uber&quot;</span>
              </div>
              <div className="bento-rule-action bg-primary/10 border border-primary/20 rounded-md p-1 text-center">
                <span className="text-primary text-[9px] font-bold">Category → Transport</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<LineChart className="size-6" />}
          title="Net Worth Dashboard"
          description="Real-time asset valuation tracker. Aggregate your bank balances, savings, real estate, and loans into a single view."
          badge="Overview"
        >
          <div className="w-full h-16 relative flex items-end">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 150 48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(var(--primary), 0.35)" />
                  <stop offset="100%" stopColor="rgba(var(--primary), 0)" />
                </linearGradient>
              </defs>
              <path
                className="bento-networth-area"
                d="M0 48 L0 32 Q25 15 50 28 T100 10 T150 4 L150 48 Z"
                fill="url(#netWorthGrad)"
              />
              <path
                className="bento-networth-line"
                d="M0 32 Q25 15 50 28 T100 10 T150 4"
                fill="none"
                stroke="rgba(var(--primary), 1)"
                strokeWidth="2.5"
                strokeDasharray="200"
                strokeDashoffset="200"
              />
            </svg>
            <div className="absolute top-0.5 left-1 flex flex-col text-left">
              <span className="text-[8px] text-muted-foreground uppercase font-mono tracking-wider">Net Worth</span>
              <span className="text-xs font-bold text-foreground">$316K</span>
            </div>
          </div>
        </FeatureCard>

      </div>
    </section>
  )
}