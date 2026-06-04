"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Sparkles, Menu, X } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  const { data: session } = authClient.useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const headerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    tl.fromTo(
      headerRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    )
    .fromTo(
      logoRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" },
      "-=0.4"
    )
    .fromTo(
      navRef.current ? Array.from(navRef.current.children) : [],
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 },
      "-=0.3"
    )
    .fromTo(
      actionsRef.current,
      { x: 15, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4 },
      "-=0.2"
    )
  }, { scope: headerRef })

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        ref={headerRef}
        className={`mx-auto max-w-6xl mt-4 px-6 py-3 transition-[max-width,padding,background-color,border-color] duration-300 border ${mobileMenuOpen
            ? "rounded-3xl bg-background/95 border-border/40 shadow-2xl backdrop-blur-xl"
            : isScrolled
              ? "rounded-full bg-background/80 border-border/40 shadow-lg backdrop-blur-md max-w-4xl"
              : "rounded-full bg-background/20 border-transparent backdrop-blur-xs"
          }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link ref={logoRef} href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Dime
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav ref={navRef} className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </a>
            <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Security
            </a>
          </nav>

          {/* Right Action Button & Theme */}
          <div ref={actionsRef} className="hidden md:flex items-center gap-4">
            <ModeToggle />
            {session ? (
              <Button asChild className="rounded-full shadow-md shadow-primary/20 cursor-pointer font-semibold">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-full shadow-md shadow-primary/20 cursor-pointer font-semibold">
                <Link href="/sign-in">
                  Get Started
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4 border-t border-border/20 pt-4 animate-in fade-in slide-in-from-top-5 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Security
            </a>
            {session ? (
              <Button asChild size="lg" className="rounded-full cursor-pointer font-semibold w-full">
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" size="lg" className="rounded-full cursor-pointer font-semibold w-full bg-input/30 hover:bg-input/50">
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="lg" className="rounded-full cursor-pointer font-semibold shadow-md shadow-primary/20 w-full">
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
