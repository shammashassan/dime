import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between py-12 px-6">
      <div className="absolute inset-0 -z-50 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <main className="max-w-3xl mx-auto w-full bg-card/45 border border-border/40 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-xl my-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">Terms of Service</h1>
        
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to Dime, a self-owned personal finance workspace.
          </p>
          
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Use of Workspace</h2>
            <p>
              Dime is provided on a self-hosted or private workspace basis. By accessing the workspace, you agree to secure your credentials, maintain database connection details safely, and utilize the software for lawful finance tracking only.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">2. No Financial Advice</h2>
            <p>
              Dime is a tracking tool and does not provide financial, investment, or legal advice. All calculations, budget warnings, and conversions are for tracking purposes only.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Disclaimer of Warranties</h2>
            <p>
              Dime is provided &quot;as is&quot; without warranty of any kind. The creators do not guarantee database uptime, data persistence, or OCR extraction correctness.
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
