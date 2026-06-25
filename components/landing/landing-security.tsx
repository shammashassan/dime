"use client"

import React, { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(ScrollTrigger)

export function LandingSecurity() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftContentRef = useRef<HTMLDivElement>(null)
  const rightCardRef = useRef<HTMLDivElement>(null)
  const lockIconRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // ── Left heading: clip wipe ───────────────────────────────────
    gsap.fromTo(
      ".security-heading",
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.1, ease: "expo.out",
        scrollTrigger: {
          trigger: leftContentRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    )

    // ── Left body text + items ───────────────────────────────────
    gsap.fromTo(
      ".security-body",
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: leftContentRef.current, start: "top 78%", toggleActions: "play none none none" },
      }
    )

    const items = leftContentRef.current?.querySelectorAll(".security-item")
    if (items) {
      gsap.fromTo(
        items,
        { autoAlpha: 0, x: -18 },
        {
          autoAlpha: 1, x: 0,
          duration: 0.6, stagger: 0.1, ease: "power3.out",
          scrollTrigger: {
            trigger: leftContentRef.current?.querySelector(".security-list"),
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      )
    }

    // ── Right card entrance ──────────────────────────────────────
    gsap.fromTo(
      rightCardRef.current,
      { autoAlpha: 0, y: 50, scale: 0.95 },
      {
        autoAlpha: 1, y: 0, scale: 1,
        duration: 1.1, ease: "expo.out",
        scrollTrigger: {
          trigger: rightCardRef.current,
          start: "top 78%",
          toggleActions: "play none none none",
        },
      }
    )

    // ── Lock icon heartbeat ──────────────────────────────────────
    gsap.fromTo(
      lockIconRef.current,
      { scale: 0.95 },
      { scale: 1.04, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" }
    )

  }, { scope: containerRef })

  // ── Card 3D tilt on mouse move ───────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = rightCardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.04
    const y = (e.clientY - rect.top - rect.height / 2) * 0.04
    gsap.to(card, { rotateX: -y, rotateY: x, transformPerspective: 1000, duration: 0.35, ease: "power2.out" })
  }

  const handleMouseLeave = () => {
    gsap.to(rightCardRef.current, { rotateX: 0, rotateY: 0, duration: 0.65, ease: "power3.out" })
  }

  const handleLockHover = () => {
    gsap.to(lockIconRef.current, { rotate: 360, duration: 0.7, ease: "back.out(1.5)", overwrite: "auto" })
  }

  const handleLockLeave = () => {
    gsap.to(lockIconRef.current, { rotate: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" })
  }

  return (
    <section
      id="security"
      ref={containerRef}
      className="bg-muted/20 py-24 sm:py-32 border-y border-border/20 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:items-center">

          {/* ── Left content ────────────────────────────────────── */}
          <div ref={leftContentRef} className="flex flex-col gap-6 text-left">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              <span className="security-heading block">
                Invite-only access. Full self-host capability.
              </span>
            </h2>
            <p className="security-body text-muted-foreground text-lg leading-relaxed" style={{ opacity: 0 }}>
              Dime is designed for absolute privacy. New registrations are held in a secure pending queue awaiting
              administrator approval. With a native MongoDB driver and passkey logins, your account and transactions
              are guarded under strict authorization guidelines.
            </p>

            <div className="security-list flex flex-col gap-4 mt-2">
              {[
                { n: "1", label: "WebAuthn Biometric Passkeys (FIDO2)" },
                { n: "2", label: "Time-Based OTP (TOTP) & Backup Keys" },
                { n: "3", label: "Audit Impersonation Protection Alerts" },
              ].map(({ n, label }) => (
                <div key={n} className="security-item flex items-center gap-3" style={{ opacity: 0 }}>
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-xs font-bold">{n}</span>
                  </div>
                  <span className="text-base font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right card ──────────────────────────────────────── */}
          <div
            className="w-full flex justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <Card
              ref={rightCardRef}
              className="relative aspect-auto min-h-[380px] w-full max-w-md md:aspect-square rounded-[2.5rem]
                border border-border/50 bg-background shadow-2xl flex flex-col justify-center items-center
                overflow-hidden transform-gpu"
              style={{ opacity: 0 }}
            >
              <CardContent className="p-8 flex flex-col justify-center items-center gap-6 w-full">
                <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent pointer-events-none" />

                {/* Lock icon */}
                <div
                  ref={lockIconRef}
                  onMouseEnter={handleLockHover}
                  onMouseLeave={handleLockLeave}
                  className="relative z-10 size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20 cursor-pointer select-none"
                >
                  <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <div className="relative z-10 text-center max-w-sm">
                  <h4 className="text-xl font-bold">Ready to take control?</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Register a new account or sign in with your active credentials to access your dashboards.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-2">
                  <Button asChild variant="outline" size="lg" className="w-full sm:flex-1 rounded-full font-semibold bg-input/30 hover:bg-input/50 cursor-pointer">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild size="lg" className="w-full sm:flex-1 rounded-full font-semibold shadow-md shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
                    <Link href="/sign-up">Register</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  )
}