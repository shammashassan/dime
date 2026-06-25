"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Inbox, Cpu, Layers } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const workflowSteps = [
  {
    step: "01",
    icon: <Inbox className="size-6 text-primary" />,
    title: "Capture",
    description: "Instantly intake transaction records from drag-and-drop receipt scans, bank CSV files, or immediate manual logging.",
  },
  {
    step: "02",
    icon: <Cpu className="size-6 text-purple-500" />,
    title: "Process",
    description: "Gemini AI models automatically extract vendor details, classify categories, match exchange rates, and flag anomalies.",
  },
  {
    step: "03",
    icon: <Layers className="size-6 text-indigo-500" />,
    title: "Retrieve",
    description: "Instantly build dashboard report views, inspect monthly trend vectors, and export sanitized net-worth audit histories.",
  },
]

export function LandingWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<SVGSVGElement>(null)

  useGSAP(() => {
    // ── Hide everything on mount ─────────────────────────────────
    gsap.set(".workflow-card", { autoAlpha: 0, y: 40, scale: 0.95 })
    gsap.set(".workflow-eyebrow", { autoAlpha: 0, y: 10 })
    gsap.set(".workflow-heading", { clipPath: "inset(0 100% 0 0)" })
    gsap.set(".step-num", { autoAlpha: 0, scale: 1.4 })
    // ── Eyebrow + heading clip wipe ──────────────────────────────
    gsap.fromTo(
      ".workflow-eyebrow",
      { autoAlpha: 0, y: 10 },
      {
        autoAlpha: 1, y: 0, duration: 0.65, ease: "power3.out",
        scrollTrigger: { trigger: ".workflow-heading-zone", start: "top 83%", toggleActions: "play none none none" },
      }
    )

    gsap.fromTo(
      ".workflow-heading",
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "expo.out",
        scrollTrigger: { trigger: ".workflow-heading-zone", start: "top 80%", toggleActions: "play none none none" },
      }
    )

    // ── Cards: staggered sequential entrance ─────────────────────
    const cards = containerRef.current?.querySelectorAll(".workflow-card")
    if (cards) {
      gsap.to(cards, {
        autoAlpha: 1, y: 0, scale: 1,
        duration: 0.9,
        stagger: 0.18,
        ease: "expo.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 78%",
          toggleActions: "play none none none",
          once: true,
        },
      })
    }

    // ── SVG connector lines: draw left → right ───────────────────
    const lines = connectorRef.current?.querySelectorAll(".connector-line")
    if (lines) {
      lines.forEach((line) => {
        const length = (line as SVGLineElement).getTotalLength?.() ?? 120
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
      })

      gsap.to(lines, {
        strokeDashoffset: 0,
        duration: 0.7,
        stagger: 0.22,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 76%",
          toggleActions: "play none none none",
        },
      })
    }

    // ── Step number count-up glow ────────────────────────────────
    gsap.to(".step-num", {
      autoAlpha: 1, scale: 1,
      duration: 0.6, stagger: 0.18, ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 78%",
        toggleActions: "play none none none",
        once: true,
      },
    })

  }, { scope: containerRef })

  return (
    <section id="workflow" ref={containerRef} className="mx-auto max-w-6xl px-6 py-24 sm:py-32">

      {/* ── Heading ──────────────────────────────────────────────── */}
      <div className="workflow-heading-zone mb-20 text-center">
        <div
          className="workflow-eyebrow inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm mb-4"
          style={{ opacity: 0 }}
        >
          Core Operational Loop
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          <span className="workflow-heading block">The Dime Workflow.</span>
        </h2>
        <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
          Dime simplifies financial management into a clean, automated operational cycle.
        </p>
      </div>

      {/* ── Cards + SVG connector overlay ───────────────────────── */}
      <div className="relative">
        {/* SVG connector lines — desktop only, absolutely positioned */}
        <svg
          ref={connectorRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden md:block w-full h-full overflow-visible"
          style={{ top: 0, left: 0 }}
        >
          {/*
            Two lines connecting card centers.
            Positioned at ~33% and ~66% across, vertically centred at ~50%.
            These are approximate; they visually align with the gap between cards.
          */}
          <line
            className="connector-line"
            x1="33.5%" y1="50%"
            x2="34.5%" y2="50%"
            stroke="rgba(var(--primary), 0.4)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
          <line
            className="connector-line"
            x1="66.5%" y1="50%"
            x2="67.5%" y2="50%"
            stroke="rgba(var(--primary), 0.4)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {workflowSteps.map((item, idx) => (
            <div
              key={idx}
              className="workflow-card group relative p-8 rounded-3xl border border-border/40 bg-card/45
                backdrop-blur-sm flex flex-col justify-between min-h-[250px]
                transition-all hover:bg-card/75 hover:border-border/80 hover:-translate-y-1"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/65 shadow-xs">
                    {item.icon}
                  </div>
                  <span
                    className="step-num font-mono text-2xl font-black text-muted-foreground/25 tabular-nums"
                    style={{ opacity: 0 }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              {/* Bottom accent line that grows on hover */}
              <div className="mt-6 h-px w-0 bg-primary/30 group-hover:w-full transition-all duration-500 ease-out" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}