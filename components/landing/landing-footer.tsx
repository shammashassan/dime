"use client"

import React from "react"
import Link from "next/link"
import { LogoMark } from "@/components/brand/logo-mark"

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-16 bg-muted/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <LogoMark className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">Dime</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              A private, self-owned personal finance workspace designed for total financial clarity.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Product</h4>
            <nav className="flex flex-col gap-2.5">
              <Link href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#workflow" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Workflow
              </Link>
              <Link href="#faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Legal</h4>
            <nav className="flex flex-col gap-2.5">
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Connect</h4>
            <nav className="flex flex-col gap-2.5">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <TwitterIcon className="size-3.5" />
                X / Twitter
              </a>
              <a
                href="https://github.com/shammashassan/dime"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <GithubIcon className="size-3.5" />
                GitHub Repository
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dime Finance. All rights reserved. Self-owned workspace data.
          </p>
        </div>
      </div>
    </footer>
  )
}
