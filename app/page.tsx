"use client"

import React, { useState } from "react"
import { Preloader } from "@/components/landing/preloader"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingWorkflow } from "@/components/landing/landing-workflow"
import { LandingBento } from "@/components/landing/landing-bento"
import { LiveConversionShowcase } from "@/components/landing/live-conversion-showcase"
import { LandingSecurity } from "@/components/landing/landing-security"
import { LandingFAQ } from "@/components/landing/landing-faq"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingLenis } from "@/components/landing/landing-lenis"

export default function Home() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [startReveals, setStartReveals] = useState(false)

  return (
    <LandingLenis>
      <div className="relative min-h-screen bg-background selection:bg-primary/30 overflow-x-hidden">
        {/* Global Background grids */}
        <div className="absolute inset-0 -z-50 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {showPreloader && (
          <Preloader
            onExitStart={() => setStartReveals(true)}
            onComplete={() => setShowPreloader(false)}
          />
        )}

        <LandingHeader startAnimation={startReveals || !showPreloader} />

        <main className="flex flex-col w-full">
          <LandingHero startAnimation={startReveals || !showPreloader} />

          <LandingWorkflow />

          <LandingBento />

          <LiveConversionShowcase />

          <LandingSecurity />

          <LandingFAQ />
        </main>

        <LandingFooter />
      </div>
    </LandingLenis>
  )
}
