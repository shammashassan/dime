"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  CheckCircle,
  Scissors,
  Handshake,
  Repeat,
  Target,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const dimeModules = [
  { id: "split", title: "Transaction Splitting", desc: "Split transaction records into multiple categories & tags.", icon: Scissors },
  { id: "loans", title: "Loans & Lending", desc: "Track personal lending, debts, and interest rates with contacts.", icon: Handshake },
  { id: "recurring", title: "Recurring Platform", desc: "Manage recurring bills, subscriptions, and income schedules.", icon: Repeat },
  { id: "goals", title: "Financial Goals", desc: "Define targets for savings or emergency funds and track progress.", icon: Target },
  { id: "importer", title: "CSV / Bank Importer", desc: "Import transactions in bulk using our column mapping wizard.", icon: ArrowLeftRight },
  { id: "reports", title: "Dynamic Reports", desc: "Inspect monthly trend lines, category breakdowns, and analytics.", icon: BarChart3 },
]

export function LandingWhy() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftContentRef = useRef<HTMLDivElement>(null)
  const rightCardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Hide initially
    gsap.set(".why-reveal-item", { autoAlpha: 0, y: 35 })
    gsap.set(".module-card-reveal", { autoAlpha: 0, y: 35 })

    // Reveal left section
    gsap.fromTo(
      ".why-reveal-item",
      { autoAlpha: 0, y: 35 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: leftContentRef.current,
          start: "top 80%",
          once: true,
        },
      }
    )

    // Reveal right cards
    gsap.fromTo(
      ".module-card-reveal",
      { autoAlpha: 0, y: 35 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rightCardRef.current,
          start: "top 85%",
          once: true,
        },
      }
    )
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="why-trigger bg-muted/20 py-24 sm:py-32 border-y border-border/20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column */}
          <div ref={leftContentRef} className="flex flex-col gap-6 text-left">
            <h2 className="why-reveal-item text-3xl font-extrabold tracking-tight sm:text-5xl">
              Ledger clarity over spreadsheet chaos.
            </h2>
            <p className="why-reveal-item text-lg leading-relaxed text-muted-foreground">
              Traditional budget apps keep you locked in manual logs and messy sheets. Dime shifts the focus to structural clarity: isolated workspaces, automation rule overrides, and contact-linked debt books designed for your mental model.
            </p>
            <div className="why-reveal-item grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {[
                "Isolated organization spaces",
                "Biometric passkey sign-ins",
                "Advanced transaction splitting",
                "Hourly exchange rate caching",
                "Protected Cron automation logs",
                "Self-ownership data export",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="size-5 text-primary shrink-0" />
                  <span className="text-base font-semibold text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div
            ref={rightCardRef}
            className="relative rounded-[2.5rem] border bg-background p-6 lg:p-8 shadow-2xl overflow-hidden group w-full border-border/50"
          >
            <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent pointer-events-none" />
            <div className="relative flex flex-col justify-center gap-4 z-10">
              {dimeModules.map((module) => {
                const Icon = module.icon
                return (
                  <div
                    key={module.id}
                    className="module-card-reveal flex items-center gap-4 rounded-2xl border border-border/40 bg-muted/40 p-3.5 sm:p-4 transition-[background-color,transform] duration-300 hover:bg-muted/80 hover:translate-x-2"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-xs ring-1 ring-border/20">
                      <Icon className="size-6" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h3 className="truncate text-base font-bold text-foreground">{module.title}</h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground mt-0.5">{module.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
