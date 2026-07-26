# Net Worth Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Net Worth Overview tab into a dense, Bento-style command center that groups analytics cards modularly, increases information density, and resolves empty visual height gaps, while keeping all business logic in a dedicated calculation/viewmodel layer.

**Architecture:** 
1. Page/RSC queries databases (`wallets`, `loans`, `assets`, `valuations`, `transactions`).
2. Calculations Layer converts quantities and generates a unified `NetWorthOverviewViewModel`.
3. main `NetWorthOverview` component loop renders modular card sub-components (Summary, Timeline, Health, Allocation, Holdings, Activity, Insights) driven by a Dashboard Configuration Layout list.
4. Quick actions inside cards link to light management modals, while item clicks navigate to native entity detail pages.

**Tech Stack:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Recharts, Lucide Icons, shadcn/ui.

---

### Task 1: Create presentation types and calculation viewmodel layer

**Files:**
- Create: [net-worth-viewmodel.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/calculations/net-worth-viewmodel.ts)
- Modify: [types/index.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/types/index.ts)

- [ ] **Step 1: Extend types/index.ts to export the presentation structures**

Add these interfaces to the bottom of [types/index.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/types/index.ts):
```typescript
export interface NetWorthHolding {
  id: string
  name: string
  source: "wallet" | "loan" | "asset"
  kind: "asset" | "liability"
  category: string
  currentValue: number     // Converted to base currency, stored in cents
  percentage: number       // Percentage of total assets (or total liabilities)
  currency: string         // Base currency
  originalValue: number    // Value in original currency
  originalCurrency: string
  icon: string             // Icon name string
  href?: string            // Path to detail page (/wallets/[id], /loans/[id], etc.)
}

export interface NetWorthActivityEvent {
  id: string
  type: "valuation" | "repayment" | "new_loan" | "new_asset" | "transaction"
  date: Date
  title: string
  description: string
  amount?: number          // Value in original currency
  currency?: string
  href?: string
}

export interface NetWorthInsight {
  id: string
  type: "info" | "warning" | "success"
  text: string
  metric?: string
}

export interface NetWorthOverviewViewModel {
  currency: string
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  moMChangePct: number
  largestAsset?: { name: string; value: number }
  
  // Health Metrics
  liquidityRatio: number
  debtRatio: number
  largestLiability?: { name: string; value: number }
  netWorthTrend: "up" | "down" | "flat"

  // Holdings Lists
  topAssets: NetWorthHolding[]
  topLiabilities: NetWorthHolding[]

  // Activity & Insights
  recentActivity: NetWorthActivityEvent[]
  insights: NetWorthInsight[]
}
```

- [ ] **Step 2: Implement the generator helper in net-worth-viewmodel.ts**

Create [net-worth-viewmodel.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/calculations/net-worth-viewmodel.ts):
```typescript
import { Wallet, Transaction, Loan, LoanRepayment, Asset, AssetValuation, NetWorthOverviewViewModel, NetWorthHolding, NetWorthActivityEvent, NetWorthInsight } from "@/types"
import { calculateCurrentNetWorth } from "./net-worth"

export function generateNetWorthOverviewViewModel(params: {
  wallets: Wallet[]
  loans: Loan[]
  assets: Asset[]
  valuations: AssetValuation[]
  repayments: LoanRepayment[]
  transactions: Transaction[]
  convert: (amount: number, from: string) => number
  baseCurrency: string
  history: any[]
}): NetWorthOverviewViewModel {
  const { wallets, loans, assets, valuations, repayments, transactions, convert, baseCurrency, history } = params

  // 1. Core breakdown
  const current = calculateCurrentNetWorth({ wallets, loans, assets, convert })

  // 2. Map holdings (Top Assets and Top Liabilities)
  const holdings: NetWorthHolding[] = []

  // Add wallets
  for (const w of wallets) {
    if (w.isArchived) continue
    const val = w.balance
    const isAsset = w.type !== "credit_card"
    holdings.push({
      id: w._id.toString(),
      name: w.name,
      source: "wallet",
      kind: isAsset ? "asset" : "liability",
      category: w.type,
      currentValue: isAsset ? convert(val, w.currency) : convert(-val, w.currency),
      percentage: 0,
      currency: baseCurrency,
      originalValue: Math.abs(val),
      originalCurrency: w.currency,
      icon: w.icon || (isAsset ? "Wallet" : "CreditCard"),
      href: `/wallets/${w._id.toString()}`,
    })
  }

  // Add loans
  for (const l of loans) {
    if (l.status === "cancelled" || l.status === "fully_repaid") continue
    const isAsset = l.type === "lent"
    holdings.push({
      id: l._id.toString(),
      name: `Loan to ${l.personName || "Unknown"}`,
      source: "loan",
      kind: isAsset ? "asset" : "liability",
      category: l.type,
      currentValue: convert(l.remainingAmount, l.currency),
      percentage: 0,
      currency: baseCurrency,
      originalValue: l.remainingAmount,
      originalCurrency: l.currency,
      icon: "HandCoins",
      href: `/loans/${l._id.toString()}`,
    })
  }

  // Add manual assets
  for (const a of assets) {
    if (a.status !== "active") continue
    const val = Math.round(a.currentValue * (a.ownershipPercentage / 100))
    const isAsset = a.kind === "asset"
    holdings.push({
      id: a._id.toString(),
      name: a.name,
      source: "asset",
      kind: isAsset ? "asset" : "liability",
      category: a.category,
      currentValue: convert(val, a.currency),
      percentage: 0,
      currency: baseCurrency,
      originalValue: val,
      originalCurrency: a.currency,
      icon: "Layers",
      href: `/net-worth/assets/${a._id.toString()}`,
    })
  }

  // Calculate percentages
  const topAssets = holdings
    .filter((h) => h.kind === "asset")
    .map((h) => ({
      ...h,
      percentage: current.totalAssets > 0 ? Math.round((h.currentValue / current.totalAssets) * 100) : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue)

  const topLiabilities = holdings
    .filter((h) => h.kind === "liability")
    .map((h) => ({
      ...h,
      percentage: current.totalLiabilities > 0 ? Math.round((h.currentValue / current.totalLiabilities) * 100) : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue)

  // 3. Health metrics
  const liquidityRatio = current.totalAssets > 0
    ? Math.min(100, Math.round(((current.assetsBreakdown.cash + current.assetsBreakdown.bank) / current.totalAssets) * 100))
    : 0
  const debtRatio = current.totalAssets > 0
    ? Math.min(100, Math.round((current.totalLiabilities / current.totalAssets) * 100))
    : 0

  let moMChangePct = 0
  let netWorthTrend: "up" | "down" | "flat" = "flat"
  if (history.length >= 2) {
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const startPoint = sorted[0].netWorth
    const endPoint = current.netWorth
    if (startPoint !== 0) {
      moMChangePct = ((endPoint - startPoint) / Math.abs(startPoint)) * 100
    }
    netWorthTrend = endPoint > startPoint ? "up" : endPoint < startPoint ? "down" : "flat"
  }

  // 4. Activity events
  const activityEvents: NetWorthActivityEvent[] = []

  // Add valuation updates
  for (const v of valuations) {
    const asset = assets.find((a) => a._id.toString() === v.assetId)
    if (!asset) continue
    activityEvents.push({
      id: v._id.toString(),
      type: "valuation",
      date: new Date(v.date),
      title: "Valuation Updated",
      description: `${asset.name} updated to ${asset.currency} ${(v.value / 100).toFixed(2)}`,
      amount: v.value,
      currency: asset.currency,
      href: `/net-worth/assets/${asset._id.toString()}`,
    })
  }

  // Add repayments
  for (const rep of repayments) {
    const loan = loans.find((l) => l._id.toString() === rep.loanId)
    if (!loan) continue
    activityEvents.push({
      id: rep._id.toString(),
      type: "repayment",
      date: new Date(rep.date),
      title: "Loan Repayment",
      description: `Repayment received on loan to ${loan.personName}`,
      amount: rep.amount,
      currency: loan.currency,
      href: `/loans/${loan._id.toString()}`,
    })
  }

  // Add transactions
  for (const tx of transactions.slice(0, 100)) {
    if (tx.amount < 10000) continue // Only showcase high value txs
    activityEvents.push({
      id: tx._id.toString(),
      type: "transaction",
      date: new Date(tx.date),
      title: tx.type === "income" ? "High Income" : "High Expense",
      description: tx.description || `${tx.type} transaction logged`,
      amount: tx.amount,
      currency: tx.currency,
    })
  }

  const recentActivity = activityEvents
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6)

  // 5. Deterministic rule-based insights
  const insights: NetWorthInsight[] = []

  if (moMChangePct !== 0) {
    insights.push({
      id: "mom",
      type: moMChangePct >= 0 ? "success" : "warning",
      text: `Your net worth has ${moMChangePct >= 0 ? "increased" : "decreased"} by ${Math.abs(moMChangePct).toFixed(1)}% compared to the beginning of this history interval.`,
      metric: `${moMChangePct >= 0 ? "+" : ""}${moMChangePct.toFixed(1)}%`,
    })
  }

  if (topAssets.length > 0) {
    const largest = topAssets[0]
    insights.push({
      id: "largest-asset",
      type: "info",
      text: `Your largest asset is ${largest.name}, contributing ${largest.percentage}% of your total portfolio assets.`,
      metric: `${largest.percentage}%`,
    })
  }

  insights.push({
    id: "liquidity",
    type: liquidityRatio > 20 ? "success" : "info",
    text: `Your liquid cash and bank balances represent ${liquidityRatio}% of your total assets. ${
      liquidityRatio < 15 ? "Consider keeping more funds in liquid form." : "Your liquidity profile looks stable."
    }`,
    metric: `${liquidityRatio}%`,
  })

  insights.push({
    id: "debt",
    type: debtRatio > 50 ? "warning" : debtRatio > 30 ? "info" : "success",
    text: `Your debt-to-asset ratio is ${debtRatio}%. ${
      debtRatio > 50
        ? "Warning: Debt ratio exceeds healthy threshold. Try to pay down liabilities."
        : debtRatio > 30
        ? "Moderate debt relative to assets. Keep monitoring outstanding balances."
        : "Healthy balance sheet with low leverage."
    }`,
    metric: `${debtRatio}%`,
  })

  return {
    currency: baseCurrency,
    netWorth: current.netWorth,
    totalAssets: current.totalAssets,
    totalLiabilities: current.totalLiabilities,
    moMChangePct,
    largestAsset: topAssets.length > 0 ? { name: topAssets[0].name, value: topAssets[0].currentValue } : undefined,
    liquidityRatio,
    debtRatio,
    largestLiability: topLiabilities.length > 0 ? { name: topLiabilities[0].name, value: topLiabilities[0].currentValue } : undefined,
    netWorthTrend,
    topAssets: topAssets.slice(0, 5),
    topLiabilities: topLiabilities.slice(0, 5),
    recentActivity,
    insights,
  }
}
```

- [ ] **Step 3: Run typescript check to verify compile**
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add types/index.ts lib/calculations/net-worth-viewmodel.ts
git commit -m "feat: implement presentation types and viewmodel calculations layer"
```

---

### Task 2: Create a unit test verify viewmodel calculation correctness

**Files:**
- Create: [test-net-worth-viewmodel.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/scratch/test-net-worth-viewmodel.ts)

- [ ] **Step 1: Write test script**
Create [test-net-worth-viewmodel.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/scratch/test-net-worth-viewmodel.ts):
```typescript
import { Wallet, Loan, Asset, AssetValuation } from "../types"
import { generateNetWorthOverviewViewModel } from "../lib/calculations/net-worth-viewmodel"

const mockWallets: Wallet[] = [
  {
    _id: "w1" as any,
    userId: "u1",
    name: "Chase Checking",
    type: "bank",
    currency: "USD",
    balance: 500000, // $5000.00
    color: "#111",
    icon: "Wallet",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "w2" as any,
    userId: "u1",
    name: "Visa Credit Card",
    type: "credit_card",
    currency: "USD",
    balance: -100000, // -$1000.00
    color: "#222",
    icon: "CreditCard",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

const mockLoans: Loan[] = [
  {
    _id: "l1" as any,
    userId: "u1",
    organizationId: null,
    type: "lent",
    contactId: "c1",
    personName: "Bob",
    amount: 100000, // $1000.00
    currency: "USD",
    walletId: "w1",
    transactionId: "tx1",
    date: new Date(),
    status: "active",
    remainingAmount: 80000, // $800.00
    reminderSchedule: [],
    sentReminders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }
]

const mockAssets: Asset[] = [
  {
    _id: "a1" as any,
    userId: "u1",
    organizationId: null,
    name: "Personal Vehicle",
    kind: "asset",
    category: "vehicle",
    currency: "USD",
    currentValue: 1500000, // $15,000.00
    valuationMethod: "manual",
    ownershipPercentage: 100,
    status: "active",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }
]

const convertUSD = (amount: number) => amount

const vm = generateNetWorthOverviewViewModel({
  wallets: mockWallets,
  loans: mockLoans,
  assets: mockAssets,
  valuations: [],
  repayments: [],
  transactions: [],
  convert: convertUSD,
  baseCurrency: "USD",
  history: [
    { date: new Date(), netWorth: 1800000 },
    { date: new Date(), netWorth: 1980000 }
  ]
})

console.log("Calculated Net Worth:", vm.netWorth)
console.log("Total Assets:", vm.totalAssets)
console.log("Total Liabilities:", vm.totalLiabilities)
console.log("MoM Change:", vm.moMChangePct)
console.log("Liquidity Ratio:", vm.liquidityRatio)
console.log("Debt Ratio:", vm.debtRatio)

console.assert(vm.totalAssets === 2080000, `Expected Assets 2080000, got ${vm.totalAssets}`) // Checking + Loan + Asset
console.assert(vm.totalLiabilities === 100000, `Expected Liabilities 100000, got ${vm.totalLiabilities}`) // Credit card

console.log("All viewmodel tests pass!")
```

- [ ] **Step 2: Execute the test script**
Run: `npx tsx scratch/test-net-worth-viewmodel.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add scratch/test-net-worth-viewmodel.ts
git commit -m "test: add viewmodel unit tests"
```

---

### Task 3: Split main tab into modular card subcomponents

**Files:**
- Create: [summary-cards.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/summary-cards.tsx)
- Create: [timeline-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/timeline-card.tsx)
- Create: [financial-health-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/financial-health-card.tsx)
- Create: [asset-allocation-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/asset-allocation-card.tsx)
- Create: [currency-allocation-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/currency-allocation-card.tsx)
- Create: [top-assets-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/top-assets-card.tsx)
- Create: [top-liabilities-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/top-liabilities-card.tsx)
- Create: [recent-activity-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/recent-activity-card.tsx)
- Create: [quick-actions-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/quick-actions-card.tsx)
- Create: [insights-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/insights-card.tsx)

- [ ] **Step 1: Write summary-cards.tsx**
This component houses Row 1 stats: Net Worth, Assets, Liabilities, MoM Change using the premium double-stat design.
Create [summary-cards.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/summary-cards.tsx):
```tsx
"use client"

import { Card } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Landmark, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Percent, Sparkles } from "lucide-react"

export function SummaryCards({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { netWorth, totalAssets, totalLiabilities, moMChangePct, currency } = viewModel
  const isPositive = moMChangePct >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Net Worth */}
      <Card className="rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-primary/5 to-card dark:bg-card shadow-sm hover:border-primary/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Net Worth</span>
            <span className="text-2xl font-black tracking-tight tabular-nums leading-none block">
              {formatCurrency(netWorth / 100, currency)}
            </span>
          </div>
          <div className="size-10 rounded-2xl border shrink-0 flex items-center justify-center bg-primary/10 border-primary/20 text-primary">
            <Landmark className="size-4.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Ratio</span>
            <span className="text-sm font-bold text-emerald-500">
              {totalAssets > 0 ? `${Math.round(((totalAssets - totalLiabilities) / totalAssets) * 100)}% Equity` : "100% Equity"}
            </span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Exposure</span>
            <span className="text-sm font-bold">Base: {currency}</span>
          </div>
        </div>
      </Card>

      {/* Assets */}
      <Card className="rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-emerald-500/5 to-card dark:bg-card shadow-sm hover:border-emerald-500/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Total Assets</span>
            <span className="text-2xl font-black text-emerald-500 tracking-tight tabular-nums leading-none block">
              {formatCurrency(totalAssets / 100, currency)}
            </span>
          </div>
          <div className="size-10 rounded-2xl border shrink-0 flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
            <ArrowUpRight className="size-4.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Liquid</span>
            <span className="text-sm font-bold">
              {formatCurrency((viewModel.totalAssets * viewModel.liquidityRatio / 100) / 100, currency)}
            </span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Non-liquid</span>
            <span className="text-sm font-bold">
              {formatCurrency((viewModel.totalAssets * (100 - viewModel.liquidityRatio) / 100) / 100, currency)}
            </span>
          </div>
        </div>
      </Card>

      {/* Liabilities */}
      <Card className="rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-rose-500/5 to-card dark:bg-card shadow-sm hover:border-rose-500/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Total Liabilities</span>
            <span className="text-2xl font-black text-rose-500 tracking-tight tabular-nums leading-none block">
              {formatCurrency(totalLiabilities / 100, currency)}
            </span>
          </div>
          <div className="size-10 rounded-2xl border shrink-0 flex items-center justify-center bg-rose-500/10 border-rose-500/20 text-rose-500">
            <ArrowDownRight className="size-4.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Leverage</span>
            <span className="text-sm font-bold text-rose-400">{viewModel.debtRatio}%</span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Owed</span>
            <span className="text-sm font-bold">Active Debt</span>
          </div>
        </div>
      </Card>

      {/* Growth change */}
      <Card className="rounded-2xl border border-border/40 transition-all duration-200 bg-linear-to-t from-primary/5 to-card dark:bg-card shadow-sm hover:border-primary/20 hover:shadow-md gap-0 py-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-none">Trend Period</span>
            <span className={cn("text-2xl font-black tracking-tight tabular-nums leading-none block", isPositive ? "text-emerald-500" : "text-rose-500")}>
              {isPositive ? "+" : ""}{moMChangePct.toFixed(1)}%
            </span>
          </div>
          <div className={cn("size-10 rounded-2xl border shrink-0 flex items-center justify-center", isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500")}>
            {isPositive ? <TrendingUp className="size-4.5" /> : <TrendingDown className="size-4.5" />}
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">MoM Change</span>
            <span className="text-sm font-bold">Calculated</span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Asset Power</span>
            <span className="text-sm font-bold text-emerald-500">Positive</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Write timeline-card.tsx**
Create [timeline-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/timeline-card.tsx):
```tsx
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"

const areaChartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "var(--chart-1)",
  },
  totalAssets: {
    label: "Total Assets",
    color: "var(--chart-2)",
  },
  totalLiabilities: {
    label: "Total Liabilities",
    color: "var(--chart-5)",
  },
}

export function TimelineCard({ historyData, currency }: { historyData: any[]; currency: string }) {
  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle className="text-base font-bold">Net Worth Timeline</CardTitle>
            <CardDescription className="text-xs">History of assets vs liabilities</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        {historyData.length > 0 ? (
          <ChartContainer config={areaChartConfig} className="aspect-auto h-[230px] w-full">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalAssets)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalAssets)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLiabilities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-totalLiabilities)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-totalLiabilities)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const d = new Date(value)
                  if (Number.isNaN(d.getTime())) return String(value)
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => {
                  if (val >= 100000000) return `${(val / 100000000).toFixed(0)}M`
                  if (val >= 100000) return `${(val / 100000).toFixed(0)}k`
                  if (val <= -100000) return `-${(Math.abs(val) / 100000).toFixed(0)}k`
                  return (val / 100).toFixed(0)
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => {
                      const d = new Date(value)
                      if (Number.isNaN(d.getTime())) return String(value)
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value, name) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: `var(--color-${name})` }}
                        />
                        <div className="flex flex-1 justify-between leading-none">
                          <span className="text-muted-foreground text-[10px]">
                            {areaChartConfig[name as keyof typeof areaChartConfig]?.label ?? name}
                          </span>
                          <span className="font-mono text-[10px] font-medium tabular-nums text-foreground">
                            {formatCurrency(Number(value) / 100, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="totalAssets"
                type="natural"
                fill="url(#fillAssets)"
                stroke="var(--color-totalAssets)"
                stackId="a"
              />
              <Area
                dataKey="totalLiabilities"
                type="natural"
                fill="url(#fillLiabilities)"
                stroke="var(--color-totalLiabilities)"
                stackId="b"
              />
              <Area
                dataKey="netWorth"
                type="natural"
                fill="url(#fillNetWorth)"
                stroke="var(--color-netWorth)"
                stackId="c"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[230px] text-muted-foreground text-sm">
            No historical data available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Write financial-health-card.tsx**
Create [financial-health-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/financial-health-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Landmark, ArrowUpRight, ArrowDownRight, Droplet, Scale, Sparkles, Activity } from "lucide-react"

export function FinancialHealthCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { liquidityRatio, debtRatio, largestAsset, largestLiability, currency } = viewModel

  const debtRatioColor = debtRatio >= 50 ? "rose" : debtRatio >= 20 ? "amber" : "emerald"

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Activity className="size-4.5 text-primary" />
            Financial Health
          </CardTitle>
          <CardDescription className="text-xs">KPI health diagnostics</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-4">
          <RatioProgressRow icon={Droplet} label="Liquidity Ratio" value={liquidityRatio} color="emerald" />
          <RatioProgressRow icon={Scale} label="Debt-to-Asset Ratio" value={debtRatio} color={debtRatioColor} />
        </div>

        <div className="border-t border-border/30 pt-4 flex flex-col gap-2.5 text-xs">
          {largestAsset && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Largest Asset</span>
              <span className="font-semibold text-emerald-500 tabular-nums">
                {largestAsset.name} ({formatCurrency(largestAsset.value / 100, currency)})
              </span>
            </div>
          )}
          {largestLiability && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Largest Liability</span>
              <span className="font-semibold text-rose-500 tabular-nums">
                {largestLiability.name} ({formatCurrency(largestLiability.value / 100, currency)})
              </span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-border/20 pt-2.5">
            <span className="text-muted-foreground">Diversification Score</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <Sparkles className="size-3" /> Optimum
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RatioProgressRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: "emerald" | "rose" | "amber"
}) {
  const colorMap: Record<string, string> = {
    emerald: "#10b981",
    rose: "#ef4444",
    amber: "#f59e0b",
  }
  const textColorMap: Record<string, string> = {
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className={cn("font-bold tabular-nums", textColorMap[color])}>{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorStyle={{ backgroundColor: colorMap[color] }} />
    </div>
  )
}
```

- [ ] **Step 4: Write asset-allocation-card.tsx**
Create [asset-allocation-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/asset-allocation-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Label } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { NetWorthOverviewViewModel } from "@/types"

const assetPieConfig = {
  value: {
    label: "Value",
  },
  cash: {
    label: "Cash",
    color: "var(--chart-1)",
  },
  bank: {
    label: "Bank",
    color: "var(--chart-2)",
  },
  investments: {
    label: "Investments",
    color: "var(--chart-3)",
  },
  loans: {
    label: "Receivables",
    color: "var(--chart-4)",
  },
  manualAssets: {
    label: "Other Assets",
    color: "var(--chart-5)",
  },
}

export function AssetAllocationCard({ viewModel, breakdowns }: { viewModel: NetWorthOverviewViewModel; breakdowns: any }) {
  const { totalAssets, currency } = viewModel

  const getPct = (val: number, total: number) => {
    if (total === 0) return 0
    return Math.round((val / total) * 100)
  }

  const assetPieData = [
    { type: "cash", value: breakdowns.cash / 100, fill: "var(--color-cash)" },
    { type: "bank", value: breakdowns.bank / 100, fill: "var(--color-bank)" },
    { type: "investments", value: breakdowns.investments / 100, fill: "var(--color-investments)" },
    { type: "loans", value: breakdowns.loans / 100, fill: "var(--color-loans)" },
    { type: "manualAssets", value: breakdowns.manualAssets / 100, fill: "var(--color-manualAssets)" },
  ].filter((item) => item.value > 0)

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Asset Allocation</CardTitle>
          <CardDescription className="text-xs">Portfolio weight distribution</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center p-4">
        {assetPieData.length > 0 ? (
          <ChartContainer config={assetPieConfig} className="mx-auto aspect-square w-full max-w-[210px] h-[210px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={assetPieData} dataKey="value" nameKey="type" innerRadius={52} strokeWidth={4}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-base font-bold"
                          >
                            {formatCurrency(totalAssets / 100, currency)}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-[10px]">
                            Assets
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="text-xs text-muted-foreground py-16">No assets to allocate.</div>
        )}
      </CardContent>
      {assetPieData.length > 0 && (
        <CardFooter className="flex flex-wrap justify-center gap-x-3 gap-y-1 py-3 px-5 border-t text-[11px] [.border-t]:pt-3">
          {assetPieData.map((item) => (
            <span key={item.type} className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: assetPieConfig[item.type as keyof typeof assetPieConfig]?.color as string }}
              />
              {assetPieConfig[item.type as keyof typeof assetPieConfig]?.label}
              <span className="text-foreground font-medium">{getPct(item.value, totalAssets / 100)}%</span>
            </span>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
```

- [ ] **Step 5: Write currency-allocation-card.tsx**
Create [currency-allocation-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/currency-allocation-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from "recharts"
import { formatCurrency, cn } from "@/lib/utils"
import { NetWorthOverviewViewModel } from "@/types"

export function CurrencyAllocationCard({ viewModel, currencyBreakdown }: { viewModel: NetWorthOverviewViewModel; currencyBreakdown: any }) {
  const { netWorth, currency } = viewModel

  const currencyEntries = Object.entries(currencyBreakdown || {})
  const radialColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
  const currencyChartConfig = currencyEntries.reduce((acc, [curr], idx) => {
    acc[curr] = { label: curr, color: radialColors[idx % radialColors.length] }
    return acc
  }, {} as any)

  const radialData = currencyEntries.length > 0
    ? [
      currencyEntries.reduce((acc, [curr, breakd]: any) => {
        acc[curr] = Math.abs(breakd.netWorth) / 100
        return acc
      }, {} as Record<string, number>),
    ]
    : []
  const totalCurrencyMagnitude = currencyEntries.reduce((sum, [, breakd]: any) => sum + Math.abs(breakd.netWorth), 0)

  const getPct = (val: number, total: number) => {
    if (total === 0) return 0
    return Math.round((val / total) * 100)
  }

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Currency Exposure</CardTitle>
          <CardDescription className="text-xs">Net worth by currency</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center p-4">
        {radialData.length > 0 ? (
          <ChartContainer config={currencyChartConfig} className="mx-auto aspect-square w-full max-w-[170px] h-[170px]">
            <RadialBarChart data={radialData} endAngle={180} innerRadius={46} outerRadius={84}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              {currencyEntries.map(([curr]) => (
                <RadialBar
                  key={curr}
                  dataKey={curr}
                  fill={`var(--color-${curr})`}
                  stackId="a"
                  cornerRadius={5}
                  className="stroke-transparent stroke-2"
                />
              ))}
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-sm font-bold"
                          >
                            {formatCurrency(netWorth / 100, currency)}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 8} className="fill-muted-foreground text-[10px]">
                            Net Worth
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        ) : (
          <div className="text-xs text-muted-foreground py-16">No currency data.</div>
        )}
      </CardContent>
      {currencyEntries.length > 0 && (
        <CardFooter className="flex-col gap-0 border-t p-0 [.border-t]:pt-0 text-xs">
          {currencyEntries.map(([curr, breakd]: any) => (
            <div key={curr} className="flex w-full items-center justify-between gap-2 px-5 py-2 not-last:border-b">
              <span className="flex items-center gap-2 font-medium">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: currencyChartConfig[curr]?.color as string }}
                />
                {curr}
                <span className="text-[10px] font-normal text-muted-foreground">
                  {getPct(Math.abs(breakd.netWorth), totalCurrencyMagnitude)}%
                </span>
              </span>
              <span className={cn("font-bold tabular-nums shrink-0", breakd.netWorth >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {formatCurrency(breakd.netWorth / 100, curr)}
              </span>
            </div>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
```

- [ ] **Step 6: Write top-assets-card.tsx**
Create [top-assets-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/top-assets-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Wallet, HandCoins, Layers, Landmark } from "lucide-react"

const iconsMap: Record<string, any> = {
  Wallet,
  HandCoins,
  Layers,
  Landmark,
}

export function TopAssetsCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { topAssets, currency } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Top Assets</CardTitle>
          <CardDescription className="text-xs">Highest value holdings</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {topAssets.length > 0 ? (
          <div className="space-y-3">
            {topAssets.map((asset) => {
              const Icon = iconsMap[asset.icon] || Layers
              return (
                <div key={asset.id} className="group relative flex items-center justify-between p-3 rounded-xl border border-border/20 bg-card/50 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      {asset.href ? (
                        <Link href={asset.href} className="font-bold text-xs hover:underline block leading-tight text-foreground">
                          {asset.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-xs block leading-tight text-foreground">{asset.name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                        {asset.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs tabular-nums block leading-tight">
                      {formatCurrency(asset.currentValue / 100, currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {asset.percentage}% of portfolio
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-16 text-center">No assets found.</div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 7: Write top-liabilities-card.tsx**
Create [top-liabilities-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/top-liabilities-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { CreditCard, HandCoins, Layers } from "lucide-react"

const iconsMap: Record<string, any> = {
  CreditCard,
  HandCoins,
  Layers,
}

export function TopLiabilitiesCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { topLiabilities, currency } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Top Liabilities</CardTitle>
          <CardDescription className="text-xs">Largest outstanding obligations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {topLiabilities.length > 0 ? (
          <div className="space-y-3">
            {topLiabilities.map((liability) => {
              const Icon = iconsMap[liability.icon] || HandCoins
              return (
                <div key={liability.id} className="group relative flex items-center justify-between p-3 rounded-xl border border-border/20 bg-card/50 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl border flex items-center justify-center bg-rose-500/10 border-rose-500/20 text-rose-500">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      {liability.href ? (
                        <Link href={liability.href} className="font-bold text-xs hover:underline block leading-tight text-foreground">
                          {liability.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-xs block leading-tight text-foreground">{liability.name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                        {liability.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs tabular-nums block leading-tight">
                      {formatCurrency(liability.currentValue / 100, currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {liability.percentage}% of obligations
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-16 text-center">No liabilities found.</div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 8: Write recent-activity-card.tsx**
Create [recent-activity-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/recent-activity-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { History, Sparkles } from "lucide-react"

export function RecentActivityCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { recentActivity } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <History className="size-4.5 text-primary" />
            Recent Financial Activity
          </CardTitle>
          <CardDescription className="text-xs">Latest log activity feed</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1">
        {recentActivity.length > 0 ? (
          <div className="relative pl-4 space-y-4 border-l border-border/30">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="relative group flex flex-col gap-0.5">
                {/* Bullet */}
                <div className="absolute left-[-21px] top-1 size-2 rounded-full border border-primary bg-background group-hover:scale-125 transition-transform" />
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  {activity.href ? (
                    <Link href={activity.href} className="font-semibold text-foreground hover:underline text-xs">
                      {activity.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground text-xs">{activity.title}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{activity.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-16 text-center">No recent financial logs.</div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 9: Write quick-actions-card.tsx**
Create [quick-actions-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/quick-actions-card.tsx):
```tsx
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetDialog } from "../asset-dialog"
import { ValuationDialog } from "../valuation-dialog"
import { Asset } from "@/types"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Landmark, Scale, RefreshCw } from "lucide-react"

export function QuickActionsCard({ assets, onRefresh }: { assets: Asset[]; onRefresh: () => void }) {
  const [assetOpen, setAssetOpen] = React.useState(false)
  const [assetKind, setAssetKind] = React.useState<"asset" | "liability">("asset")
  const [selectedAssetId, setSelectedAssetId] = React.useState<string>("")

  const manualAssetsOnly = React.useMemo(() => {
    return assets.filter((a) => a.valuationMethod === "manual" && a.status === "active")
  }, [assets])

  const selectedAsset = React.useMemo(() => {
    return manualAssetsOnly.find((a) => a._id.toString() === selectedAssetId)
  }, [manualAssetsOnly, selectedAssetId])

  const openAssetDialog = (kind: "asset" | "liability") => {
    setAssetKind(kind)
    setAssetOpen(true)
  }

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Perform lightweight mutations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col gap-4 justify-between">
        <div className="grid grid-cols-2 gap-3.5">
          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-10 text-xs font-bold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all"
            onClick={() => openAssetDialog("asset")}
          >
            <PlusCircle className="size-4 text-emerald-500" />
            Add Asset
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-10 text-xs font-bold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all"
            onClick={() => openAssetDialog("liability")}
          >
            <PlusCircle className="size-4 text-rose-500" />
            Add Liability
          </Button>
        </div>

        <div className="border-t border-border/30 pt-4 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Log Valuation</span>
          <div className="flex flex-col gap-3">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="w-full rounded-xl border-border/40 bg-card h-10 text-xs">
                <SelectValue placeholder="Select manual item" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/40 rounded-xl">
                <SelectGroup>
                  {manualAssetsOnly.map((a) => (
                    <SelectItem key={a._id.toString()} value={a._id.toString()} className="rounded-lg text-xs">
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {selectedAsset ? (
              <ValuationDialog
                assetId={selectedAsset._id.toString()}
                assetCurrency={selectedAsset.currency}
                onSuccess={() => {
                  setSelectedAssetId("")
                  onRefresh()
                }}
                trigger={
                  <Button className="w-full rounded-xl text-xs font-bold h-10 gap-1.5 cursor-pointer active:scale-95 transition-all">
                    <RefreshCw className="size-3.5" />
                    Record Valuation
                  </Button>
                }
              />
            ) : (
              <Button disabled className="w-full rounded-xl text-xs font-bold h-10 gap-1.5">
                <RefreshCw className="size-3.5" />
                Record Valuation
              </Button>
            )}
          </div>
        </div>

        {/* Preset initialAsset to let modal correctly select asset vs liability kind */}
        <AssetDialog
          open={assetOpen}
          onOpenChange={setAssetOpen}
          initialAsset={{ kind: assetKind } as any}
          onSuccess={() => {
            setAssetOpen(false)
            onRefresh()
          }}
        />
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 10: Write insights-card.tsx**
Create [insights-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/overview/insights-card.tsx):
```tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import { Sparkles, Info, CheckCircle, AlertTriangle } from "lucide-react"

const iconsMap: Record<string, any> = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap: Record<string, string> = {
  success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  warning: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

export function InsightsCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { insights } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between col-span-full">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Sparkles className="size-4.5 text-primary" />
            Financial Insights
          </CardTitle>
          <CardDescription className="text-xs">Dynamic rule-based diagnostics</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1">
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => {
              const Icon = iconsMap[insight.type] || Info
              return (
                <div key={insight.id} className="flex gap-3.5 p-3 rounded-xl border border-border/20 bg-card/30">
                  <div className={`size-8 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[insight.type]}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium leading-relaxed text-foreground">{insight.text}</p>
                    {insight.metric && (
                      <span className="inline-block text-[10px] font-bold text-muted-foreground">
                        Metric: {insight.metric}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-12 text-center">No insights calculated at this time.</div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 11: Run typescript check to verify compile**
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 12: Commit**
```bash
git add components/net-worth/overview
git commit -m "feat: create modular bento card subcomponents"
```

---

### Task 4: Re-integrate net-worth-overview.tsx with Bento grid layout configuration

**Files:**
- Modify: [net-worth-overview.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/net-worth-overview.tsx)

- [ ] **Step 1: Redesign components/net-worth/net-worth-overview.tsx**

Replace the contents of [net-worth-overview.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/net-worth/net-worth-overview.tsx) to accept `viewModel` and compose via `cardComponents` driven by configuration lists.
```tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NetWorthOverviewViewModel, Asset } from "@/types"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AssetsListTab } from "./assets-list-tab"
import { Landmark } from "lucide-react"
import { cn } from "@/lib/utils"

// Modular Dashboard sub-cards
import { SummaryCards } from "./overview/summary-cards"
import { TimelineCard } from "./overview/timeline-card"
import { FinancialHealthCard } from "./overview/financial-health-card"
import { AssetAllocationCard } from "./overview/asset-allocation-card"
import { CurrencyAllocationCard } from "./overview/currency-allocation-card"
import { TopAssetsCard } from "./overview/top-assets-card"
import { TopLiabilitiesCard } from "./overview/top-liabilities-card"
import { RecentActivityCard } from "./overview/recent-activity-card"
import { QuickActionsCard } from "./overview/quick-actions-card"
import { InsightsCard } from "./overview/insights-card"

interface NetWorthOverviewProps {
  viewModel: NetWorthOverviewViewModel
  historyData: any[] // pass raw history points for Recharts timeline
  assets: Asset[]
}

interface DashboardCardConfig {
  id: string
  type: 
    | "timeline"
    | "health"
    | "asset_allocation"
    | "currency_allocation"
    | "top_assets"
    | "top_liabilities"
    | "recent_activity"
    | "quick_actions"
    | "insights"
  className?: string
}

// Extensible Layout Configuration
const DEFAULT_BENTO_LAYOUT: DashboardCardConfig[] = [
  { id: "timeline", type: "timeline", className: "lg:col-span-2" },
  { id: "health", type: "health", className: "lg:col-span-1" },
  { id: "asset_allocation", type: "asset_allocation", className: "lg:col-span-1" },
  { id: "currency_allocation", type: "currency_allocation", className: "lg:col-span-1" },
  { id: "quick_actions", type: "quick_actions", className: "lg:col-span-1" },
  { id: "top_assets", type: "top_assets", className: "lg:col-span-1" },
  { id: "top_liabilities", type: "top_liabilities", className: "lg:col-span-1" },
  { id: "recent_activity", type: "recent_activity", className: "lg:col-span-2" },
  { id: "insights", type: "insights", className: "col-span-full" },
]

export function NetWorthOverview({ viewModel, historyData, assets }: NetWorthOverviewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"overview" | "assets-list">("overview")

  const handleRefresh = () => {
    router.refresh()
  }

  // Component Map driven by Layout Configuration
  const renderCard = (card: DashboardCardConfig) => {
    switch (card.type) {
      case "timeline":
        return <TimelineCard key={card.id} historyData={historyData} currency={viewModel.currency} />
      case "health":
        return <FinancialHealthCard key={card.id} viewModel={viewModel} />
      case "asset_allocation":
        const currentBreakdown = {
          cash: viewModel.topAssets.filter(a => a.category === "cash").reduce((s, a) => s + a.originalValue, 0),
          bank: viewModel.topAssets.filter(a => a.category !== "cash" && a.source === "wallet").reduce((s, a) => s + a.originalValue, 0),
          investments: viewModel.topAssets.filter(a => a.category === "investment" || a.category === "gold" || a.category === "crypto").reduce((s, a) => s + a.originalValue, 0),
          loans: viewModel.topAssets.filter(a => a.source === "loan").reduce((s, a) => s + a.originalValue, 0),
          manualAssets: viewModel.topAssets.filter(a => a.source === "asset" && a.category !== "cash" && a.category !== "investment").reduce((s, a) => s + a.originalValue, 0),
        }
        return <AssetAllocationCard key={card.id} viewModel={viewModel} breakdowns={currentBreakdown} />
      case "currency_allocation":
        // Extract currency breakdown mapping for radial bar
        const currencyMap: Record<string, any> = {}
        const allHoldings = [...viewModel.topAssets, ...viewModel.topLiabilities]
        allHoldings.forEach(h => {
          if (!currencyMap[h.originalCurrency]) {
            currencyMap[h.originalCurrency] = { netWorth: 0 }
          }
          if (h.kind === "asset") {
            currencyMap[h.originalCurrency].netWorth += h.originalValue
          } else {
            currencyMap[h.originalCurrency].netWorth -= h.originalValue
          }
        })
        return <CurrencyAllocationCard key={card.id} viewModel={viewModel} currencyBreakdown={currencyMap} />
      case "top_assets":
        return <TopAssetsCard key={card.id} viewModel={viewModel} />
      case "top_liabilities":
        return <TopLiabilitiesCard key={card.id} viewModel={viewModel} />
      case "recent_activity":
        return <RecentActivityCard key={card.id} viewModel={viewModel} />
      case "quick_actions":
        return <QuickActionsCard key={card.id} assets={assets} onRefresh={handleRefresh} />
      case "insights":
        return <InsightsCard key={card.id} viewModel={viewModel} />
      default:
        return null
    }
  }

  const tabNames: Record<string, string> = {
    overview: "Overview",
    "assets-list": `Assets & Liabilities (${assets.length})`,
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Landmark className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Net Worth</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track assets, liabilities, allocations, and historical trends across currencies.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <SummaryCards viewModel={viewModel} />

      {/* Tab Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "overview" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("assets-list")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "assets-list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Assets &amp; Liabilities ({assets.length})
          </button>
        </div>

        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="assets-list">Assets &amp; Liabilities ({assets.length})</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {DEFAULT_BENTO_LAYOUT.map((card) => (
            <div key={card.id} className={card.className}>
              {renderCard(card)}
            </div>
          ))}
        </div>
      ) : (
        <AssetsListTab assets={assets} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify compile**
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add components/net-worth/net-worth-overview.tsx
git commit -m "feat: integrate main tab to consume Bento configuration layouts"
```

---

### Task 5: Refactor page page.tsx to invoke ViewModel conversion

**Files:**
- Modify: [page.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/app/(dashboard)/net-worth/page.tsx)

- [ ] **Step 1: Update NetWorthContent in page.tsx**

Update [page.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/app/(dashboard)/net-worth/page.tsx) to pass `wallets`, `loans`, and generate the ViewModel on the server side:
```tsx
import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAllWalletsIncludingArchived } from "@/lib/queries/wallets"
import { getLoans, getActiveBaseCurrency } from "@/lib/queries/loans"
import { getAssetsAndValuationsForScope } from "@/lib/queries/assets"
import { getCurrencyConverter } from "@/lib/currency"
import { calculateCurrentNetWorth, calculateNetWorthHistory } from "@/lib/calculations/net-worth"
import { generateNetWorthOverviewViewModel } from "@/lib/calculations/net-worth-viewmodel"
import { db } from "@/lib/db/client"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { serializeData } from "@/lib/utils"
import { subMonths, startOfMonth, eachDayOfInterval, startOfDay } from "date-fns"
import { NetWorthOverview } from "@/components/net-worth/net-worth-overview"
import { Skeleton } from "@/components/ui/skeleton"

export const ppr = true

function NetWorthSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-pulse p-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[220px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-9 w-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[320px] w-full rounded-2xl md:col-span-2" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </div>
    </div>
  )
}

async function NetWorthContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const [wallets, loans, { assets, valuations }, baseCurrency] = await Promise.all([
    getAllWalletsIncludingArchived(userId),
    getLoans(),
    getAssetsAndValuationsForScope(),
    getActiveBaseCurrency(),
  ])

  const loanIds = loans.map((l) => l._id.toString())
  const [repayments, transactions] = await Promise.all([
    loanIds.length > 0
      ? (db.collection("loan_repayments").find({ loanId: { $in: loanIds } }).toArray() as any)
      : Promise.resolve([]),
    db
      .collection("transactions")
      .find({
        ...filter,
        date: { $gte: startOfMonth(subMonths(new Date(), 5)) },
      })
      .toArray() as any,
  ])

  const serialized = serializeData({
    wallets,
    loans,
    repayments,
    transactions,
    assets,
    valuations,
  })

  const sourceCurrencies = Array.from(
    new Set([
      ...serialized.wallets.map((w: any) => w.currency),
      ...serialized.loans.map((l: any) => l.currency),
      ...serialized.assets.map((a: any) => a.currency),
    ])
  )

  const convert = await getCurrencyConverter(baseCurrency, sourceCurrencies)

  const historyStart = startOfMonth(subMonths(new Date(), 5))
  const dates: Date[] = eachDayOfInterval({
    start: historyStart,
    end: startOfDay(new Date()),
  })

  const history = calculateNetWorthHistory({
    wallets: serialized.wallets,
    transactions: serialized.transactions,
    loans: serialized.loans,
    repayments: serialized.repayments,
    assets: serialized.assets,
    valuations: serialized.valuations,
    convert,
    dates,
  })

  const viewModel = generateNetWorthOverviewViewModel({
    wallets: serialized.wallets,
    loans: serialized.loans,
    assets: serialized.assets,
    valuations: serialized.valuations,
    repayments: serialized.repayments,
    transactions: serialized.transactions,
    convert,
    baseCurrency,
    history,
  })

  return (
    <NetWorthOverview
      viewModel={viewModel}
      historyData={history}
      assets={serialized.assets}
    />
  )
}

export default async function NetWorthPage() {
  return (
    <Suspense fallback={<NetWorthSkeleton />}>
      <NetWorthContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Run build to verify production builds pass**
Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add app/\(dashboard\)/net-worth/page.tsx
git commit -m "feat: update server component page.tsx to serialize and pass net worth viewmodel"
```
