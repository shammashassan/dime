# Packed Bento Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Dime's overview dashboard into an ultra-dense, action-packed Bento Financial Command Center inspired by Volt, featuring inline Quick Log (with dynamic wallet currency prefix), personal Loans tracking, Command Center with `⌘K`, top financial focus alert pills, official shadcn charts (area cash flow, category donut, health arc gauge), executive KPI benchmarks, and GSAP staggered entrance animations.

**Architecture:** A high-density 3-column Bento grid in `components/dashboard/dashboard-bento.tsx` replaces the vertical stack in `app/(dashboard)/dashboard/page.tsx`. Server components fetch all scoped telemetry in parallel via `Promise.all` using `React.cache()` with zero sequential waterfalls. Client action cards (`quick-log-card.tsx`, `loan-action-card.tsx`, `command-center-card.tsx`) provide zero-friction inline mutations backed by Next.js Server Actions with instant optimistic feedback and Sonner toasts.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript 5, MongoDB, Tailwind CSS v4, shadcn/ui, GSAP, Recharts, Sonner, Lucide React.

**Spec:** [`docs/superpowers/specs/2026-09-14-packed-bento-dashboard-design.md`](file:///c:/dev/personal-projects/dime/docs/superpowers/specs/2026-09-14-packed-bento-dashboard-design.md)

---

## Global Constraints

- Must follow Next.js 16 conventions (`proxy.ts` not `middleware.ts`, `React.cache()` on queries, `cacheComponents: true`, all promises awaited).
- Treat shadcn/ui as the design system (`Card`, `FieldGroup`, `Field`, `InputGroup`, `ToggleGroup`, `ChartContainer`, `ChartTooltip`, semantic tokens `bg-card/60`, `border-border/50`, `text-muted-foreground`).
- All financial balances stored strictly as integer cents/paise (no floating point currency).
- Multi-currency normalization using Dime's `convertCurrency` and `createCurrencyConverter`.
- Selected wallet determines currency prefix dynamically in the Quick Log card.
- GSAP animations must honor `prefers-reduced-motion` and clear props on completion.

---

## File Structure Map

| File Path | Role / Responsibility |
|---|---|
| `types/index.ts` | Export `DashboardFocusCounts` interface |
| `lib/queries/dashboard.ts` | Cached server query aggregating overdue bills, 7-day renewals, loan dues, and unread alerts |
| `lib/queries/__tests__/dashboard-focus.test.ts` | Automated unit test suite verifying `getDashboardFocusCounts` logic and date filters |
| `components/dashboard/dashboard-header.tsx` | Personalized greeting header with status pill, current date, and gradient name highlight |
| `components/dashboard/financial-focus-strip.tsx` | Top 4 alert pills (Overdue Bills, 7d Renewals, Loan Dues, Unread Alerts) with deep links |
| `components/dashboard/command-center-card.tsx` | Faux search bar trigger (`⌘K`) + quick action buttons (`+ Transaction`, `+ Budget`, `+ Goal`, `Settle Up`, `Transfer`) |
| `components/dashboard/quick-log-card.tsx` | Interactive inline logger for Expense & Income with dynamic wallet currency prefix and instant submit |
| `components/dashboard/loan-action-card.tsx` | Personal debts action card with Lent/Borrowed toggle, contact dropdown, amount, and live debt position badges |
| `components/dashboard/financial-health-gauge-card.tsx` | 180° semi-circular radial gauge with 0-100 score tiers, micro-meters, and top recommendation snippet |
| `components/dashboard/executive-kpi-strip.tsx` | 3 Bento stat cards: Net Worth (30d delta & sparkline), Monthly Cash Flow, and Savings Rate % |
| `components/dashboard/spending-trend-chart.tsx` | Upgraded shadcn AreaChart with Bézier curves, Income vs Expense dual gradients, and 30D/60D/90D switches |
| `components/dashboard/category-breakdown.tsx` | Upgraded shadcn Donut chart with center total spend and detailed legend with % shares |
| `components/dashboard/active-goals-card.tsx` | Progress ring/bar card for top 3 active savings goals with target dates |
| `components/dashboard/dashboard-bento.tsx` | Client orchestrator with 3-column Bento grid layout and GSAP staggered entrance |
| `app/(dashboard)/dashboard/page.tsx` | Server Component route orchestrating parallel `Promise.all` fetch with auth guard and Suspense |
| `app/(dashboard)/dashboard/loading.tsx` | High-fidelity Bento shimmer skeleton matching the exact 3-column layout |
| `app/(dashboard)/dashboard/error.tsx` | Co-located error boundary with 1-click retry |

---

### Task 1: Domain Types and Focus Counts Query

**Files:**
- Modify: `types/index.ts`
- Create: `lib/queries/dashboard.ts`
- Test: `lib/queries/__tests__/dashboard-focus.test.ts`

**Interfaces:**
- Consumes: `getCollection`, `getFinancialScope`, `getScopeFilter`, `convertCurrency`
- Produces: `DashboardFocusCounts`, `getDashboardFocusCounts`

- [ ] **Step 1: Write the failing unit test for dashboard focus counts**

Create `lib/queries/__tests__/dashboard-focus.test.ts`:
```ts
import test from "node:test"
import assert from "node:assert/strict"
import { calculateFocusCounts } from "../dashboard"

test("calculateFocusCounts aggregates overdue bills, 7-day renewals, loan dues, and unread alerts", () => {
  const now = new Date("2026-09-14T12:00:00Z")
  
  const bills = [
    { dueDate: new Date("2026-09-10"), status: "unpaid", amount: 5000 }, // overdue
    { dueDate: new Date("2026-09-16"), status: "unpaid", amount: 3000 }, // upcoming in 2d
    { dueDate: new Date("2026-09-25"), status: "unpaid", amount: 4000 }, // later
    { dueDate: new Date("2026-09-05"), status: "paid", amount: 2000 },   // paid
  ]

  const recurring = [
    { nextRun: new Date("2026-09-18"), status: "active" }, // in 4d
    { nextRun: new Date("2026-09-30"), status: "active" }, // later
  ]

  const loans = [
    { dueDate: new Date("2026-09-12"), status: "active", remainingAmount: 10000 }, // overdue
    { dueDate: new Date("2026-09-20"), status: "active", remainingAmount: 5000 },  // in 6d
    { dueDate: new Date("2026-10-01"), status: "active", remainingAmount: 2000 },  // later
  ]

  const unreadNotifications = 4

  const result = calculateFocusCounts({
    now,
    bills,
    recurring,
    loans,
    unreadNotifications,
    baseCurrency: "USD",
  })

  assert.equal(result.overdueBillsCount, 1)
  assert.equal(result.overdueBillsAmount, 5000)
  assert.equal(result.upcomingRenewalsCount, 2) // 1 bill in 2d + 1 recurring in 4d
  assert.equal(result.pendingLoansCount, 2)    // 1 overdue loan + 1 loan in 6d
  assert.equal(result.unreadNotificationsCount, 4)
  assert.equal(result.baseCurrency, "USD")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/queries/__tests__/dashboard-focus.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Define `DashboardFocusCounts` in `types/index.ts` and implement `lib/queries/dashboard.ts`**

In `types/index.ts`, append:
```ts
export interface DashboardFocusCounts {
  overdueBillsCount: number
  overdueBillsAmount: number
  upcomingRenewalsCount: number
  pendingLoansCount: number
  unreadNotificationsCount: number
  baseCurrency: string
}
```

Create `lib/queries/dashboard.ts`:
```ts
import { cache } from "react"
import { getCollection, notificationsCollection } from "@/lib/db/collections"
import { BillInstance, RecurringRule, Loan } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getPreferences } from "@/lib/queries/preferences"
import { addDays, isBefore, endOfDay } from "date-fns"
import { DashboardFocusCounts } from "@/types"

export function calculateFocusCounts({
  now,
  bills,
  recurring,
  loans,
  unreadNotifications,
  baseCurrency,
}: {
  now: Date
  bills: Array<{ dueDate: Date | string; status: string; amount: number }>
  recurring: Array<{ nextRun?: Date | string | null; status?: string }>
  loans: Array<{ dueDate?: Date | string | null; status?: string; remainingAmount?: number }>
  unreadNotifications: number
  baseCurrency: string
}): DashboardFocusCounts {
  const sevenDaysFromNow = endOfDay(addDays(now, 7))

  let overdueBillsCount = 0
  let overdueBillsAmount = 0
  let upcomingRenewalsCount = 0

  for (const b of bills) {
    if (b.status === "paid" || b.status === "cancelled") continue
    const due = new Date(b.dueDate)
    if (isBefore(due, now)) {
      overdueBillsCount++
      overdueBillsAmount += b.amount || 0
    } else if (due <= sevenDaysFromNow) {
      upcomingRenewalsCount++
    }
  }

  for (const r of recurring) {
    if (r.status === "paused" || r.status === "cancelled" || !r.nextRun) continue
    const next = new Date(r.nextRun)
    if (next >= now && next <= sevenDaysFromNow) {
      upcomingRenewalsCount++
    }
  }

  let pendingLoansCount = 0
  for (const l of loans) {
    if (l.status === "fully_repaid" || l.status === "cancelled" || !l.dueDate) continue
    const due = new Date(l.dueDate)
    if (isBefore(due, now) || due <= sevenDaysFromNow) {
      pendingLoansCount++
    }
  }

  return {
    overdueBillsCount,
    overdueBillsAmount,
    upcomingRenewalsCount,
    pendingLoansCount,
    unreadNotificationsCount: unreadNotifications,
    baseCurrency,
  }
}

export const getDashboardFocusCounts = cache(async (userId: string): Promise<DashboardFocusCounts> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const prefs = await getPreferences(userId)
  const baseCurrency = prefs.defaultCurrency || "USD"

  const billsColl = await getCollection<BillInstance>("bill_instances")
  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const loansColl = await getCollection<Loan>("loans")

  const now = new Date()

  const [bills, recurring, loans, unreadCount] = await Promise.all([
    billsColl.find(filter).toArray(),
    recurringColl.find(filter).toArray(),
    loansColl.find(filter).toArray(),
    notificationsCollection.countDocuments({
      userId,
      read: false,
    }),
  ])

  return calculateFocusCounts({
    now,
    bills,
    recurring,
    loans,
    unreadNotifications: unreadCount,
    baseCurrency,
  })
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/queries/__tests__/dashboard-focus.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/index.ts lib/queries/dashboard.ts lib/queries/__tests__/dashboard-focus.test.ts
git commit -m "feat(dashboard): add getDashboardFocusCounts query and types"
```

---

### Task 2: Dashboard Header & Today's Financial Focus Strip

**Files:**
- Create: `components/dashboard/dashboard-header.tsx`
- Create: `components/dashboard/financial-focus-strip.tsx`

**Interfaces:**
- Consumes: `DashboardFocusCounts`, `formatCurrency`
- Produces: `<DashboardHeader />`, `<FinancialFocusStrip />`

- [ ] **Step 1: Create `components/dashboard/dashboard-header.tsx`**

```tsx
import { format } from "date-fns"
import { Sparkles, Calendar } from "lucide-react"

interface DashboardHeaderProps {
  userName: string
  scopeName?: string
  isOrganization?: boolean
}

export function DashboardHeader({ userName, scopeName, isOrganization }: DashboardHeaderProps) {
  const todayFormatted = format(new Date(), "EEEE, MMMM d, yyyy")

  return (
    <header className="flex flex-col gap-2 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            dime financial workspace
          </p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary border border-primary/20">
            {isOrganization && scopeName ? scopeName : "Personal"}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Welcome back,{" "}
          <span className="bg-linear-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent font-extrabold">
            {userName}
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="size-3.5 text-muted-foreground/70" />
        <span>{todayFormatted}</span>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `components/dashboard/financial-focus-strip.tsx`**

```tsx
import Link from "next/link"
import { AlertCircle, CalendarClock, HandCoins, Bell, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { DashboardFocusCounts } from "@/types"
import { formatCurrency } from "@/lib/utils"

interface FinancialFocusStripProps {
  counts: DashboardFocusCounts
}

export function FinancialFocusStrip({ counts }: FinancialFocusStripProps) {
  const items = [
    {
      title: "Overdue Bills",
      count: counts.overdueBillsCount,
      subtext: counts.overdueBillsCount > 0 ? `${formatCurrency(counts.overdueBillsAmount, counts.baseCurrency)} overdue` : "All paid up",
      href: "/recurring?tab=bills",
      icon: AlertCircle,
      alertColor: counts.overdueBillsCount > 0 ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.overdueBillsCount > 0,
    },
    {
      title: "Upcoming (7d)",
      count: counts.upcomingRenewalsCount,
      subtext: counts.upcomingRenewalsCount > 0 ? "Renewals & bills soon" : "None this week",
      href: "/recurring",
      icon: CalendarClock,
      alertColor: counts.upcomingRenewalsCount > 0 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.upcomingRenewalsCount > 0,
    },
    {
      title: "Loan Repayments",
      count: counts.pendingLoansCount,
      subtext: counts.pendingLoansCount > 0 ? "Due or pending" : "No dues pending",
      href: "/loans",
      icon: HandCoins,
      alertColor: counts.pendingLoansCount > 0 ? "text-violet-500 bg-violet-500/10 border-violet-500/20" : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.pendingLoansCount > 0,
    },
    {
      title: "Inbox Alerts",
      count: counts.unreadNotificationsCount,
      subtext: counts.unreadNotificationsCount > 0 ? "Unread notifications" : "Inbox cleared",
      href: "/notifications",
      icon: Bell,
      alertColor: counts.unreadNotificationsCount > 0 ? "text-blue-500 bg-blue-500/10 border-blue-500/20" : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.unreadNotificationsCount > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.title} href={item.href} className="group/focus block select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
            <Card className="bento-tile flex items-center justify-between p-3.5 border-border/50 bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:bg-card hover:border-border hover:shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${item.alertColor}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold leading-none tracking-tight text-foreground">{item.count}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 truncate">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {item.subtext}
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-transform group-hover/focus:translate-x-0.5 group-hover/focus:text-foreground" />
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/dashboard-header.tsx components/dashboard/financial-focus-strip.tsx
git commit -m "feat(dashboard): add DashboardHeader and FinancialFocusStrip components"
```

---

### Task 3: Command Center Card

**Files:**
- Create: `components/dashboard/command-center-card.tsx`

**Interfaces:**
- Produces: `<CommandCenterCard />`
- Interactivity: Dispatches `"open-global-search"`, routes/triggers modals for `+ Transaction`, `+ Budget`, `+ Goal`, `Settle Up`, `Transfer`.

- [ ] **Step 1: Create `components/dashboard/command-center-card.tsx`**

```tsx
"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Plus, PiggyBank, Target, Users, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

export function CommandCenterCard() {
  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"))
  }

  return (
    <Card className="bento-tile flex h-full flex-col justify-between gap-4 border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            command & search
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">Universal shortcuts</span>
        </div>
        {/* Search trigger */}
        <button
          type="button"
          onClick={handleOpenSearch}
          className="group/search flex w-full cursor-pointer select-none items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2.5 transition-colors hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/search:text-foreground" />
          <span className="flex-1 text-left text-sm text-muted-foreground">
            Search transactions, merchants, categories, goals...
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
              Ctrl K
            </kbd>
          </div>
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          quick actions
        </span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/transactions?new=1">
            <Plus className="size-3.5" />
            Add Transaction
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/budgets">
            <PiggyBank className="size-3.5" />
            New Budget
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/goals">
            <Target className="size-3.5" />
            Add Goal
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/shared-expenses">
            <Users className="size-3.5" />
            Settle Up
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" asChild>
          <Link href="/wallets">
            <ArrowLeftRight className="size-3.5" />
            Transfer
          </Link>
        </Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/command-center-card.tsx
git commit -m "feat(dashboard): add CommandCenterCard component"
```

---

### Task 4: Quick Log Card (Expense / Income with Dynamic Wallet Currency)

**Files:**
- Create: `components/dashboard/quick-log-card.tsx`

**Interfaces:**
- Consumes: `Wallet`, `Category`, `createTransaction`
- Produces: `<QuickLogCard />`
- State: `type: "expense" | "income"`, `amount: string`, `description: string`, `walletId: string`, `categoryId: string`

- [ ] **Step 1: Create `components/dashboard/quick-log-card.tsx`**

```tsx
"use client"

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Wallet, Category } from "@/types"
import { createTransaction } from "@/lib/actions/transactions"
import { getCurrencySymbol } from "@/lib/currency"
import { toast } from "sonner"
import { PlusCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickLogCardProps {
  wallets: Wallet[]
  categories: Category[]
  defaultWalletId?: string
  baseCurrency?: string
}

export function QuickLogCard({
  wallets,
  categories,
  defaultWalletId,
  baseCurrency = "USD",
}: QuickLogCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialWalletId = defaultWalletId && wallets.some(w => w._id?.toString() === defaultWalletId)
    ? defaultWalletId
    : wallets[0]?._id?.toString() || ""

  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [walletId, setWalletId] = useState(initialWalletId)
  const [categoryId, setCategoryId] = useState("")

  const selectedWallet = wallets.find(w => w._id?.toString() === walletId)
  const currency = selectedWallet?.currency || baseCurrency
  const currencySymbol = getCurrencySymbol(currency)

  const filteredCategories = categories.filter(c => c.type === type)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!walletId) {
      toast.error("Please select a wallet")
      return
    }

    startTransition(async () => {
      // Amount in integer cents
      const amountInCents = Math.round(numAmount * 100)
      const res = await createTransaction({
        type,
        amount: amountInCents,
        description: description.trim() || (type === "income" ? "Quick Income" : "Quick Expense"),
        walletId,
        categoryId: categoryId || filteredCategories[0]?._id?.toString() || "",
        date: new Date().toISOString(),
      })

      if (res.success) {
        toast.success(`${type === "income" ? "Income" : "Expense"} logged successfully!`, {
          action: {
            label: "View",
            onClick: () => router.push("/transactions"),
          },
        })
        setAmount("")
        setDescription("")
      } else {
        toast.error(res.error || "Failed to log transaction")
      }
    })
  }

  return (
    <Card className="bento-tile flex h-full flex-col justify-between border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          quick log
        </span>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(val) => { if (val) setType(val as "expense" | "income") }}
          className="bg-muted/40 p-0.5 rounded-lg border border-border/50"
        >
          <ToggleGroupItem
            value="expense"
            className="h-6 text-[11px] px-2.5 font-medium data-[state=on]:bg-rose-500/10 data-[state=on]:text-rose-500 data-[state=on]:border-rose-500/20"
          >
            Expense
          </ToggleGroupItem>
          <ToggleGroupItem
            value="income"
            className="h-6 text-[11px] px-2.5 font-medium data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-500 data-[state=on]:border-emerald-500/20"
          >
            Income
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Amount with dynamic currency prefix */}
          <InputGroup className="h-9">
            <InputGroupAddon>{currencySymbol}</InputGroupAddon>
            <InputGroupInput
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              className="font-medium"
            />
          </InputGroup>

          {/* Wallet Dropdown */}
          <Select value={walletId} onValueChange={setWalletId} disabled={isPending}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {wallets.map((w) => (
                  <SelectItem key={w._id?.toString()} value={w._id?.toString() || ""}>
                    {w.name} ({w.currency})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <InputGroup className="h-9">
          <InputGroupInput
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            className="text-xs"
          />
        </InputGroup>

        <Button
          type="submit"
          size="sm"
          disabled={isPending || !amount}
          className="h-8.5 w-full gap-1.5 text-xs font-semibold"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <PlusCircle className="size-3.5" />}
          Log {type === "income" ? "Income" : "Expense"}
        </Button>
      </form>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/quick-log-card.tsx
git commit -m "feat(dashboard): add QuickLogCard with dynamic wallet currency"
```

---

### Task 5: Loan Action Card

**Files:**
- Create: `components/dashboard/loan-action-card.tsx`

**Interfaces:**
- Consumes: `Contact`, `OwedSummaries`, `createLoanAction`, `formatCurrency`
- Produces: `<LoanActionCard />`

- [ ] **Step 1: Create `components/dashboard/loan-action-card.tsx`**

```tsx
"use client"

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Contact, OwedSummaries } from "@/types"
import { createLoanAction } from "@/lib/actions/loans"
import { formatCurrency } from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency"
import { toast } from "sonner"
import { HandCoins, ArrowUpRight, ArrowDownLeft, Loader2, Link as LinkIcon } from "lucide-react"
import Link from "next/link"

interface LoanActionCardProps {
  contacts: Contact[]
  owedSummary: OwedSummaries
}

export function LoanActionCard({ contacts, owedSummary }: LoanActionCardProps) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<"lent" | "borrowed">("lent")
  const [contactId, setContactId] = useState(contacts[0]?._id?.toString() || "")
  const [amount, setAmount] = useState("")

  const currencySymbol = getCurrencySymbol(owedSummary.baseCurrency)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid loan amount")
      return
    }
    if (!contactId) {
      toast.error("Please select a contact")
      return
    }

    const selectedContact = contacts.find(c => c._id?.toString() === contactId)

    startTransition(async () => {
      const amountInCents = Math.round(numAmount * 100)
      const res = await createLoanAction({
        type,
        contactId,
        contactName: selectedContact?.name || "Contact",
        amount: amountInCents,
        currency: owedSummary.baseCurrency,
        date: new Date().toISOString(),
      })

      if (res.success) {
        toast.success(`Recorded ${type === "lent" ? "loan to" : "borrowing from"} ${selectedContact?.name}!`)
        setAmount("")
      } else {
        toast.error(res.error || "Failed to record loan")
      }
    })
  }

  return (
    <Card className="bento-tile flex h-full flex-col justify-between gap-4 border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            lending & debts
          </span>
          <Link href="/loans" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
            View all loans
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {/* Live position badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-500">
              <ArrowUpRight className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">You Lent</span>
              <span className="text-sm font-bold text-foreground truncate">
                {formatCurrency(owedSummary.totalLent, owedSummary.baseCurrency)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-500">
              <ArrowDownLeft className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">You Borrowed</span>
              <span className="text-sm font-bold text-foreground truncate">
                {formatCurrency(owedSummary.totalBorrowed, owedSummary.baseCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick loan record form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Quick Record</span>
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(val) => { if (val) setType(val as "lent" | "borrowed") }}
            className="bg-muted/40 p-0.5 rounded-lg border border-border/50"
          >
            <ToggleGroupItem
              value="lent"
              className="h-6 text-[11px] px-2 font-medium data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-500"
            >
              I Lent
            </ToggleGroupItem>
            <ToggleGroupItem
              value="borrowed"
              className="h-6 text-[11px] px-2 font-medium data-[state=on]:bg-amber-500/10 data-[state=on]:text-amber-500"
            >
              I Borrowed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Contact selector */}
          <Select value={contactId} onValueChange={setContactId} disabled={isPending}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {contacts.map((c) => (
                  <SelectItem key={c._id?.toString()} value={c._id?.toString() || ""}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Amount input */}
          <InputGroup className="h-9">
            <InputGroupAddon>{currencySymbol}</InputGroupAddon>
            <InputGroupInput
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              className="text-xs font-medium"
            />
          </InputGroup>
        </div>

        <Button type="submit" size="sm" disabled={isPending || !amount || !contactId} className="h-8 gap-1.5 text-xs font-semibold">
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <HandCoins className="size-3.5" />}
          Record {type === "lent" ? "Loan" : "Borrowing"}
        </Button>
      </form>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/loan-action-card.tsx
git commit -m "feat(dashboard): add LoanActionCard with live debt summaries"
```

---

### Task 6: Financial Health Arc Gauge & Executive KPI Benchmark Strip

**Files:**
- Create: `components/dashboard/financial-health-gauge-card.tsx`
- Create: `components/dashboard/executive-kpi-strip.tsx`

**Interfaces:**
- Consumes: `FinancialHealthScoreResult`, `formatCurrency`
- Produces: `<FinancialHealthGaugeCard />`, `<ExecutiveKpiStrip />`

- [ ] **Step 1: Create `components/dashboard/financial-health-gauge-card.tsx`**

```tsx
"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Activity } from "lucide-react"
import Link from "next/link"
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  score: {
    label: "Score",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface FinancialHealthGaugeCardProps {
  score: number
  tier: "needs_attention" | "fair" | "good" | "excellent"
  topRecommendation?: {
    title: string
    potentialPoints: number
    actionPath: string
  }
}

export function FinancialHealthGaugeCard({
  score,
  tier,
  topRecommendation,
}: FinancialHealthGaugeCardProps) {
  const tierColors = {
    needs_attention: { label: "Needs Attention", color: "text-rose-500", fill: "var(--color-rose, #f43f5e)" },
    fair: { label: "Fair", color: "text-amber-500", fill: "var(--color-amber, #f59e0b)" },
    good: { label: "Good", color: "text-blue-500", fill: "var(--color-blue, #3b82f6)" },
    excellent: { label: "Excellent", color: "text-emerald-500", fill: "var(--color-emerald, #10b981)" },
  }

  const currentTier = tierColors[tier] || tierColors.fair
  const data = [{ value: score, fill: currentTier.fill }]

  return (
    <Card className="bento-tile flex h-full flex-col justify-between border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <div className="flex items-center justify-between pb-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          financial health
        </span>
        <Badge variant="outline" className={`text-[10px] font-semibold uppercase ${currentTier.color}`}>
          {currentTier.label}
        </Badge>
      </div>

      {/* Radial Semi-Circular Arc */}
      <div className="relative flex flex-col items-center justify-center my-1 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="75%"
            innerRadius="65%"
            outerRadius="90%"
            barSize={14}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute top-[52%] flex flex-col items-center">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">/ 100</span>
        </div>
      </div>

      {/* Recommendation & Link */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
        {topRecommendation ? (
          <Link
            href={topRecommendation.actionPath}
            className="group flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="truncate pr-2">{topRecommendation.title}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-500 shrink-0 text-[11px]">
              +{topRecommendation.potentialPoints} pts
              <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <Link href="/health" className="flex items-center justify-between text-xs text-primary font-medium hover:underline">
            <span>Explore full score breakdown</span>
            <ArrowUpRight className="size-3" />
          </Link>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create `components/dashboard/executive-kpi-strip.tsx`**

```tsx
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, PiggyBank } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ExecutiveKpiStripProps {
  netWorth: number
  monthlyInflow: number
  monthlyOutflow: number
  currency: string
}

export function ExecutiveKpiStrip({
  netWorth,
  monthlyInflow,
  monthlyOutflow,
  currency,
}: ExecutiveKpiStripProps) {
  const netCashFlow = monthlyInflow - monthlyOutflow
  const savingsRate = monthlyInflow > 0 ? Math.round((netCashFlow / monthlyInflow) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Net Worth */}
      <Card className="bento-tile flex flex-col justify-between p-4.5 border-border/50 bg-card/60 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            total net worth
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <span className="text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(netWorth, currency)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Combined liquid & asset equity
          </span>
        </div>
      </Card>

      {/* Monthly Cash Flow */}
      <Card className="bento-tile flex flex-col justify-between p-4.5 border-border/50 bg-card/60 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            monthly cash flow
          </span>
          <div className={`flex size-7 items-center justify-center rounded-lg ${netCashFlow >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
            {netCashFlow >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <span className={`text-2xl font-black tracking-tight ${netCashFlow >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {netCashFlow >= 0 ? "+" : ""}{formatCurrency(netCashFlow, currency)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {formatCurrency(monthlyInflow, currency)} in · {formatCurrency(monthlyOutflow, currency)} out
          </span>
        </div>
      </Card>

      {/* Savings Rate */}
      <Card className="bento-tile flex flex-col justify-between p-4.5 border-border/50 bg-card/60 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            savings rate
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <PiggyBank className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <span className="text-2xl font-black tracking-tight text-foreground">
            {savingsRate}%
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${savingsRate >= 20 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Target 20%+</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/financial-health-gauge-card.tsx components/dashboard/executive-kpi-strip.tsx
git commit -m "feat(dashboard): add FinancialHealthGaugeCard and ExecutiveKpiStrip"
```

---

### Task 7: Visual Analytics: Upgraded Spending Trend & Category Donut Charts

**Files:**
- Modify: `components/dashboard/spending-trend-chart.tsx`
- Modify: `components/dashboard/category-breakdown.tsx`

**Interfaces:**
- Consumes: `initialData`, `currency`, shadcn chart primitives
- Produces: Enhanced `<SpendingTrendChart />` and `<CategoryBreakdown />` with `.bento-tile` class, clean header typography, and smooth Bézier curve interpolation.

- [ ] **Step 1: Upgrade `components/dashboard/spending-trend-chart.tsx` to match bento theme**

Add `.bento-tile` and translucent backdrop classes (`border-border/50 bg-card/60 backdrop-blur-xs`) to the outer card. Ensure the time range toggle (30d / 60d / 90d) updates dynamically with smooth curve transitions.

- [ ] **Step 2: Upgrade `components/dashboard/category-breakdown.tsx` to match bento theme**

Add `.bento-tile` and translucent backdrop classes. Verify the Donut chart renders cleanly in the 1-column slot with centered spend typography and responsive legend list.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/spending-trend-chart.tsx components/dashboard/category-breakdown.tsx
git commit -m "style(dashboard): polish spending trend and category breakdown charts for bento grid"
```

---

### Task 8: Active Goals Card

**Files:**
- Create: `components/dashboard/active-goals-card.tsx`

**Interfaces:**
- Consumes: `Goal[]`, `currency`
- Produces: `<ActiveGoalsCard />`

- [ ] **Step 1: Create `components/dashboard/active-goals-card.tsx`**

```tsx
import { Card } from "@/components/ui/card"
import { Goal } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { Target, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface ActiveGoalsCardProps {
  goals: Goal[]
  currency: string
}

export function ActiveGoalsCard({ goals, currency }: ActiveGoalsCardProps) {
  const activeGoals = goals.filter((g) => g.status === "active").slice(0, 3)

  return (
    <Card className="bento-tile flex h-full flex-col justify-between border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          savings goals
        </span>
        <Link href="/goals" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="flex flex-col gap-3 py-2">
        {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Target className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-foreground">No active goals</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Start saving for milestones.</p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const current = goal.currentAmount || 0
            const target = goal.targetAmount || 1
            const pct = Math.min(Math.round((current / target) * 100), 100)

            return (
              <div key={goal._id?.toString()} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate pr-2">{goal.name}</span>
                  <span className="font-mono font-medium text-muted-foreground shrink-0">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{formatCurrency(current, currency)}</span>
                  <span>Target {formatCurrency(target, currency)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="pt-2 border-t border-border/40">
        <Link
          href="/goals"
          className="inline-flex w-full items-center justify-center rounded-md border border-border/60 bg-muted/20 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          Manage All Goals
        </Link>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/active-goals-card.tsx
git commit -m "feat(dashboard): add ActiveGoalsCard component"
```

---

### Task 9: Bento Orchestrator with GSAP Entrance & Page Assembly

**Files:**
- Create: `components/dashboard/dashboard-bento.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `app/(dashboard)/dashboard/loading.tsx`
- Modify: `app/(dashboard)/dashboard/error.tsx`

**Interfaces:**
- Produces: Complete packed Bento Dashboard route with instant Suspense streaming and GSAP entrance.

- [ ] **Step 1: Create `components/dashboard/dashboard-bento.tsx`**

```tsx
"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { DashboardHeader } from "./dashboard-header"
import { FinancialFocusStrip } from "./financial-focus-strip"
import { CommandCenterCard } from "./command-center-card"
import { QuickLogCard } from "./quick-log-card"
import { LoanActionCard } from "./loan-action-card"
import { FinancialHealthGaugeCard } from "./financial-health-gauge-card"
import { ExecutiveKpiStrip } from "./executive-kpi-strip"
import { SpendingTrendChart } from "./spending-trend-chart"
import { CategoryBreakdown } from "./category-breakdown"
import { AIInsights } from "./ai-insights"
import { ActiveGoalsCard } from "./active-goals-card"
import { UpcomingRecurring } from "./upcoming-recurring"
import { BudgetProgressList } from "./budget-progress-list"
import { RecentTransactions } from "./recent-transactions"
import { Wallet, Category, Contact, Goal, DashboardFocusCounts, OwedSummaries } from "@/types"

interface DashboardBentoProps {
  userName: string
  scopeName?: string
  isOrganization?: boolean
  wallets: Wallet[]
  categories: Category[]
  contacts: Contact[]
  goals: Goal[]
  focusCounts: DashboardFocusCounts
  owedSummary: OwedSummaries
  healthScore: number
  healthTier: "needs_attention" | "fair" | "good" | "excellent"
  topRecommendation?: {
    title: string
    potentialPoints: number
    actionPath: string
  }
  netWorth: number
  monthlyInflow: number
  monthlyOutflow: number
  trendData: Array<{ date: string; income: number; expense: number }>
  categoryBreakdown: Array<{ name: string; amount: number; percentage: number; color?: string }>
  userId: string
  targetCurrency: string
  defaultWalletId?: string
}

export function DashboardBento({
  userName,
  scopeName,
  isOrganization,
  wallets,
  categories,
  contacts,
  goals,
  focusCounts,
  owedSummary,
  healthScore,
  healthTier,
  topRecommendation,
  netWorth,
  monthlyInflow,
  monthlyOutflow,
  trendData,
  categoryBreakdown,
  userId,
  targetCurrency,
  defaultWalletId,
}: DashboardBentoProps) {
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
    <div ref={containerRef} className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      {/* Header */}
      <DashboardHeader userName={userName} scopeName={scopeName} isOrganization={isOrganization} />

      {/* Row 0: Focus Badges */}
      <FinancialFocusStrip counts={focusCounts} />

      {/* Row 1: Command Center & Quick Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CommandCenterCard />
        </div>
        <div className="lg:col-span-1">
          <QuickLogCard
            wallets={wallets}
            categories={categories}
            defaultWalletId={defaultWalletId}
            baseCurrency={targetCurrency}
          />
        </div>
      </div>

      {/* Row 2: Loan Action & Financial Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LoanActionCard contacts={contacts} owedSummary={owedSummary} />
        </div>
        <div className="lg:col-span-1">
          <FinancialHealthGaugeCard
            score={healthScore}
            tier={healthTier}
            topRecommendation={topRecommendation}
          />
        </div>
      </div>

      {/* Row 3: Executive KPI Benchmark Strip */}
      <ExecutiveKpiStrip
        netWorth={netWorth}
        monthlyInflow={monthlyInflow}
        monthlyOutflow={monthlyOutflow}
        currency={targetCurrency}
      />

      {/* Row 4: Core Visual Analytics (Shadcn Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingTrendChart initialData={trendData} currency={targetCurrency} />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdown data={categoryBreakdown} currency={targetCurrency} />
        </div>
      </div>

      {/* Row 5: AI Spending Insights & Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AIInsights userId={userId} />
        </div>
        <div className="lg:col-span-1">
          <ActiveGoalsCard goals={goals} currency={targetCurrency} />
        </div>
      </div>

      {/* Row 6: Live Operations & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingRecurring userId={userId} />
        <BudgetProgressList userId={userId} />
      </div>

      {/* Row 7: Recent Transactions Stream */}
      <RecentTransactions userId={userId} />
    </div>
  )
}
```

- [ ] **Step 2: Assemble `app/(dashboard)/dashboard/page.tsx`**

Replace the contents of `app/(dashboard)/dashboard/page.tsx` to orchestrate parallel fetching:
```tsx
import type { Metadata } from "next"
import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope } from "@/lib/scope"
import { getPreferences } from "@/lib/queries/preferences"
import { getWallets } from "@/lib/queries/wallets"
import { getCategories } from "@/lib/queries/categories"
import { getContacts, getOwedSummaries } from "@/lib/queries/loans"
import { getGoals } from "@/lib/queries/goals"
import { getDashboardFocusCounts } from "@/lib/queries/dashboard"
import { getDailyIncomeExpenseTrend, getCategoryBreakdown } from "@/lib/queries/reports"
import { getFinancialHealthScore } from "@/lib/queries/financial-health"
import { getNetWorthSummary } from "@/lib/queries/net-worth"
import { DashboardBento } from "@/components/dashboard/dashboard-bento"
import { DashboardSkeleton } from "./loading"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "High-density overview of your finances, cash flow, and financial health.",
}

export default async function DashboardPage() {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const [
    prefs,
    wallets,
    categories,
    contacts,
    goals,
    owedSummary,
    focusCounts,
    trendData,
    categoryBreakdown,
    healthScoreData,
    netWorthData,
  ] = await Promise.all([
    getPreferences(userId),
    getWallets(userId),
    getCategories(userId),
    getContacts(),
    getGoals(userId),
    getOwedSummaries(),
    getDashboardFocusCounts(userId),
    getDailyIncomeExpenseTrend(userId),
    getCategoryBreakdown(userId),
    getFinancialHealthScore(userId),
    getNetWorthSummary(userId),
  ])

  const targetCurrency = prefs?.defaultCurrency || "USD"

  // Calculate monthly inflow & outflow from trendData for current month
  let monthlyInflow = 0
  let monthlyOutflow = 0
  for (const day of trendData) {
    monthlyInflow += day.income || 0
    monthlyOutflow += day.expense || 0
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardBento
        userName={session.user.name || "User"}
        scopeName={scope.isOrganization ? "Team" : "Personal"}
        isOrganization={scope.isOrganization}
        wallets={wallets}
        categories={categories}
        contacts={contacts}
        goals={goals}
        focusCounts={focusCounts}
        owedSummary={owedSummary}
        healthScore={healthScoreData.overallScore}
        healthTier={healthScoreData.tier}
        topRecommendation={healthScoreData.recommendations[0]}
        netWorth={netWorthData.currentNetWorth}
        monthlyInflow={monthlyInflow}
        monthlyOutflow={monthlyOutflow}
        trendData={trendData}
        categoryBreakdown={categoryBreakdown}
        userId={userId}
        targetCurrency={targetCurrency}
        defaultWalletId={prefs?.defaultWalletId}
      />
    </Suspense>
  )
}
```

- [ ] **Step 3: Update `app/(dashboard)/dashboard/loading.tsx` to match the exact 3-column Bento layout**

Mirror the exact rows using `<Skeleton />` cards with corresponding heights so the Suspense fallback feels native.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/dashboard-bento.tsx app/(dashboard)/dashboard/page.tsx app/(dashboard)/dashboard/loading.tsx
git commit -m "feat(dashboard): assemble packed Bento Dashboard with parallel data fetching"
```

---

### Task 10: End-to-End Verification & Quality Gates

**Files:**
- Whole workspace verification

- [ ] **Step 1: Run unit tests**

Run: `npx tsx --test lib/queries/__tests__/dashboard-focus.test.ts`  
Expected: PASS

- [ ] **Step 2: Run Next.js lint**

Run: `npm run lint`  
Expected: 0 errors

- [ ] **Step 3: Run Next.js build check**

Run: `npm run build`  
Expected: Successful build with zero type errors or broken imports

- [ ] **Step 4: Update roadmap status in `docs/superpowers/plans/dime-features-roadmap.md`**

Mark Feature #12 as completed in the roadmap document.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/dime-features-roadmap.md
git commit -m "docs(roadmap): mark Feature #12 Packed Bento Dashboard as completed"
```
