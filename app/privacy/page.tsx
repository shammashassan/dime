import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between py-12 px-6">
      <div className="absolute inset-0 -z-50 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <main className="max-w-3xl mx-auto w-full bg-card/45 border border-border/40 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-xl my-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            Dime is built as a private, self-owned personal finance workspace. Your privacy is our highest priority.
          </p>
          
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Local & Dedicated Storage</h2>
            <p>
              Dime operates using your dedicated MongoDB database instance. All transaction details, receipt scans, wallet logs, and category definitions are stored strictly inside your own database and are never accessible to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Authentication</h2>
            <p>
              Dime uses biometric WebAuthn Passkeys and email credentials for local user verification. Session details are cached in your browser and authenticated securely via modern cryptography protocols.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Disclaimers</h2>
            <p>
              This is a personal workspace tool. You are responsible for hosting and backup compliance. No data is stored, sold, or shared on our servers.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/20 flex">
          <Button asChild variant="outline" className="rounded-full font-semibold">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
