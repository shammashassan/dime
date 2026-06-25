"use client"

import React, { useEffect, useState, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Sparkles } from "lucide-react"

interface PreloaderProps {
  onExitStart: () => void
  onComplete: () => void
}

export function Preloader({ onExitStart, onComplete }: PreloaderProps) {
  const [shouldRender, setShouldRender] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const curtainRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const progressFillRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const hasShown = sessionStorage.getItem("dime_preloader_shown")
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (hasShown === "true" || prefersReducedMotion) {
      onExitStart()
      onComplete()
      setShouldRender(false)
      return
    }

    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [onExitStart, onComplete])

  useGSAP(() => {
    if (!shouldRender || !containerRef.current) return

    // ── Ring setup ──────────────────────────────────────────────────
    const RADIUS = 42
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ≈ 263.9

    gsap.set(ringRef.current, {
      strokeDasharray: CIRCUMFERENCE,
      strokeDashoffset: CIRCUMFERENCE,
    })

    // ── Brand mark entrance ──────────────────────────────────────────
    gsap.fromTo(
      brandRef.current,
      { autoAlpha: 0, scale: 0.88, y: 10 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.15 }
    )

    // ── Master progress timeline ─────────────────────────────────────
    const counterObj = { n: 0 }

    const tl = gsap.timeline({ defaults: { ease: "none" } })

    // Run all three progress indicators in sync for 2.5 s
    tl.to(counterObj, {
      n: 100,
      duration: 2.5,
      ease: "power1.inOut",
      onUpdate() {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.floor(counterObj.n)).padStart(2, "0")
        }
      },
    })

    tl.to(
      progressFillRef.current,
      { scaleX: 1, duration: 2.5, ease: "power1.inOut" },
      "<"  // start simultaneously
    )

    tl.to(
      ringRef.current,
      { strokeDashoffset: 0, duration: 2.5, ease: "power1.inOut" },
      "<"
    )

    // Brief hold at 100 %
    tl.to({}, { duration: 0.35 })

    // ── Exit sequence ────────────────────────────────────────────────
    // 1. Curtain wipes upward first — page content must be fully hidden beneath it
    tl.to(curtainRef.current, {
      yPercent: -100,
      duration: 1.05,
      ease: "expo.inOut",
    })

    // 2. Only AFTER curtain is fully gone: signal hero to start its animations
    tl.add(() => onExitStart())

    // 3. Fade the now-transparent wrapper shell
    tl.to(containerRef.current, { autoAlpha: 0, duration: 0.15 })

    // 4. Signal parent to unmount
    tl.add(() => {
      sessionStorage.setItem("dime_preloader_shown", "true")
      document.body.style.overflow = ""
      onComplete()
    })

  }, { scope: containerRef, dependencies: [shouldRender] })

  if (!shouldRender) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-100 overflow-hidden select-none"
      role="status"
      aria-label="Loading Dime"
    >
      {/* ── Single curtain panel (slides up on exit) ─────────────── */}
      <div
        ref={curtainRef}
        className="absolute inset-0 will-change-transform"
        style={{ backgroundColor: "#08080C" }}
      />

      {/* ── Subtle dot grid ──────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.016) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Center brand mark ────────────────────────────────────── */}
      <div
        ref={brandRef}
        aria-hidden="true"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
        style={{ opacity: 0 }}
      >
        {/* Spinning ring + icon */}
        <div className="relative flex items-center justify-center">
          {/* SVG progress ring */}
          <svg
            width="108"
            height="108"
            viewBox="0 0 108 108"
            className="absolute"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx="54" cy="54" r="42"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
            {/* Animated fill */}
            <circle
              ref={ringRef}
              cx="54" cy="54" r="42"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>

          {/* Center icon */}
          <div className="size-[62px] rounded-full bg-white/4 border border-white/10 flex items-center justify-center">
            <Sparkles className="size-[22px] text-white/50" />
          </div>
        </div>

        {/* Brand label */}
        <span
          className="font-mono uppercase text-white/25 tracking-[0.35em]"
          style={{ fontSize: "9px", letterSpacing: "0.35em" }}
        >
          Dime Finance
        </span>
      </div>

      {/* ── Bottom: large counter + thin progress line ───────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="flex items-end justify-between px-7 sm:px-12 pb-5">
          {/* Large monospace counter — Awwwards signature */}
          <div className="flex items-baseline gap-0.5 leading-none">
            <span
              ref={counterRef}
              className="font-mono font-black tabular-nums text-white/90 leading-none"
              style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", fontVariantNumeric: "tabular-nums" }}
            >
              00
            </span>
            <span
              className="font-mono text-white/30 font-bold"
              style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", paddingBottom: "0.2em" }}
            >
              %
            </span>
          </div>

          {/* Status label */}
          <p
            className="font-mono uppercase text-white/20 tracking-[0.25em] pb-2"
            style={{ fontSize: "9px" }}
          >
            Loading workspace
          </p>
        </div>

        {/* 1 px progress line */}
        <div className="h-px w-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <div
            ref={progressFillRef}
            className="h-full origin-left will-change-transform"
            style={{ backgroundColor: "rgba(255,255,255,0.4)", transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  )
}