import type { Metadata } from "next"
import React from "react"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, Sparkles, FileText, CheckCircle2 } from "lucide-react"
import { LogoMark } from "@/components/brand/logo-mark"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CurrentYear } from "@/components/layout/current-year"

export const metadata: Metadata = {
  title: "Privacy Policy · Dime",
  description: "Learn how Dime protects your financial sovereignty with dedicated storage, zero data selling, and privacy-first AI.",
}

const sections = [
  { id: "philosophy", title: "1. Privacy Philosophy & Sovereignty" },
  { id: "collection", title: "2. Information We Collect" },
  { id: "usage", title: "3. How We Use Your Data" },
  { id: "ai-processing", title: "4. AI & OCR Processing (Google Gemini)" },
  { id: "storage", title: "5. Data Storage, Isolation & Security" },
  { id: "third-parties", title: "6. Third-Party Services & Integrations" },
  { id: "rights", title: "7. Your Rights, Data Export & Deletion" },
  { id: "cookies", title: "8. Cookies & Local Storage" },
  { id: "contact", title: "9. Policy Updates & Contact" },
]

export default function PrivacyPolicy() {
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
              <span className="text-foreground font-semibold">Privacy Policy</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
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
            <ShieldCheck className="size-3.5" />
            Security &amp; Data Protection
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your financial data belongs exclusively to you. Dime is engineered from the ground up to ensure your transactions, balances, and identity remain sovereign, private, and secure.
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

              {/* Privacy Highlights Card */}
              <Card className="border-border/40 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider font-mono">
                    <Lock className="size-3.5" />
                    Core Guarantees
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Zero third-party telemetry or ad-trackers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Financial data is never sold or brokered.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>AI models never train on your records.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Biometric passkeys via WebAuthn/FIDO2.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Legal Prose Content */}
          <div className="lg:col-span-8 space-y-12 text-sm text-muted-foreground leading-relaxed">
            
            {/* Section 1 */}
            <section id="philosophy" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Database className="size-5 text-primary" />
                1. Privacy Philosophy &amp; Sovereignty
              </h2>
              <p>
                Dime is built on the fundamental principle of financial data sovereignty. Unlike legacy budgeting apps that monetize your financial habits by selling aggregated transaction feeds to hedge funds and marketers, Dime treats your financial life as strictly confidential.
              </p>
              <p>
                Whether you access Dime via our hosted platform or run a self-hosted instance, all database transactions, wallet balances, bill schedules, and shared expense books are stored within isolated, encrypted MongoDB collections. We do not inspect, monetize, or profile your spending behavior.
              </p>
            </section>

            {/* Section 2 */}
            <section id="collection" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                2. Information We Collect
              </h2>
              <p>
                We only collect data that is strictly required to provide you with personal finance management and collaboration capabilities:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Identity &amp; Authentication:</strong> Name, email address, session tokens, and cryptographic public key credentials generated when registering WebAuthn Passkeys. Plaintext passwords and private biometric keys never touch our servers.
                </li>
                <li>
                  <strong className="text-foreground">Financial Records:</strong> Accounts, wallets, currency codes, transactions (amounts, merchants, dates, categories, notes), split allocations, budgets, loan records, subscription contracts, and investment holdings.
                </li>
                <li>
                  <strong className="text-foreground">Receipt Images:</strong> Images of receipts and invoices you voluntarily upload or drag-and-drop for OCR processing.
                </li>
                <li>
                  <strong className="text-foreground">Collaborative Workspaces (Spaces):</strong> Organization names, invited partner/roommate email addresses, and group settlement balances.
                </li>
                <li>
                  <strong className="text-foreground">Security Logs:</strong> IP address, browser user-agent, and timestamp logs retained temporarily for brute-force prevention, session verification, and administrator audit trails.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="usage" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                3. How We Use Your Data
              </h2>
              <p>
                Your data is used solely to execute the features you interact with inside Dime:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Calculating real-time net worth, cash flow trajectories, and financial health scores.</li>
                <li>Evaluating user-configured Automation Rules (e.g. matching merchants to categories).</li>
                <li>Generating renewal alerts for upcoming bills, subscriptions, and free trial expirations.</li>
                <li>Simplifying group debts and calculating minimal settlement transfers for shared spaces.</li>
                <li>Providing context to the AI Financial Coach when you deliberately prompt it for financial advice.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="ai-processing" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                4. AI &amp; OCR Processing (Google Gemini)
              </h2>
              <p>
                Dime utilizes Google Gemini vision and language models to power the AI Receipt Scanner and the AI Financial Coach:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Receipt Scanning:</strong> When you upload a receipt, the image is transmitted securely via TLS encryption to the Gemini API solely for optical character recognition (OCR) and structured JSON extraction (merchant, date, total, line items).
                </li>
                <li>
                  <strong className="text-foreground">AI Financial Coach:</strong> When asking the coach a question, only the relevant aggregated financial figures (e.g., monthly burn rate, category totals) necessary to formulate an answer are provided to the model.
                </li>
                <li>
                  <strong className="text-foreground">No Model Training:</strong> Under our enterprise API terms, neither your receipt images nor your financial figures are ever retained or used to train Google&apos;s machine learning models.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="storage" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                5. Data Storage, Isolation &amp; Security
              </h2>
              <p>
                Dime adheres to strict security and tenant isolation controls:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Tenant Segregation:</strong> Every database query is strictly scoped by authenticated `userId` or validated `organizationId`. Cross-tenant data leakage is prevented at the database query layer.
                </li>
                <li>
                  <strong className="text-foreground">Encryption:</strong> Data in transit is secured using TLS 1.3. Production MongoDB database clusters enforce encryption-at-rest (AES-256).
                </li>
                <li>
                  <strong className="text-foreground">Approval Queues:</strong> Public sign-ups are held in a secure pending queue until approved by an authorized administrator, preventing unauthorized workspace creation.
                </li>
                <li>
                  <strong className="text-foreground">Two-Factor Authentication:</strong> We support both Time-Based One-Time Passwords (TOTP) and hardware FIDO2 passkeys for account protection.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="third-parties" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <EyeOff className="size-5 text-primary" />
                6. Third-Party Services &amp; Integrations
              </h2>
              <p>
                We minimize third-party dependencies. Dime integrates only with essential infrastructure providers:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Exchange Rate Feed:</strong> Live exchange rates are queried periodically using public open rate APIs. No user data, account balances, or wallet IDs are ever transmitted with exchange rate queries.
                </li>
                <li>
                  <strong className="text-foreground">Transactional Email:</strong> Resend is used strictly to deliver verification emails, password resets, and organization invites.
                </li>
                <li>
                  <strong className="text-foreground">Zero Trackers:</strong> Dime contains zero third-party tracking scripts, zero Facebook/Google ad pixels, and zero cross-site behavioral cookies.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="rights" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                7. Your Rights, Data Export &amp; Deletion
              </h2>
              <p>
                Under global privacy standards, including GDPR and CCPA, you retain complete authority over your records:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Right to Export:</strong> You can export your full transaction log, wallets, contacts, budgets, and debt records into standard CSV or JSON format at any time.
                </li>
                <li>
                  <strong className="text-foreground">Right to Erasure (Deletion):</strong> You have the right to request immediate and complete deletion of your account. Upon account deletion, all associated transactions, wallets, receipts, goals, and credentials are permanently purged from our database.
                </li>
                <li>
                  <strong className="text-foreground">Right to Rectification:</strong> You can edit or re-categorize any transaction, wallet, or loan record directly within the workspace.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="cookies" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                8. Cookies &amp; Local Storage
              </h2>
              <p>
                Dime uses only strictly necessary first-party cookies:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">better-auth.session_token</code>: Authenticates your encrypted session.</li>
                <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">theme</code>: Stores your preference for dark or light mode.</li>
              </ul>
              <p>
                We do not use advertising, marketing, or behavioral tracking cookies.
              </p>
            </section>

            {/* Section 9 */}
            <section id="contact" className="scroll-mt-24 space-y-3 pt-6 border-t border-border/20">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                9. Policy Updates &amp; Contact
              </h2>
              <p>
                We may revise this Privacy Policy to reflect platform enhancements or regulatory changes. Significant changes will be announced via an in-app notice or email notification prior to taking effect.
              </p>
              <p>
                For questions regarding data privacy, exports, or security disclosures, please contact the Dime engineering team at:
              </p>
              <div className="rounded-xl border border-border/30 bg-card/50 p-4 font-mono text-xs space-y-1">
                <p className="font-semibold text-foreground">Dime Security &amp; Privacy Office</p>
                <p className="text-muted-foreground">Email: privacy@dime.finance</p>
                <p className="text-muted-foreground">PGP Key ID: 0x9B4E21D8 · Fingerprint available upon request</p>
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
            <Link href="/terms" className="hover:text-foreground transition-colors font-medium">
              Terms of Service
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
