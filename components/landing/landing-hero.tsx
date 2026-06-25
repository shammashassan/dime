"use client"

import React, { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowRight, Sparkles, TrendingUp, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LandingHero({ startAnimation }: { startAnimation: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // ── Always hide elements on mount ─────────────────────────────
    // This runs before startAnimation is true, ensuring nothing is
    // visible while the preloader curtain is still covering the page.
    gsap.set(".hero-line", { yPercent: 110 })           // clipped by overflow-hidden parent
    gsap.set(Array.from(cardsRef.current?.children ?? []), { autoAlpha: 0 })
    // badge / subtitle / buttons already start at opacity:0 via inline style

    if (!startAnimation) return

    // ── Entrance timeline ──────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } })

    // Badge fades + rises
    tl.fromTo(
      badgeRef.current,
      { autoAlpha: 0, y: 16, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.65 }
    )

    // ── Masked line-by-line title reveal ─────────────────────────
    // .hero-line elements live inside overflow-hidden parent spans,
    // so sliding them from yPercent:110 creates a clean "rise from below" wipe.
    tl.fromTo(
      ".hero-line",
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, stagger: 0.12, ease: "power4.out" },
      "-=0.45"
    )

    // Subtitle
    tl.fromTo(
      subtitleRef.current,
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 0.85 },
      "-=0.6"
    )

    // Buttons
    tl.fromTo(
      buttonsRef.current,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.7 },
      "-=0.55"
    )

    // Cards reveal — clip-path wipe from bottom + subtle scale
    tl.fromTo(
      cardsRef.current?.children ?? [],
      { autoAlpha: 0, y: 50, scale: 0.92 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 1.05, stagger: 0.13 },
      "-=0.45"
    )

    // ── Gentle float loop ────────────────────────────────────────
    const cards = cardsRef.current?.querySelectorAll(".floating-card") ?? []
    const floats: gsap.core.Tween[] = []

    cards.forEach((card, i) => {
      const tween = gsap.to(card, {
        y: i % 2 === 0 ? -10 : 10,
        rotation: i % 2 === 0 ? 1 : -1,
        duration: 3.5 + i * 0.7,
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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-24 text-center lg:px-12"
    >
      {/* ── Background blobs ──────────────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px] dark:bg-primary/6" />
        <div className="absolute -left-20 top-1/3 h-[340px] w-[340px] rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/5" />
        <div className="absolute right-0 bottom-10 h-[380px] w-[380px] rounded-full bg-purple-500/10 blur-[90px] dark:bg-purple-500/5" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">

        {/* ── Badge ─────────────────────────────────────────── */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm mb-8 shadow-sm"
          style={{ opacity: 0 }}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            Introducing Dime v2.0 · AI Personal Finance
          </span>
        </div>

        {/* ── Title — masked line reveal ─────────────────────── */}
        {/*
          Each line is wrapped in overflow-hidden so the
          .hero-line slides in from beneath without clipping siblings.
        */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1] max-w-3xl mx-auto">
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

        {/* ── Subtitle ─────────────────────────────────────── */}
        <p
          ref={subtitleRef}
          className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed"
          style={{ opacity: 0 }}
        >
          A beautiful, security-first expense tracker. Track multi-currency wallets, monitor budgets,
          scan receipts with AI, and collaborate with shared accounts.
        </p>

        {/* ── CTA buttons ──────────────────────────────────── */}
        <div
          ref={buttonsRef}
          className="mt-10 flex flex-wrap justify-center gap-4"
          style={{ opacity: 0 }}
        >
          <Button
            asChild
            size="xl"
            className="font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Link href="/sign-up">
              Create Free Account
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            asChild
            size="xl"
            variant="outline"
            className="font-bold hover:bg-muted/50 backdrop-blur-sm cursor-pointer transition-all"
          >
            <Link href="#features">Explore Features</Link>
          </Button>
        </div>
      </div>

      {/* ── Floating mock cards ───────────────────────────── */}
      <div
        ref={cardsRef}
        className="relative mx-auto mt-20 grid max-w-5xl w-full grid-cols-1 gap-6 sm:grid-cols-3 px-4 z-20 pointer-events-none select-none"
      >
        {/* Card 1 — Wallet balance */}
        <Card className="floating-card rounded-2xl border border-border/50 bg-card/65 shadow-xl backdrop-blur-md text-left">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Wallet className="size-5" />
              </div>
              <div>
                <CardDescription className="text-xs font-semibold text-muted-foreground">Savings Wallet</CardDescription>
                <CardTitle className="text-lg font-bold">€8,420.50</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-px bg-border/40 w-full mb-4" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Base currency</span>
              <span className="font-semibold px-2 py-0.5 rounded bg-muted/60">EUR</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — AI scan */}
        <Card className="floating-card rounded-2xl border border-border/50 bg-card/65 shadow-xl backdrop-blur-md text-left">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 flex items-center gap-1">
                <Sparkles className="size-3" /> AI Extracted
              </span>
              <span className="text-xs text-muted-foreground">Just now</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 flex flex-col gap-2">
            <div>
              <CardDescription className="text-xs text-muted-foreground font-semibold">Merchant</CardDescription>
              <CardTitle className="text-base font-bold">Starbucks Coffee</CardTitle>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-bold text-red-500">−$14.50</span>
              <span className="text-xs px-2 py-0.5 rounded bg-muted/60 font-medium">Food & Dining</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Budget */}
        <Card className="floating-card rounded-2xl border border-border/50 bg-card/65 shadow-xl backdrop-blur-md text-left">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <CardDescription className="text-xs font-semibold text-muted-foreground">Monthly Shopping</CardDescription>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <CardTitle className="text-base font-bold">$380.00</CardTitle>
                  <span className="text-xs text-muted-foreground">/ $400.00</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "95%" }} />
            </div>
            <div className="flex justify-between items-center text-[10px] text-amber-500 font-semibold mt-2">
              <span>95% limit reached</span>
              <span>Threshold Alert</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}