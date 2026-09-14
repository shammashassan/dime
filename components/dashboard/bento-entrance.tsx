"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"

export function BentoEntrance({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tiles = gsap.utils.toArray<HTMLElement>(".bento-tile")
      const mm = gsap.matchMedia()

      gsap.set(tiles, { opacity: 0, y: 16 })

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(tiles, { opacity: 1, y: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(tiles, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "transform",
        })
      })

      return () => mm.revert()
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
