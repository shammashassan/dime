"use client"

import React, { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger)

export function LandingSecurity() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftContentRef = useRef<HTMLDivElement>(null)
  const rightCardRef = useRef<HTMLDivElement>(null)
  const lockIconRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // 1. Entrance animation for the whole section
    const ctx = gsap.context(() => {
      // Left side text stagger entrance
      gsap.fromTo(
        leftContentRef.current?.children || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: leftContentRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      )

      // Individual stagger animation for the check list items
      const listItems = leftContentRef.current?.querySelectorAll(".security-item")
      if (listItems) {
        gsap.fromTo(
          listItems,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: leftContentRef.current?.querySelector(".security-list"),
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        )
      }

      // Right side Card entrance with a slight 3D rotation reveal
      gsap.fromTo(
        rightCardRef.current,
        { opacity: 0, y: 50, rotateY: -15, transformPerspective: 1000 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: rightCardRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      )

      // Lock SVG rotation heartbeat loop
      gsap.fromTo(
        lockIconRef.current,
        { scale: 0.95 },
        {
          scale: 1.05,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  // Interactive mouse move tilt effect for the card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = rightCardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    // Rotate card slightly based on mouse position relative to center
    gsap.to(card, {
      rotateX: -y * 0.05,
      rotateY: x * 0.05,
      transformPerspective: 1000,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  const handleMouseLeave = () => {
    const card = rightCardRef.current
    if (!card) return
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: "power3.out",
    })
  }

  // Spin lock on hover
  const handleLockHover = () => {
    gsap.to(lockIconRef.current, {
      rotate: 360,
      duration: 0.8,
      ease: "back.out(1.5)",
      overwrite: "auto",
    })
  }

  const handleLockLeave = () => {
    gsap.to(lockIconRef.current, {
      rotate: 0,
      duration: 0.6,
      ease: "power2.out",
      overwrite: "auto",
    })
  }

  return (
    <section
      id="security"
      ref={containerRef}
      className="bg-muted/20 py-24 sm:py-32 border-y border-border/20 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:items-center">
          
          {/* Left side info */}
          <div ref={leftContentRef} className="flex flex-col gap-6 text-left">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Invite-only access. Full self-host capability.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Dime is designed for absolute privacy. New registrations are held in a secure pending queue awaiting administrator approval. With a native MongoDB driver and passkey logins, your account and transactions are guarded under strict authorization guidelines.
            </p>
            <div className="security-list flex flex-col gap-4 mt-2">
              <div className="security-item flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xs font-bold">1</span>
                </div>
                <span className="text-base font-semibold">WebAuthn Biometric Passkeys (FIDO2)</span>
              </div>
              <div className="security-item flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xs font-bold">2</span>
                </div>
                <span className="text-base font-semibold">Time-Based OTP (TOTP) & Backup Keys</span>
              </div>
              <div className="security-item flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xs font-bold">3</span>
                </div>
                <span className="text-base font-semibold">Audit Impersonation Protection Alerts</span>
              </div>
            </div>
          </div>

          {/* Right side Card */}
          <div
            className="w-full flex justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <Card
              ref={rightCardRef}
              className="relative aspect-auto min-h-[380px] w-full max-w-md md:aspect-square rounded-[2.5rem] border border-border/50 bg-background shadow-2xl flex flex-col justify-center items-center overflow-hidden transform-gpu"
            >
              <CardContent className="p-8 flex flex-col justify-center items-center gap-6 w-full">
                <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent pointer-events-none" />
                <div
                  ref={lockIconRef}
                  onMouseEnter={handleLockHover}
                  onMouseLeave={handleLockLeave}
                  className="relative z-10 size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20 cursor-pointer select-none"
                >
                  <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                    <Link href="/sign-in">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="w-full sm:flex-1 rounded-full font-semibold shadow-md shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
                    <Link href="/sign-up">
                      Register
                    </Link>
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
