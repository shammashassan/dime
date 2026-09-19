"use client"

import React, { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowRight, Sparkles, Wallet, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"

export function LandingHero({ startAnimation }: { startAnimation: boolean }) {
  const { data: session } = useSession()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // ── Always hide elements on mount ─────────────────────────────
    gsap.set(".hero-line", { yPercent: 110 })
    gsap.set(Array.from(cardsRef.current?.children ?? []), { autoAlpha: 0 })

    if (!startAnimation) return

    // ── Entrance timeline ──────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } })

    // ── Masked line-by-line title reveal ─────────────────────────
    tl.fromTo(
      ".hero-line",
      { yPercent: 110 },
      { yPercent: 0, duration: 1.05, stagger: 0.12, ease: "power4.out" }
    )

    // Subtitle
    tl.fromTo(
      subtitleRef.current,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.8 },
      "-=0.55"
    )

    // Buttons
    tl.fromTo(
      buttonsRef.current,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.65 },
      "-=0.5"
    )

    // Cards reveal
    tl.fromTo(
      cardsRef.current?.children ?? [],
      { autoAlpha: 0, y: 35, scale: 0.95 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, stagger: 0.12 },
      "-=0.4"
    )

    // ── Gentle float loop (subtle vertical levitation without overflow) ─
    const cards = cardsRef.current?.querySelectorAll(".floating-card") ?? []
    const floats: gsap.core.Tween[] = []

    cards.forEach((card, i) => {
      const tween = gsap.to(card, {
        y: i === 1 ? -6 : 6,
        duration: 3.2 + i * 0.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
      floats.push(tween)
    })

    return () => floats.forEach(f => f.kill())

  }, { scope: containerRef, dependencies: [startAnimation] })

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden px-4 sm:px-6 md:px-8 lg:px-12 pt-24 sm:pt-28 pb-12 sm:pb-16 text-center box-border"
    >
      {/* ── Ambient Background Glow ───────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-4 h-120 w-120 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px] dark:bg-primary/6" />
        <div className="absolute -left-20 top-1/4 h-75 w-75 rounded-full bg-indigo-500/10 blur-[75px] dark:bg-indigo-500/5" />
        <div className="absolute right-0 bottom-8 h-85 w-85 rounded-full bg-purple-500/10 blur-[85px] dark:bg-purple-500/5" />
      </div>

      {/* ── Unified Centered Wrapper (Both Text + Cards) ──────── */}
      <div className="relative z-10 mx-auto max-w-5xl w-full flex flex-col items-center justify-center gap-8 sm:gap-10 lg:gap-12 my-auto">

        {/* ── Text Zone ───────────────────────────────────────── */}
        <div className="max-w-3xl w-full mx-auto flex flex-col items-center">
          {/* Title — masked line reveal */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-3xl mx-auto">
            <span className="block overflow-hidden py-[0.06em]">
              <span className="hero-line block">
                Master your money
              </span>
            </span>
            <span className="block overflow-hidden py-[0.06em]">
              <span className="hero-line block bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                with absolute clarity.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="mt-4 sm:mt-5 max-w-2xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed px-2 sm:px-0"
            style={{ opacity: 0 }}
          >
            A beautiful, privacy-first personal finance workspace. Scan receipts with AI,
            automate rules, track subscriptions and bills, and monitor your global net worth with absolute clarity.
          </p>

          {/* CTA buttons */}
          <div
            ref={buttonsRef}
            className="mt-6 sm:mt-7 flex flex-wrap justify-center gap-3 sm:gap-4"
            style={{ opacity: 0 }}
          >
            <Button
              asChild
              size="lg"
              className="sm:h-11 sm:px-6 sm:text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Link href={session ? "/dashboard" : "/sign-up"}>
                {session ? "Go to Dashboard" : "Create Free Account"}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="sm:h-11 sm:px-6 sm:text-base font-bold hover:bg-muted/50 backdrop-blur-sm cursor-pointer transition-all"
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </div>

        {/* ── Floating Mock Cards (Direct child of centered package) ── */}
        <div
          ref={cardsRef}
          className="grid max-w-5xl w-full grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 px-2 sm:px-4 z-20 pointer-events-none select-none"
        >
        {/* Card 1 — Multi-Currency Liquid Account */}
        <Card className="floating-card rounded-2xl border border-border/50 bg-card/75 shadow-xl backdrop-blur-xl text-left transition-colors">
          <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Wallet className="size-4 sm:size-4.5" />
                </div>
                <div className="min-w-0">
                  <CardDescription className="text-[11px] font-semibold text-muted-foreground truncate">Chase Checking</CardDescription>
                  <CardTitle className="text-base sm:text-lg font-bold truncate">$24,850.00</CardTitle>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 font-mono">
                +4.2% mo
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-px bg-border/40 w-full mb-2.5" />
            <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
              <div className="flex items-center gap-2">
                <span>€12,400</span>
                <span>·</span>
                <span>£4,150</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Real-time AI OCR & Instant Split (Center Stage) */}
        <Card className="floating-card rounded-2xl border border-primary/30 bg-card/85 shadow-2xl backdrop-blur-xl text-left ring-1 ring-primary/20">
          <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 flex items-center gap-1">
                <Sparkles className="size-3" /> AI Extracted
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">99.8% Match</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <div>
                <CardDescription className="text-[11px] text-muted-foreground font-medium">Apple Fifth Avenue</CardDescription>
                <CardTitle className="text-sm sm:text-base font-bold truncate text-foreground">Hardware &amp; Tech</CardTitle>
              </div>
              <span className="text-base sm:text-lg font-bold text-red-500 font-mono">−$149.00</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/30">
              <span className="flex items-center gap-1 text-primary font-medium">
                <CheckCircle2 className="size-3 text-primary" />
                Split 50% with Sarah
              </span>
              <span className="font-mono">Auto-Categorized</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Financial Health & Runway Buffer */}
        <Card className="floating-card rounded-2xl border border-border/50 bg-card/75 shadow-xl backdrop-blur-xl text-left transition-colors">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <ShieldCheck className="size-4 sm:size-4.5" />
                </div>
                <div className="min-w-0">
                  <CardDescription className="text-[11px] font-semibold text-muted-foreground truncate">Health Score</CardDescription>
                  <CardTitle className="text-base sm:text-lg font-bold truncate">88 / 100</CardTitle>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
                Optimal
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1 mb-2 flex">
              <div className="h-full bg-emerald-500" style={{ width: "35%" }} />
              <div className="h-full bg-primary" style={{ width: "40%" }} />
              <div className="h-full bg-amber-500" style={{ width: "25%" }} />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
              <span>Runway: 8.2 mo</span>
              <span className="text-emerald-500 font-semibold">Savings: 35%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
  )
}