import type { Metadata } from "next"
import React from "react"
import Link from "next/link"
import { ArrowLeft, Scale, AlertTriangle, ShieldCheck, FileText, CheckCircle2, UserCheck, HelpCircle } from "lucide-react"
import { LogoMark } from "@/components/brand/logo-mark"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CurrentYear } from "@/components/layout/current-year"

export const metadata: Metadata = {
  title: "Terms of Service · Dime",
  description: "Read the terms and conditions governing the use of Dime's personal finance operating system.",
}

const sections = [
  { id: "acceptance", title: "1. Agreement to Terms" },
  { id: "services", title: "2. Description of Services" },
  { id: "no-advice", title: "3. No Financial, Tax, or Legal Advice" },
  { id: "registration", title: "4. Account Registration & Approval Queue" },
  { id: "acceptable-use", title: "5. Acceptable Use & Conduct" },
  { id: "spaces", title: "6. Shared Spaces & Group Settlements" },
  { id: "ip-ownership", title: "7. Intellectual Property & Data Ownership" },
  { id: "ai-limitations", title: "8. AI Models & Third-Party Limitations" },
  { id: "liability", title: "9. Disclaimer of Warranties & Liability" },
  { id: "termination", title: "10. Termination & Account Cancellation" },
  { id: "governing-law", title: "11. Governing Law & Contact" },
]

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 -z-50 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark className="size-7 text-primary dark:text-purple-500" />
              <span className="text-lg font-bold tracking-tight">Dime</span>
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-muted-foreground border-l border-border/40 pl-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-foreground font-semibold">Terms of Service</span>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-2 text-xs font-semibold">
            <Link href="/">
              <ArrowLeft className="size-3.5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-border/20 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
            <Scale className="size-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Terms of Service
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Please review these Terms of Service carefully before utilizing the Dime workspace. By creating an account or accessing our services, you agree to be bound by this agreement.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
            <span>Effective Date: September 19, 2026</span>
            <span>·</span>
            <span>Version: 2.1 (Production)</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sticky Navigation Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-mono">
                  Table of Contents
                </h3>
                <nav className="flex flex-col space-y-1.5 text-xs">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="text-muted-foreground hover:text-primary transition-colors py-1 truncate"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Key Terms Notice Card */}
              <Card className="border-border/40 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider font-mono">
                    <ShieldCheck className="size-3.5" />
                    Essential Points
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Not a financial advisor, broker, or fiduciary.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>You retain 100% ownership of your records.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Settlements are calculators, not bank transfers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Software provided on an &quot;AS-IS&quot; basis.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Legal Prose Content */}
          <div className="lg:col-span-8 space-y-12 text-sm text-muted-foreground leading-relaxed">
            
            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                1. Agreement to Terms
              </h2>
              <p>
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and Dime Financial Systems (&quot;Dime&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) concerning your access to and use of the Dime software application, websites, and associated services (collectively, the &quot;Platform&quot;).
              </p>
              <p>
                By accessing or using Dime, you represent that you are at least 18 years of age and possess the legal capacity to enter into these Terms. If you do not agree to all of these Terms, you are expressly prohibited from using the Platform and must discontinue use immediately.
              </p>
            </section>

            {/* Section 2 */}
            <section id="services" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                2. Description of Services
              </h2>
              <p>
                Dime provides an autonomous, privacy-first personal finance workspace designed for multi-currency asset tracking, receipt scanning, transaction classification, budget monitoring, recurring subscription/bill management, group debt settlement calculations, and net worth analysis.
              </p>
              <p>
                Dime is available both as a managed cloud service and as a self-hostable open architecture backed by MongoDB and modern WebAuthn cryptography.
              </p>
            </section>

            {/* Section 3 */}
            <section id="no-advice" className="scroll-mt-24 space-y-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider font-mono">
                  <AlertTriangle className="size-4 shrink-0" />
                  Crucial Legal Notice: No Financial Advice
                </div>
                <p className="mt-2 text-xs text-foreground leading-relaxed">
                  Dime is a software calculation and logging tool. Nothing on the Platform—including AI Financial Coach responses, financial health scores, cash flow forecasts, or spending insights—constitutes professional financial, investment, legal, accounting, or tax advice.
                </p>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                3. No Financial, Tax, or Legal Advice
              </h2>
              <p>
                Dime is not a registered investment advisor, broker-dealer, financial planner, certified public accountant (CPA), or fiduciary. All charts, health metrics (0–100 score), projections, scenario forecasts, and AI-generated insights are provided solely for personal informational and organizational convenience.
              </p>
              <p>
                You acknowledge that you are solely responsible for verifying the accuracy of any currency conversions, transaction splits, tax categorizations, and investment valuation records before making financial decisions. Always consult a licensed professional before executing material financial transactions.
              </p>
            </section>

            {/* Section 4 */}
            <section id="registration" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <UserCheck className="size-5 text-primary" />
                4. Account Registration &amp; Approval Queue
              </h2>
              <p>
                To access Dime, you must create an account using valid contact credentials or cryptographic passkeys. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate, current, and complete registration details.</li>
                <li>Maintain the confidentiality of your passkeys, hardware tokens, and two-factor authentication recovery keys.</li>
                <li>Promptly notify us of any unauthorized access or security compromise.</li>
              </ul>
              <p>
                <strong className="text-foreground">Administrator Approval:</strong> For security and privacy preservation, new registrations on hosted instances may enter a pending verification queue. We reserve the right to approve, decline, or revoke access to any registration in accordance with workspace administrative policies.
              </p>
            </section>

            {/* Section 5 */}
            <section id="acceptable-use" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                5. Acceptable Use &amp; Conduct
              </h2>
              <p>
                You agree not to engage in any prohibited conduct, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Using the Platform for any illegal purpose or in violation of anti-money laundering regulations.</li>
                <li>Attempting to probe, scan, or breach the security or authentication measures of our database clusters.</li>
                <li>Reverse-engineering, decompiling, or disassembling proprietary Platform components.</li>
                <li>Abusing or overloading our automated AI receipt OCR infrastructure or rate limits.</li>
                <li>Impersonating another person or misrepresenting access to shared organization spaces.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="spaces" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                6. Shared Spaces &amp; Group Settlements
              </h2>
              <p>
                Dime includes collaborative tools, such as Couples &amp; Shared Budgeting (Spaces) and Group Debt Simplification (Splitwise-style calculations):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Calculation Tool Only:</strong> Group settlement figures represent mathematical balance simplifications. Dime is NOT a payment transmitter, money services business, or custodian. Dime does not initiate or execute wire transfers, ACH transfers, or debit card transactions.
                </li>
                <li>
                  <strong className="text-foreground">Interpersonal Disputes:</strong> Any financial dispute between individuals in a shared space regarding reimbursements, expense logging, or lending agreements is strictly between the involved parties. Dime assumes zero liability for unsettled personal debts.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="ip-ownership" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                7. Intellectual Property &amp; Data Ownership
              </h2>
              <p>
                <strong className="text-foreground">Your Financial Data:</strong> You retain 100% title and ownership of all financial transactions, receipts, category definitions, and notes uploaded to Dime. We claim zero ownership or commercial rights over your private records.
              </p>
              <p>
                <strong className="text-foreground">Dime Intellectual Property:</strong> The Dime name, LogoMark, visual designs, source code, algorithms, and interface components are protected by copyright, trademark, and trade secret laws. You are granted a personal, non-exclusive, non-transferable license to access and use the Platform in accordance with these Terms.
              </p>
            </section>

            {/* Section 8 */}
            <section id="ai-limitations" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                8. AI Models &amp; Third-Party Limitations
              </h2>
              <p>
                AI features—such as receipt OCR scanning and conversational coach responses—utilize Google Gemini machine learning models. While tuned for high accuracy:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>OCR extractions may occasionally misread faded receipt totals, handwritten notes, or tax line items.</li>
                <li>AI Coach responses are probabilistic language completions and must not be treated as audited accounting advice.</li>
                <li>Currency exchange rate conversions are based on third-party market data feeds cached hourly and may differ slightly from live interbank forex spreads.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="liability" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <AlertTriangle className="size-5 text-primary" />
                9. Disclaimer of Warranties &amp; Limitation of Liability
              </h2>
              <p>
                THE PLATFORM IS PROVIDED ON AN &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; BASIS. DIME DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                IN NO EVENT SHALL DIME, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES—INCLUDING LOSS OF PROFITS, DATA LOSS, CORRUPTION OF DATABASE INSTANCES, OR FINANCIAL DISCREPANCIES—ARISING FROM YOUR USE OR INABILITY TO USE THE PLATFORM.
              </p>
            </section>

            {/* Section 10 */}
            <section id="termination" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                10. Termination &amp; Account Cancellation
              </h2>
              <p>
                You may terminate your account at any time by navigating to your settings or requesting deletion from the administrator. Upon termination:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your access rights will immediately cease.</li>
                <li>You can export all existing transactions and wallet balances prior to deletion.</li>
                <li>All personal data and cryptographic credentials will be permanently purged in accordance with our Privacy Policy.</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="governing-law" className="scroll-mt-24 space-y-3 pt-6 border-t border-border/20">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" />
                11. Governing Law &amp; Contact
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law principles. Any dispute arising out of or related to these Terms shall be resolved exclusively in the state or federal courts located in Delaware.
              </p>
              <p>
                If you have questions or concerns regarding these Terms of Service, please reach out to our legal department:
              </p>
              <div className="rounded-xl border border-border/30 bg-card/50 p-4 font-mono text-xs space-y-1">
                <p className="font-semibold text-foreground">Dime Legal &amp; Compliance</p>
                <p className="text-muted-foreground">Email: legal@dime.finance</p>
                <p className="text-muted-foreground">Inquiries are generally addressed within 3 business days.</p>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-muted/10 py-8">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between px-6 gap-4 text-xs text-muted-foreground">
          <p>© <CurrentYear /> Dime Financial Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors font-medium">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors font-medium">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
