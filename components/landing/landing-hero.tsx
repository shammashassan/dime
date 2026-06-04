"use client"

import React, { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowRight, Sparkles, TrendingUp, DollarSign, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Initial fade in for typography
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } })

    tl.fromTo(badgeRef.current, { opacity: 0, y: 15, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 })
      .fromTo(titleRef.current, { opacity: 0, y: 35, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, "-=0.4")
      .fromTo(subtitleRef.current, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .fromTo(buttonsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
      .fromTo(cardsRef.current?.children || [], { opacity: 0, y: 40, scale: 0.85, rotateX: 15, transformPerspective: 1000 }, { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.0, stagger: 0.15 }, "-=0.5")

    // Infinite floating animations for mock cards
    let floats: gsap.core.Tween[] = []
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".floating-card")
      cards.forEach((card, idx) => {
        const tween = gsap.to(card, {
          y: idx % 2 === 0 ? -12 : 12,
          rotation: idx % 2 === 0 ? 1.5 : -1.5,
          duration: 3 + idx,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
        floats.push(tween)
      })
    }

    // Parallax mouse move setup
    const cards = cardsRef.current?.querySelectorAll(".floating-card")
    const quickToSetters = cards ? Array.from(cards).map(card => ({
      x: gsap.quickTo(card, "x", { duration: 0.6, ease: "power2.out" }),
      y: gsap.quickTo(card, "y", { duration: 0.6, ease: "power2.out" }),
    })) : []

    const handleParallax = (e: MouseEvent) => {
      const width = window.innerWidth
      const height = window.innerHeight
      const xPercent = (e.clientX - width / 2) / (width / 2) // Range -1 to 1
      const yPercent = (e.clientY - height / 2) / (height / 2) // Range -1 to 1

      quickToSetters.forEach((setters, idx) => {
        // Different cards move by different factors (staggered depth)
        const factor = (idx + 1) * 12
        setters.x(xPercent * factor)
        setters.y(yPercent * factor)
      })
    }

    window.addEventListener("mousemove", handleParallax)

    return () => {
      window.removeEventListener("mousemove", handleParallax)
      floats.forEach(f => f.kill())
    }
  }, { scope: containerRef })

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-30 pb-24 text-center lg:px-12"
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px] dark:bg-primary/5" />
        <div className="absolute -left-20 top-1/3 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/5" />
        <div className="absolute right-0 bottom-10 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[90px] dark:bg-purple-500/5" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Shiny Badge */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-4 py-1.5 text-xs font-semibold backdrop-blur-xs mb-8 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-primary animate-spin" />
            Introducing Dime v2.0 • AI Personal Finance
          </span>
        </div>

        {/* Big Title */}
        <h1
          ref={titleRef}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1] max-w-3xl mx-auto"
        >
          Master your money
          <br />
          <span className="bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            with absolute clarity.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed"
        >
          A beautiful, security-first expense tracker. Track multi-currency wallets, monitor budgets, scan receipts with AI, and collaborate with shared accounts.
        </p>

        {/* Buttons */}
        <div
          ref={buttonsRef}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Button asChild size="xl" className="font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer">
            <Link href="/sign-up">
              Create Free Account
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="font-bold transition-all hover:bg-muted/50 backdrop-blur-xs cursor-pointer">
            <Link href="#features">
              Explore Features
            </Link>
          </Button>
        </div>
      </div>

      {/* Floating Mock Cards Area */}
      <div
        ref={cardsRef}
        className="relative mx-auto mt-20 grid max-w-5xl w-full grid-cols-1 gap-6 sm:grid-cols-3 px-4 z-20 pointer-events-none select-none"
      >
        {/* Card 1: Balance Wallet */}
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

        {/* Card 2: AI Transaction scan */}
        <Card className="floating-card rounded-2xl border border-border/50 bg-card/65 shadow-xl backdrop-blur-md text-left">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 flex items-center gap-1">
                <Sparkles className="size-3 animate-spin" /> AI Extracted
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
              <span className="text-lg font-bold text-red-500">-$14.50</span>
              <span className="text-xs px-2 py-0.5 rounded bg-muted/60 font-medium">Food & Dining</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Budget progress */}
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
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "95%" }}></div>
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
