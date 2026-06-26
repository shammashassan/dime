"use client"

import { ReactLenis, useLenis } from "lenis/react"
import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Import Lenis base styles (forces scroll-behavior: auto to avoid CSS conflicts)
import "lenis/dist/lenis.css"

gsap.registerPlugin(ScrollTrigger)

interface LandingLenisProps {
  children: React.ReactNode
}

function GSAPSync() {
  const lenis = useLenis(({ scroll }) => {
    // Notify ScrollTrigger whenever Lenis scrolls so pinning and
    // scrub values stay in sync with the smoothed position.
    ScrollTrigger.update()
  })

  useEffect(() => {
    if (!lenis) return

    // Capture narrowed reference so TypeScript knows it's defined inside the closure
    const lenisInstance = lenis

    // Drive Lenis off the GSAP ticker so both run on the same RAF frame,
    // eliminating the 1-2 frame jitter that can occur otherwise.
    function onTick(time: number) {
      lenisInstance.raf(time * 1000)
    }

    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
    }
  }, [lenis])


  return null
}

export function LandingLenis({ children }: LandingLenisProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,          // smoothness factor — lower = more lag, higher = snappier
        duration: 1.2,       // base duration (seconds) for pointer-driven scrolls
        smoothWheel: true,   // smooth mouse-wheel scrolling
        syncTouch: false,    // keep native touch momentum on mobile
        autoRaf: false,      // we drive raf manually via GSAP ticker
      }}
    >
      <GSAPSync />
      {children}
    </ReactLenis>
  )
}
