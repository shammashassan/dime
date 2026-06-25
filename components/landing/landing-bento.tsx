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
        hover:shadow-md transition-all hover:bg-card/75 hover:-translate-y-1
        flex flex-col justify-between ${className}`}
    >
      <div className="absolute inset-0 bg-linear-to-tr from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="p-8 pb-0 gap-0">
        <div className="flex justify-between items-start mb-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">
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
            transition-all group-hover:bg-muted/40 flex-1 min-h-[120px] flex flex-col justify-center">
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

    // Currency pills
    gsap.fromTo(
      ".bento-currency-pill",
      { autoAlpha: 0, scale: 0.75, y: 8 },
      {
        autoAlpha: 1, scale: 1, y: 0,
        duration: 0.55, stagger: 0.1, ease: "back.out(1.5)",
        scrollTrigger: { trigger: ".bento-currency-pill", start: "top 90%", toggleActions: "play none none none" },
      }
    )

    // Goal progress bar
    gsap.fromTo(
      ".bento-goal-progress",
      { width: "0%" },
      {
        width: "75%",
        duration: 1.3, ease: "power2.out",
        scrollTrigger: { trigger: ".bento-goal-progress", start: "top 90%", toggleActions: "play none none none" },
      }
    )

    // Scanner sweep (infinite)
    gsap.fromTo(
      ".bento-scanner-line",
      { y: 0 },
      { y: 65, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" }
    )

    // Scanner text reveal
    gsap.fromTo(
      ".bento-scanner-text",
      { autoAlpha: 0.15, filter: "blur(1.5px)" },
      {
        autoAlpha: 1, filter: "blur(0px)",
        duration: 0.75, stagger: 0.2,
        scrollTrigger: { trigger: ".bento-scanner-text", start: "top 90%", toggleActions: "play none none none" },
      }
    )

    // Shared-account avatars
    gsap.fromTo(
      ".bento-avatar",
      { autoAlpha: 0, scale: 0.4, x: -8 },
      {
        autoAlpha: 1, scale: 1, x: 0,
        duration: 0.6, stagger: 0.15, ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".bento-avatar", start: "top 90%", toggleActions: "play none none none" },
      }
    )

    // CSV importer rows
    gsap.fromTo(
      ".bento-importer-row",
      { autoAlpha: 0, x: -14 },
      {
        autoAlpha: 1, x: 0,
        duration: 0.5, stagger: 0.12, ease: "power2.out",
        scrollTrigger: { trigger: ".bento-importer-row", start: "top 90%", toggleActions: "play none none none" },
      }
    )

    // Chart bars — scale up from bottom
    gsap.fromTo(
      ".bento-chart-bar",
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 0.85, stagger: 0.08, ease: "expo.out",
        scrollTrigger: { trigger: ".bento-chart-bar", start: "top 90%", toggleActions: "play none none none" },
      }
    )

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
          title="Shared Accounts"
          description="Collaborate with your partner or household. Safely share access to specific wallets and monitor collective expenses without sharing passwords."
          badge="Collaboration"
        >
          <div className="flex items-center gap-3 w-full justify-center">
            <div className="flex -space-x-2">
              <div className="bento-avatar size-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold shadow-xs">JD</div>
              <div className="bento-avatar size-8 rounded-full border-2 border-background bg-purple-500/20 flex items-center justify-center text-[10px] font-bold shadow-xs">AS</div>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Household Wallet</p>
              <p className="text-[10px] text-muted-foreground">Live syncing active</p>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ArrowLeftRight className="size-6" />}
          title="CSV / Bank Importer"
          description="Bulk-import transactions using a simple CSV mapping wizard. Select columns and preview validation errors before saving."
          badge="Wizard"
          className="md:col-span-2 bg-linear-to-bl from-card/20 via-card/45 to-indigo-500/5"
        >
          <div className="w-full overflow-hidden rounded-xl border border-border/20 bg-background/40 text-[10px] font-mono shadow-xs">
            <div className="bg-muted/40 px-2.5 py-1 border-b border-border/20 flex justify-between text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
              <span>CSV Column</span>
              <span>Dime Field</span>
            </div>
            <div className="p-2 space-y-1 bg-background/10">
              <div className="bento-importer-row flex justify-between items-center px-0.5">
                <span className="text-muted-foreground text-[9px]">&quot;Transaction Date&quot;</span>
                <span className="text-emerald-500 font-semibold">→ Date ✓</span>
              </div>
              <div className="bento-importer-row flex justify-between items-center px-0.5">
                <span className="text-muted-foreground text-[9px]">&quot;Payee Name&quot;</span>
                <span className="text-emerald-500 font-semibold">→ Description ✓</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* Row 3 */}
        <FeatureCard
          icon={<BarChart3 className="size-6" />}
          title="Dynamic Reports"
          description="Visualise monthly trend areas, category breakdowns, day-of-week spendings, and net-worth history. Fully interactive."
          className="md:col-span-2 bg-linear-to-tr from-card/20 via-card/45 to-purple-500/5"
        >
          <div className="flex items-end justify-between h-14 w-full gap-2 px-2">
            {[24, 36, 48, 40, 56].map((h, i) => (
              <div
                key={i}
                className="bento-chart-bar w-full rounded-t-md hover:opacity-80 transition-opacity border border-primary/10 origin-bottom transform-gpu"
                style={{
                  height: `${h}px`,
                  backgroundColor: `rgba(var(--primary), ${0.2 + i * 0.12})`,
                }}
              />
            ))}
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<Target className="size-6" />}
          title="Financial Goals"
          description="Build targets for vacations, emergency funds, or debt payoffs. Automatically allocate contributions from your wallets."
          badge="New"
        >
          <div className="space-y-2 w-full">
            <div className="flex justify-between text-xs font-semibold px-0.5">
              <span className="text-muted-foreground text-[11px]">Europe Trip</span>
              <span className="text-primary font-bold text-[11px]">75%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-background/60 p-0.5 border border-border/20 overflow-hidden">
              <div className="bento-goal-progress h-full rounded-full bg-primary" style={{ width: "0%" }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>$3,750 saved</span>
              <span>$5,000 target</span>
            </div>
          </div>
        </FeatureCard>

      </div>
    </section>
  )
}