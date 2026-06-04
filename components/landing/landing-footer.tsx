"use client"

import React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-20 bg-muted/10">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dime</span>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </Link>
            <Link href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Security
            </Link>
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </nav>

          <div className="h-px w-full max-w-xs bg-border/40" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dime Finance. All rights reserved. Invite-only access.
          </p>
        </div>
      </div>
    </footer>
  )
}
