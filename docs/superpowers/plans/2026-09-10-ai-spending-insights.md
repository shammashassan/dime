# AI Spending Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade AI Spending Insights engine and dedicated `/insights` hub featuring deterministic statistical anomaly detection (spikes, outliers, subscription creep, income irregularities, savings opportunities), Gemini natural-language narrative synthesis, multi-device persistent dismissal/bookmarking, and seamless integration with the Dashboard and Sidebar.

**Architecture:** A pure mathematical calculation engine in `lib/calculations/insights.ts` processes 120 days of historical transactions against 3 completed 30-day baseline periods. A cached query in `lib/queries/insights.ts` aggregates scoped data and user interaction states (`user_insight_states` in MongoDB). Server actions in `lib/actions/insights.ts` manage state changes. The UI layer in `components/insights/` and `app/(dashboard)/insights/` provides a filterable, responsive Bento hub matching Dime's Financial Health and Net Worth standards.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript 5, MongoDB, Google Gemini API (`gemini-1.5-flash` with dynamic template fallback), Tailwind CSS v4, shadcn/ui, Sonner toasts, Lucide React icons.

---

## File Structure Map

| File Path | Role / Responsibility |
|---|---|
| `types/index.ts` | Domain type contracts for `SpendingInsight`, `UserInsightState`, `SpendingInsightsData`, and `InsightEngineInputs` |
| `lib/db/collections.ts` | Export `userInsightStatesCollection` typed against `UserInsightState` |
| `lib/calculations/insights.ts` | Pure deterministic calculation functions for all 6 detector families, ranking, deduplication, and hybrid narrative synthesis |
| `lib/calculations/__tests__/insights.test.ts` | Complete unit test suite verifying thresholds, baselines, edge cases, and fallbacks |
| `lib/validations/insight.schema.ts` | Zod validation schemas for user insight actions (dismiss, bookmark, restore) |
| `lib/actions/insights.ts` | Next.js Server Actions with auth checks and MongoDB upsert/update mutations |
| `lib/queries/insights.ts` | Cached Server Component data query orchestrating MongoDB collections and calculation engine |
| `components/insights/insights-briefing-card.tsx` | Hero card presenting executive narrative briefing and focal advice |
| `components/insights/insights-metrics-row.tsx` | Bento metric cards (anomalies count, savings potential, discretionary surge, recurring commitments) |
| `components/insights/insight-card.tsx` | Individual insight card with severity badges, metrics pill, 1-click action button, bookmark star, and dismiss trigger |
| `components/insights/insights-empty.tsx` | shadcn `Empty` state component for tabs with zero insights |
| `components/insights/insights-client.tsx` | Client controller with category tabs, optimistic dismiss/bookmark state, and Sonner toast undo |
| `app/(dashboard)/insights/page.tsx` | Server Component route wrapped in Suspense |
| `app/(dashboard)/insights/loading.tsx` | Accessible skeleton loader matching `/health/loading.tsx` |
| `components/dashboard/ai-insights.tsx` | Upgraded dashboard card consuming live insights and linking to `/insights` |
| `components/layout/dashboard-sidebar.tsx` | Navigation item in `NAV_ITEMS` linking to `/insights` with `Sparkles` icon |

---

### Task 1: Domain Types and Database Collection

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/db/collections.ts`

- [ ] **Step 1: Add domain types to `types/index.ts`**

Add the following interfaces to the bottom of `types/index.ts`:

```ts
// ── AI Spending Insights Domain Types ──

export type InsightSeverity = "critical" | "warning" | "opportunity" | "info"

export type InsightCategory =
  | "spikes"
  | "outliers"
  | "subscriptions"
  | "savings"
  | "cashflow"
  | "income"

export interface SpendingInsight {
  id: string                     // Stable deterministic fingerprint (e.g. "spike_dining_out_2026_09")
  category: InsightCategory
  severity: InsightSeverity
  title: string
  description: string
  metricImpact?: number          // Amount in cents/paise (positive or negative)
  metricLabel?: string           // e.g. "+38% vs baseline" or "$142.00 surge"
  actionLabel?: string           // e.g. "Review Transactions", "Adjust Budget", "Manage Recurring"
  actionUrl?: string             // e.g. "/transactions?categoryId=...", "/recurring"
  tags?: string[]
  score: number                  // 0 to 100 for deterministic ranking & priority
  detectedAt: Date
  isBookmarked?: boolean
}

export interface UserInsightState {
  _id: ObjectId
  userId: string
  organizationId?: string | null
  insightKey: string             // Matches SpendingInsight.id
  status: "active" | "dismissed" | "bookmarked"
  dismissedAt?: Date
  bookmarkedAt?: Date
  updatedAt: Date
}

export interface SpendingInsightsData {
  executiveBriefing: {
    summary: string
    focalAdvice: string
    isAiGenerated: boolean
  }
  insights: SpendingInsight[]
  bookmarkedInsights: SpendingInsight[]
  dismissedCount: number
  metrics: {
    activeCount: number
    anomalyCount: number
    potentialSavingsMonthlyCents: number
    discretionarySurgeCents: number
  }
  currency: string
}
```

- [ ] **Step 2: Export `userInsightStatesCollection` in `lib/db/collections.ts`**

In `lib/db/collections.ts`:
1. Import `UserInsightState` from `@/types`.
2. Add export:
```ts
export const userInsightStatesCollection = db.collection<UserInsightState>("user_insight_states")
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0 and no errors.

- [ ] **Step 4: Commit domain types and collection setup**

```bash
git add types/index.ts lib/db/collections.ts
git commit -m "feat(insights): define domain types and user_insight_states collection (#9)"
```

---

### Task 2: Pure Deterministic Calculation Engine (Core Detectors)

**Files:**
- Create: `lib/calculations/insights.ts`
- Create: `lib/calculations/__tests__/insights.test.ts`

- [ ] **Step 1: Write unit tests in `lib/calculations/__tests__/insights.test.ts`**

```ts
import test from "node:test"
import assert from "node:assert/strict"
import {
  calculateSpendingInsights,
  normalizeDescription,
  detectCategorySpikes,
  detectTransactionOutliers,
  detectSubscriptionCreep,
  detectIncomeIrregularities,
  detectSavingsOpportunities,
  detectCashFlowVelocity,
} from "../insights"
import { Transaction, Category, Budget, RecurringRule, UserInsightState } from "@/types"
import { ObjectId } from "mongodb"

const MOCK_DATE = new Date("2026-09-10T12:00:00Z")

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    _id: new ObjectId(),
    userId: "user_1",
    walletId: "wallet_1",
    type: "expense",
    amount: 1000,
    currency: "USD",
    description: "Sample",
    date: MOCK_DATE,
    tags: [],
    isRecurring: false,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    ...overrides,
  }
}

test("normalizeDescription strips punctuation and normalizes casing", () => {
  assert.equal(normalizeDescription("  Netflix.com/Payment*123 "), "netflixcompayment123")
  assert.equal(normalizeDescription("STARBUCKS #1042!"), "starbucks1042")
})

test("detectCategorySpikes requires baseline average > $30 and >= 25% increase", () => {
  const catId = "cat_dining"
  const categories: Category[] = [
    {
      _id: new ObjectId(),
      userId: "user_1",
      name: "Dining Out",
      type: ["expense"],
      icon: "Utensils",
      color: "#f59e0b",
      isDefault: false,
      createdAt: MOCK_DATE,
    },
  ]

  // Baseline periods: 30-60d, 60-90d, 90-120d ago: $100/mo (10,000 cents)
  const pastTxs: Transaction[] = [
    makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-08-01") }),
    makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-07-01") }),
    makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-06-01") }),
  ]

  // Current period (0-30d): $160 (16,000 cents) -> +60% spike
  const currentTxs: Transaction[] = [
    makeTx({ categoryId: catId, amount: 16000, date: new Date("2026-09-05") }),
  ]

  const spikes = detectCategorySpikes({
    transactions: [...currentTxs, ...pastTxs],
    categories,
    targetCurrency: "USD",
    exchangeRates: { USD: 1 },
    referenceDate: MOCK_DATE,
  })

  assert.equal(spikes.length, 1)
  assert.equal(spikes[0].severity, "critical") // >= 1.6x baseline
  assert.match(spikes[0].description, /Dining Out/i)
  assert.match(spikes[0].metricLabel || "", /60%/)
})

test("detectTransactionOutliers ignores categories with < 5 historical transactions", () => {
  const catId = "cat_tech"
  const txs: Transaction[] = [
    makeTx({ categoryId: catId, amount: 5000, date: new Date("2026-08-10") }),
    makeTx({ categoryId: catId, amount: 5000, date: new Date("2026-08-15") }),
    makeTx({ categoryId: catId, amount: 5000, date: new Date("2026-08-20") }),
    makeTx({ categoryId: catId, amount: 30000, date: new Date("2026-09-02") }), // extreme outlier but total count < 5
  ]

  const outliers = detectTransactionOutliers({
    transactions: txs,
    categories: [],
    targetCurrency: "USD",
    exchangeRates: { USD: 1 },
    referenceDate: MOCK_DATE,
  })

  assert.equal(outliers.length, 0)
})

test("detectSubscriptionCreep identifies duplicate charges within 5 days", () => {
  const txs: Transaction[] = [
    makeTx({ description: "Spotify AB", amount: 1199, date: new Date("2026-09-01") }),
    makeTx({ description: "Spotify AB*", amount: 1199, date: new Date("2026-09-03") }),
  ]

  const creeps = detectSubscriptionCreep({
    transactions: txs,
    recurringRules: [],
    targetCurrency: "USD",
    exchangeRates: { USD: 1 },
    referenceDate: MOCK_DATE,
  })

  assert.equal(creeps.length, 1)
  assert.equal(creeps[0].category, "subscriptions")
  assert.match(creeps[0].title, /Duplicate Charge Detected/i)
})

test("detectIncomeIrregularities detects missing recurring salary", () => {
  // User had salary of $4,000 on the 1st of each previous month, but none in current month (reference: Sept 10)
  const pastSalary: Transaction[] = [
    makeTx({ type: "income", amount: 400000, description: "Payroll Acme Corp", date: new Date("2026-08-01") }),
    makeTx({ type: "income", amount: 400000, description: "Payroll Acme Corp", date: new Date("2026-07-01") }),
    makeTx({ type: "income", amount: 400000, description: "Payroll Acme Corp", date: new Date("2026-06-01") }),
  ]

  const irregularities = detectIncomeIrregularities({
    transactions: pastSalary,
    targetCurrency: "USD",
    exchangeRates: { USD: 1 },
    referenceDate: MOCK_DATE,
  })

  assert.equal(irregularities.length, 1)
  assert.equal(irregularities[0].severity, "critical")
  assert.match(irregularities[0].title, /Delayed or Missing Income/i)
})
```

- [ ] **Step 2: Implement `lib/calculations/insights.ts`**

Create `lib/calculations/insights.ts` implementing:
1. `normalizeDescription(text: string): string`
2. `detectCategorySpikes(...)`
3. `detectTransactionOutliers(...)`
4. `detectSubscriptionCreep(...)`
5. `detectIncomeIrregularities(...)`
6. `detectSavingsOpportunities(...)`
7. `detectCashFlowVelocity(...)`
8. `calculateSpendingInsights(...)` with ranking, deduplication, and fallback briefing template.

```ts
import {
  Transaction,
  Category,
  Budget,
  RecurringRule,
  UserInsightState,
  SpendingInsight,
  SpendingInsightsData,
  InsightCategory,
  InsightSeverity,
} from "@/types"
import { formatCurrency } from "@/lib/utils"

export interface InsightEngineInputs {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  recurringRules: RecurringRule[]
  userStates?: UserInsightState[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}

export function normalizeDescription(desc: string): string {
  return (desc || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
}

export function convertAmount(
  cents: number,
  fromCurrency: string,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  if (!fromCurrency || fromCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
    return cents
  }
  const fromRate = rates[fromCurrency.toUpperCase()] || 1
  const toRate = rates[targetCurrency.toUpperCase()] || 1
  return Math.round((cents / fromRate) * toRate)
}

// ── 1. Category Spikes Detector ──
export function detectCategorySpikes(inputs: {
  transactions: Transaction[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate: Date
}): SpendingInsight[] {
  const { transactions, categories, targetCurrency, exchangeRates, referenceDate } = inputs
  const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]))
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const d60 = d0 - 60 * 86400000
  const d90 = d0 - 90 * 86400000
  const d120 = d0 - 120 * 86400000

  const currentSpend: Record<string, number> = {}
  const p1Spend: Record<string, number> = {}
  const p2Spend: Record<string, number> = {}
  const p3Spend: Record<string, number> = {}
  const baselineCount: Record<string, number> = {}

  for (const t of transactions) {
    if (t.type !== "expense") continue
    const catId = t.categoryId || "uncategorized"
    const amount = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    const time = new Date(t.date).getTime()

    if (time >= d30 && time <= d0) {
      currentSpend[catId] = (currentSpend[catId] || 0) + amount
    } else if (time >= d60 && time < d30) {
      p1Spend[catId] = (p1Spend[catId] || 0) + amount
      baselineCount[catId] = (baselineCount[catId] || 0) + 1
    } else if (time >= d90 && time < d60) {
      p2Spend[catId] = (p2Spend[catId] || 0) + amount
      baselineCount[catId] = (baselineCount[catId] || 0) + 1
    } else if (time >= d120 && time < d90) {
      p3Spend[catId] = (p3Spend[catId] || 0) + amount
      baselineCount[catId] = (baselineCount[catId] || 0) + 1
    }
  }

  for (const [catId, current] of Object.entries(currentSpend)) {
    const p1 = p1Spend[catId] || 0
    const p2 = p2Spend[catId] || 0
    const p3 = p3Spend[catId] || 0
    const baselineAverage = (p1 + p2 + p3) / 3
    const txCount = baselineCount[catId] || 0

    // Safeguards: minimum $30 baseline and at least 3 historical transactions
    if (baselineAverage < 3000 || txCount < 3) continue

    const delta = current - baselineAverage
    const ratio = current / baselineAverage

    if (ratio >= 1.25 && delta >= 2500) {
      const pctIncrease = Math.round((ratio - 1) * 100)
      const catName = catMap.get(catId) || "Other"
      const isExtreme = ratio >= 1.6
      const monthYear = `${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`

      insights.push({
        id: `spike_${catId}_${monthYear}`,
        category: "spikes",
        severity: isExtreme ? "critical" : "warning",
        title: `${catName} Spending Surge`,
        description: `Your spending in ${catName} reached ${formatCurrency(current, targetCurrency)}, which is ${pctIncrease}% higher than your 3-month baseline average of ${formatCurrency(Math.round(baselineAverage), targetCurrency)}.`,
        metricImpact: delta,
        metricLabel: `+${pctIncrease}% vs baseline`,
        actionLabel: "Review Category Transactions",
        actionUrl: `/transactions?categoryId=${catId}`,
        tags: [catName, "surge"],
        score: Math.min(100, Math.round(50 + (ratio - 1) * 25)),
        detectedAt: referenceDate,
      })
    }
  }

  return insights
}

// ── 2. Outlier Detector ──
export function detectTransactionOutliers(inputs: {
  transactions: Transaction[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate: Date
}): SpendingInsight[] {
  const { transactions, categories, targetCurrency, exchangeRates, referenceDate } = inputs
  const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]))
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const d120 = d0 - 120 * 86400000

  // Group all 120-day transactions by category
  const catTxs: Record<string, { amount: number; tx: Transaction }[]> = {}
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const time = new Date(t.date).getTime()
    if (time < d120 || time > d0) continue
    const catId = t.categoryId || "uncategorized"
    const amount = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    if (!catTxs[catId]) catTxs[catId] = []
    catTxs[catId].push({ amount, tx: t })
  }

  for (const [catId, list] of Object.entries(catTxs)) {
    // Require >= 5 historical transactions
    if (list.length < 5) continue

    const amounts = list.map((i) => i.amount)
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    const threshold = mean + 2.5 * stdDev

    // Check only current 30-day transactions
    for (const item of list) {
      const time = new Date(item.tx.date).getTime()
      if (time >= d30 && time <= d0 && item.amount > threshold && item.amount >= 5000) {
        const catName = catMap.get(catId) || "Expenses"
        const deviationMultiplier = (item.amount / Math.max(mean, 1)).toFixed(1)
        insights.push({
          id: `outlier_${item.tx._id.toString()}`,
          category: "outliers",
          severity: "warning",
          title: `Unusual Expense: ${item.tx.description || catName}`,
          description: `A charge of ${formatCurrency(item.amount, targetCurrency)} is ${deviationMultiplier}x larger than your typical ${catName} transaction average (${formatCurrency(Math.round(mean), targetCurrency)}).`,
          metricImpact: item.amount - Math.round(mean),
          metricLabel: `${deviationMultiplier}x normal size`,
          actionLabel: "View Transaction",
          actionUrl: `/transactions/${item.tx._id.toString()}`,
          tags: ["outlier", catName],
          score: Math.min(95, Math.round(60 + Number(deviationMultiplier) * 5)),
          detectedAt: referenceDate,
        })
      }
    }
  }

  return insights
}

// ── 3. Subscription Creep & Duplicate Detector ──
export function detectSubscriptionCreep(inputs: {
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate: Date
}): SpendingInsight[] {
  const { transactions, recurringRules, targetCurrency, exchangeRates, referenceDate } = inputs
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000

  // 1. Detect duplicate charges within 5 days
  const recentExpenses = transactions.filter(
    (t) => t.type === "expense" && new Date(t.date).getTime() >= d30
  )

  for (let i = 0; i < recentExpenses.length; i++) {
    for (let j = i + 1; j < recentExpenses.length; j++) {
      const a = recentExpenses[i]
      const b = recentExpenses[j]
      const descA = normalizeDescription(a.description)
      const descB = normalizeDescription(b.description)

      if (descA.length >= 4 && descA === descB && a.amount === b.amount) {
        const dayDiff = Math.abs(
          (new Date(a.date).getTime() - new Date(b.date).getTime()) / 86400000
        )
        if (dayDiff <= 5) {
          const amt = convertAmount(a.amount, a.currency, targetCurrency, exchangeRates)
          const pairKey = [a._id.toString(), b._id.toString()].sort().join("_")
          insights.push({
            id: `duplicate_${pairKey}`,
            category: "subscriptions",
            severity: "critical",
            title: `Potential Duplicate Charge Detected`,
            description: `We detected two identical charges of ${formatCurrency(amt, targetCurrency)} for "${a.description}" within ${Math.round(dayDiff)} days. Verify with your provider.`,
            metricImpact: amt,
            metricLabel: "Possible double billing",
            actionLabel: "Review Transactions",
            actionUrl: `/transactions`,
            tags: ["duplicate", "billing"],
            score: 85,
            detectedAt: referenceDate,
          })
        }
      }
    }
  }

  // 2. Price hike on active recurring rules
  for (const rule of recurringRules) {
    if (rule.type !== "expense") continue
    const baseRuleAmount = convertAmount(rule.amount, rule.currency, targetCurrency, exchangeRates)
    const ruleTxs = transactions.filter(
      (t) =>
        t.recurringId === rule._id.toString() ||
        (normalizeDescription(t.description) === normalizeDescription(rule.name) &&
          new Date(t.date).getTime() >= d30)
    )

    if (ruleTxs.length > 0) {
      const latestTx = ruleTxs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
      const latestAmt = convertAmount(
        latestTx.amount,
        latestTx.currency,
        targetCurrency,
        exchangeRates
      )

      if (latestAmt > baseRuleAmount * 1.05) {
        const hike = latestAmt - baseRuleAmount
        const pct = Math.round((hike / baseRuleAmount) * 100)
        insights.push({
          id: `price_hike_${rule._id.toString()}_${referenceDate.getMonth()}`,
          category: "subscriptions",
          severity: "warning",
          title: `Subscription Price Hike: ${rule.name}`,
          description: `Your recurring payment for "${rule.name}" increased by ${pct}% from ${formatCurrency(baseRuleAmount, targetCurrency)} to ${formatCurrency(latestAmt, targetCurrency)}.`,
          metricImpact: hike,
          metricLabel: `+${pct}% price hike`,
          actionLabel: "Manage Recurring Rule",
          actionUrl: `/recurring`,
          tags: ["subscription", "price_hike"],
          score: 75,
          detectedAt: referenceDate,
        })
      }
    }
  }

  return insights
}

// ── 4. Income Irregularity Detector ──
export function detectIncomeIrregularities(inputs: {
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate: Date
}): SpendingInsight[] {
  const { transactions, targetCurrency, exchangeRates, referenceDate } = inputs
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const d60 = d0 - 60 * 86400000
  const d90 = d0 - 90 * 86400000
  const d120 = d0 - 120 * 86400000

  let currentIncome = 0
  let p1Income = 0
  let p2Income = 0
  let p3Income = 0

  for (const t of transactions) {
    if (t.type !== "income") continue
    const amt = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    const time = new Date(t.date).getTime()

    if (time >= d30 && time <= d0) currentIncome += amt
    else if (time >= d60 && time < d30) p1Income += amt
    else if (time >= d90 && time < d60) p2Income += amt
    else if (time >= d120 && time < d90) p3Income += amt
  }

  const baselineIncome = (p1Income + p2Income + p3Income) / 3

  // Trigger if baseline income was established (>= $500) and current 30d dropped by >= 30%
  if (baselineIncome >= 50000 && currentIncome < baselineIncome * 0.7) {
    const dip = Math.round(baselineIncome - currentIncome)
    const pctDrop = Math.round((dip / baselineIncome) * 100)
    const monthYear = `${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`

    insights.push({
      id: `income_dip_${monthYear}`,
      category: "income",
      severity: currentIncome === 0 ? "critical" : "warning",
      title: "Delayed or Missing Income",
      description: `Your recorded income for the last 30 days (${formatCurrency(currentIncome, targetCurrency)}) is ${pctDrop}% below your average monthly baseline (${formatCurrency(Math.round(baselineIncome), targetCurrency)}).`,
      metricImpact: -dip,
      metricLabel: `-${pctDrop}% below baseline`,
      actionLabel: "Record Income",
      actionUrl: `/transactions?type=income`,
      tags: ["income", "cashflow"],
      score: 90,
      detectedAt: referenceDate,
    })
  }

  return insights
}

// ── 5. Savings Opportunities Detector ──
export function detectSavingsOpportunities(inputs: {
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate: Date
}): SpendingInsight[] {
  const { transactions, budgets, categories, targetCurrency, exchangeRates, referenceDate } = inputs
  const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]))
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000

  // 1. Budget surplus reallocation
  for (const b of budgets) {
    if (!b.isActive) continue
    const budgetLimit = convertAmount(b.amount, b.currency, targetCurrency, exchangeRates)
    const spent = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.categoryId === b.categoryId &&
          new Date(t.date).getTime() >= d30
      )
      .reduce(
        (sum, t) => sum + convertAmount(t.amount, t.currency, targetCurrency, exchangeRates),
        0
      )

    if (budgetLimit >= 10000 && spent < budgetLimit * 0.7) {
      const surplus = budgetLimit - spent
      const catName = catMap.get(b.categoryId) || b.name
      insights.push({
        id: `savings_surplus_${b._id.toString()}_${referenceDate.getMonth()}`,
        category: "savings",
        severity: "opportunity",
        title: `Unspent Budget Surplus: ${catName}`,
        description: `You have an unallocated surplus of ${formatCurrency(surplus, targetCurrency)} in your ${catName} budget this month. Consider transferring it to your savings goals.`,
        metricImpact: surplus,
        metricLabel: `${formatCurrency(surplus, targetCurrency)} available`,
        actionLabel: "Transfer to Goal",
        actionUrl: `/goals`,
        tags: ["savings", "surplus"],
        score: 65,
        detectedAt: referenceDate,
      })
    }
  }

  // 2. High-frequency micro-spending leakage (< $15, >= 12 times in 30d)
  const microTxs = transactions.filter(
    (t) =>
      t.type === "expense" &&
      new Date(t.date).getTime() >= d30 &&
      convertAmount(t.amount, t.currency, targetCurrency, exchangeRates) <= 1500
  )

  if (microTxs.length >= 12) {
    const totalMicroSpend = microTxs.reduce(
      (sum, t) => sum + convertAmount(t.amount, t.currency, targetCurrency, exchangeRates),
      0
    )
    const potentialMonthlySavings = Math.round(totalMicroSpend * 0.3)
    insights.push({
      id: `savings_micro_leakage_${referenceDate.getMonth()}`,
      category: "savings",
      severity: "opportunity",
      title: "Micro-Purchase Frequency Leakage",
      description: `You logged ${microTxs.length} small purchases (under ${formatCurrency(1500, targetCurrency)}) totaling ${formatCurrency(totalMicroSpend, targetCurrency)} this month. Trimming discretionary frequency could save ~${formatCurrency(potentialMonthlySavings, targetCurrency)}/mo.`,
      metricImpact: potentialMonthlySavings,
      metricLabel: `~${formatCurrency(potentialMonthlySavings, targetCurrency)}/mo savings`,
      actionLabel: "Review Micro-expenses",
      actionUrl: `/transactions?amountMax=15`,
      tags: ["savings", "habits"],
      score: 60,
      detectedAt: referenceDate,
    })
  }

  return insights
}

// ── 6. Cash Flow Velocity & Burn Rate ──
export function detectCashFlowVelocity(inputs: {
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate: Date
}): SpendingInsight[] {
  const { transactions, targetCurrency, exchangeRates, referenceDate } = inputs
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d7 = d0 - 7 * 86400000
  const d30 = d0 - 30 * 86400000

  let last7dExpenses = 0
  let last30dIncome = 0
  let last30dExpenses = 0

  for (const t of transactions) {
    const amt = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    const time = new Date(t.date).getTime()

    if (t.type === "expense") {
      if (time >= d7 && time <= d0) last7dExpenses += amt
      if (time >= d30 && time <= d0) last30dExpenses += amt
    } else if (t.type === "income") {
      if (time >= d30 && time <= d0) last30dIncome += amt
    }
  }

  const projectedMonthExpenses = Math.round(last7dExpenses * 4.3)
  if (last30dIncome > 0 && projectedMonthExpenses > last30dIncome * 1.15) {
    const deficit = projectedMonthExpenses - last30dIncome
    insights.push({
      id: `cashflow_velocity_${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`,
      category: "cashflow",
      severity: deficit > 25000 ? "critical" : "warning",
      title: "Accelerated Burn Rate",
      description: `At your 7-day spending pace (${formatCurrency(last7dExpenses, targetCurrency)}/wk), projected monthly expenses will exceed income by ${formatCurrency(deficit, targetCurrency)}.`,
      metricImpact: -deficit,
      metricLabel: `${formatCurrency(deficit, targetCurrency)} deficit risk`,
      actionLabel: "View Cash Flow Trend",
      actionUrl: `/reports`,
      tags: ["burn_rate", "deficit"],
      score: 80,
      detectedAt: referenceDate,
    })
  }

  return insights
}

// ── Orchestrator ──
export function calculateSpendingInsights(inputs: InsightEngineInputs): SpendingInsightsData {
  const referenceDate = inputs.referenceDate || new Date()
  const userStates = inputs.userStates || []
  const dismissedKeys = new Set(
    userStates.filter((s) => s.status === "dismissed").map((s) => s.insightKey)
  )
  const bookmarkedKeys = new Set(
    userStates.filter((s) => s.status === "bookmarked").map((s) => s.insightKey)
  )

  const rawInsights: SpendingInsight[] = [
    ...detectCategorySpikes({ ...inputs, referenceDate }),
    ...detectTransactionOutliers({ ...inputs, referenceDate }),
    ...detectSubscriptionCreep({ ...inputs, referenceDate }),
    ...detectIncomeIrregularities({ ...inputs, referenceDate }),
    ...detectSavingsOpportunities({ ...inputs, referenceDate }),
    ...detectCashFlowVelocity({ ...inputs, referenceDate }),
  ]

  // Attach bookmark flag and sort descending by score
  const allRanked = rawInsights
    .map((i) => ({
      ...i,
      isBookmarked: bookmarkedKeys.has(i.id),
    }))
    .sort((a, b) => b.score - a.score)

  const activeInsights = allRanked.filter((i) => !dismissedKeys.has(i.id))
  const bookmarkedInsights = allRanked.filter((i) => i.isBookmarked)

  // Metrics calculation
  const anomalyCount = activeInsights.filter(
    (i) => i.category === "spikes" || i.category === "outliers" || i.category === "income"
  ).length

  const potentialSavingsMonthlyCents = activeInsights
    .filter((i) => i.category === "savings" && (i.metricImpact || 0) > 0)
    .reduce((sum, i) => sum + (i.metricImpact || 0), 0)

  const discretionarySurgeCents = activeInsights
    .filter((i) => i.category === "spikes" && (i.metricImpact || 0) > 0)
    .reduce((sum, i) => sum + (i.metricImpact || 0), 0)

  // Deterministic summary fallback
  const topSpike = activeInsights.find((i) => i.category === "spikes")
  const topSavings = activeInsights.find((i) => i.category === "savings")

  let summary = `Your financial pulse is stable with ${activeInsights.length} active spending signals detected.`
  if (topSpike) {
    summary = `${topSpike.title}: ${topSpike.description}`
  } else if (activeInsights.length === 0) {
    summary = "No unusual spending spikes or billing anomalies detected. Your budget is running smoothly."
  }

  let focalAdvice = "Keep monitoring your weekly discretionary spending to stay ahead of upcoming renewals."
  if (topSavings) {
    focalAdvice = `Actionable win: ${topSavings.description}`
  }

  return {
    executiveBriefing: {
      summary,
      focalAdvice,
      isAiGenerated: false,
    },
    insights: activeInsights,
    bookmarkedInsights,
    dismissedCount: dismissedKeys.size,
    metrics: {
      activeCount: activeInsights.length,
      anomalyCount,
      potentialSavingsMonthlyCents,
      discretionarySurgeCents,
    },
    currency: inputs.targetCurrency,
  }
}
```

- [ ] **Step 3: Run unit tests**

Run: `node --experimental-strip-types --test lib/calculations/__tests__/insights.test.ts`
Expected: All tests pass with 0 failures.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0 and no errors.

- [ ] **Step 5: Commit pure calculation engine**

```bash
git add lib/calculations/insights.ts lib/calculations/__tests__/insights.test.ts
git commit -m "feat(insights): implement pure deterministic calculation engine (#9)"
```

---

### Task 3: Narrative Synthesis (Gemini API Integration with Fallback)

**Files:**
- Modify: `lib/calculations/insights.ts`
- Modify: `lib/calculations/__tests__/insights.test.ts`

- [ ] **Step 1: Add unit test for narrative generation with missing key fallback**

In `lib/calculations/__tests__/insights.test.ts`, add:

```ts
import { generateExecutiveBriefing } from "../insights"

test("generateExecutiveBriefing falls back to deterministic template when GEMINI_API_KEY is not set", async () => {
  const originalKey = process.env.GEMINI_API_KEY
  delete process.env.GEMINI_API_KEY

  const briefing = await generateExecutiveBriefing([], {
    activeCount: 0,
    anomalyCount: 0,
    potentialSavingsMonthlyCents: 0,
    discretionarySurgeCents: 0,
  }, "USD")

  assert.equal(briefing.isAiGenerated, false)
  assert.match(briefing.summary, /budget is running smoothly|spending signals/i)

  process.env.GEMINI_API_KEY = originalKey
})
```

- [ ] **Step 2: Add `generateExecutiveBriefing` to `lib/calculations/insights.ts`**

In `lib/calculations/insights.ts`:

```ts
export async function generateExecutiveBriefing(
  insights: SpendingInsight[],
  metrics: SpendingInsightsData["metrics"],
  currency: string
): Promise<{ summary: string; focalAdvice: string; isAiGenerated: boolean }> {
  const topSpike = insights.find((i) => i.category === "spikes")
  const topSavings = insights.find((i) => i.category === "savings")

  const defaultSummary = topSpike
    ? `${topSpike.title}: ${topSpike.description}`
    : insights.length === 0
      ? "No unusual spending spikes or billing anomalies detected. Your budget is running smoothly."
      : `Your financial pulse is stable with ${insights.length} active spending signals detected.`

  const defaultAdvice = topSavings
    ? `Actionable win: ${topSavings.description}`
    : "Keep monitoring your weekly discretionary spending to stay ahead of upcoming renewals."

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || insights.length === 0) {
    return {
      summary: defaultSummary,
      focalAdvice: defaultAdvice,
      isAiGenerated: false,
    }
  }

  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are Dime's Chief Financial Analyst. Given these pre-calculated financial facts:
- Active signals: ${metrics.activeCount}
- Anomalies: ${metrics.anomalyCount}
- Potential monthly savings: ${(metrics.potentialSavingsMonthlyCents / 100).toFixed(2)} ${currency}
- Discretionary surge: ${(metrics.discretionarySurgeCents / 100).toFixed(2)} ${currency}
- Top insights: ${insights.slice(0, 3).map((i) => `[${i.title}]: ${i.description}`).join(" | ")}

Write a concise 2-sentence executive briefing summarizing the current situation, followed by 1 actionable focal advice sentence.
Do not invent numbers. Output ONLY a valid JSON object with keys "summary" and "focalAdvice".`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000), // 4-second hard timeout
      }
    )

    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`)

    const data = await response.json()
    const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) throw new Error("Empty response from Gemini")

    const parsed = JSON.parse(contentText)
    return {
      summary: parsed.summary || defaultSummary,
      focalAdvice: parsed.focalAdvice || defaultAdvice,
      isAiGenerated: true,
    }
  } catch {
    return {
      summary: defaultSummary,
      focalAdvice: defaultAdvice,
      isAiGenerated: false,
    }
  }
}
```

- [ ] **Step 3: Run unit tests**

Run: `node --experimental-strip-types --test lib/calculations/__tests__/insights.test.ts`
Expected: All tests pass.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0.

- [ ] **Step 5: Commit hybrid narrative synthesis**

```bash
git add lib/calculations/insights.ts lib/calculations/__tests__/insights.test.ts
git commit -m "feat(insights): implement hybrid narrative synthesis with Gemini & fallback (#9)"
```

---

### Task 4: Server Actions and Validations Layer

**Files:**
- Create: `lib/validations/insight.schema.ts`
- Create: `lib/actions/insights.ts`

- [ ] **Step 1: Create `lib/validations/insight.schema.ts`**

```ts
import { z } from "zod"

export const updateInsightStateSchema = z.object({
  insightKey: z.string().min(1, "Insight key is required"),
  status: z.enum(["active", "dismissed", "bookmarked"]),
})

export type UpdateInsightStateInput = z.infer<typeof updateInsightStateSchema>
```

- [ ] **Step 2: Create `lib/actions/insights.ts`**

```ts
"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { userInsightStatesCollection } from "@/lib/db/collections"
import { updateInsightStateSchema, UpdateInsightStateInput } from "@/lib/validations/insight.schema"
import { getFinancialScope } from "@/lib/scope"
import { revalidatePath } from "next/cache"

export async function dismissInsightAction(insightKey: string) {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const validated = updateInsightStateSchema.parse({ insightKey, status: "dismissed" })

  await userInsightStatesCollection.updateOne(
    { userId, insightKey: validated.insightKey },
    {
      $set: {
        userId,
        organizationId: scope.organizationId || null,
        insightKey: validated.insightKey,
        status: "dismissed",
        dismissedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  revalidatePath("/insights")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function toggleBookmarkInsightAction(insightKey: string, currentlyBookmarked: boolean) {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const scope = await getFinancialScope()

  const nextStatus = currentlyBookmarked ? "active" : "bookmarked"
  const validated = updateInsightStateSchema.parse({ insightKey, status: nextStatus })

  await userInsightStatesCollection.updateOne(
    { userId, insightKey: validated.insightKey },
    {
      $set: {
        userId,
        organizationId: scope.organizationId || null,
        insightKey: validated.insightKey,
        status: validated.status,
        ...(nextStatus === "bookmarked" ? { bookmarkedAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  revalidatePath("/insights")
  return { success: true, isBookmarked: !currentlyBookmarked }
}

export async function restoreAllDismissedInsightsAction() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  await userInsightStatesCollection.deleteMany({
    userId,
    status: "dismissed",
  })

  revalidatePath("/insights")
  revalidatePath("/dashboard")
  return { success: true }
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0.

- [ ] **Step 4: Commit server actions and validation**

```bash
git add lib/validations/insight.schema.ts lib/actions/insights.ts
git commit -m "feat(insights): create server actions and validations for user states (#9)"
```

---

### Task 5: Query Data Layer (`getFinancialInsightsData`)

**Files:**
- Modify: `lib/queries/insights.ts`

- [ ] **Step 1: Update `lib/queries/insights.ts`**

Rewrite `lib/queries/insights.ts` with `React.cache()` to fetch:
1. Financial scope (`getFinancialScope()`)
2. Exchange rates and user currency preference
3. 120 days of transactions
4. Categories, active budgets, recurring rules
5. User insight states from `userInsightStatesCollection`
6. Calls `calculateSpendingInsights` and `generateExecutiveBriefing`.
7. Preserves legacy `getFinancialInsights` as a thin wrapper for backwards compatibility.

```ts
import { cache } from "react"
import {
  transactionsCollection,
  categoriesCollection,
  budgetsCollection,
  recurringRulesCollection,
  userInsightStatesCollection,
} from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { SpendingInsightsData, Transaction } from "@/types"
import {
  calculateSpendingInsights,
  generateExecutiveBriefing,
} from "@/lib/calculations/insights"
import { subDays } from "date-fns"

export const getFinancialInsightsData = cache(
  async (userId: string): Promise<SpendingInsightsData> => {
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)
    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const now = new Date()
    const past120Days = subDays(now, 120)

    const [
      transactions,
      categories,
      budgets,
      recurringRules,
      userStates,
      exchangeRates,
    ] = await Promise.all([
      transactionsCollection
        .find({
          ...scopeFilter,
          date: { $gte: past120Days },
        })
        .sort({ date: -1 })
        .toArray(),
      categoriesCollection
        .find({
          $or: [scopeFilter, { userId: null }],
        })
        .toArray(),
      budgetsCollection.find({ ...scopeFilter, isActive: true }).toArray(),
      recurringRulesCollection.find({ ...scopeFilter, isActive: true }).toArray(),
      userInsightStatesCollection.find({ userId }).toArray(),
      getExchangeRates(targetCurrency),
    ])

    const calculationResult = calculateSpendingInsights({
      transactions,
      categories,
      budgets,
      recurringRules,
      userStates,
      targetCurrency,
      exchangeRates,
      referenceDate: now,
    })

    // Synthesize narrative asynchronously
    const briefing = await generateExecutiveBriefing(
      calculationResult.insights,
      calculationResult.metrics,
      targetCurrency
    )

    return {
      ...calculationResult,
      executiveBriefing: briefing,
    }
  }
)

// Legacy adapter for existing consumers
export interface FinancialInsight {
  id: string
  type: "warning" | "success" | "info" | "tip"
  title: string
  description: string
  categoryName?: string
  amount?: number
}

export const getFinancialInsights = cache(
  async (userId: string): Promise<FinancialInsight[]> => {
    const data = await getFinancialInsightsData(userId)
    return data.insights.map((ins) => ({
      id: ins.id,
      type:
        ins.severity === "critical"
          ? "warning"
          : ins.severity === "opportunity"
            ? "tip"
            : ins.severity === "warning"
              ? "warning"
              : "info",
      title: ins.title,
      description: ins.description,
      amount: ins.metricImpact,
    }))
  }
)
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0.

- [ ] **Step 3: Commit query data layer**

```bash
git add lib/queries/insights.ts
git commit -m "feat(insights): implement cached getFinancialInsightsData query (#9)"
```

---

### Task 6: UI Components — Metrics Row, Briefing Hero, Insight Card & Empty State

**Files:**
- Create: `components/insights/insights-briefing-card.tsx`
- Create: `components/insights/insights-metrics-row.tsx`
- Create: `components/insights/insight-card.tsx`
- Create: `components/insights/insights-empty.tsx`

- [ ] **Step 1: Create `components/insights/insights-briefing-card.tsx`**

Hero card matching `/health` and `/net-worth` bento headers:

```tsx
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bot, AlertCircle } from "lucide-react"

interface InsightsBriefingCardProps {
  briefing: {
    summary: string
    focalAdvice: string
    isAiGenerated: boolean
  }
}

export function InsightsBriefingCard({ briefing }: InsightsBriefingCardProps) {
  return (
    <Card className="relative overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs p-6 rounded-2xl">
      {/* Background glow accent */}
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-56 rounded-full bg-primary/10 blur-[50px] pointer-events-none" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <h2 className="text-base font-bold text-foreground">Executive AI Briefing</h2>
          </div>

          <Badge
            variant="outline"
            className="rounded-lg font-semibold text-[11px] h-6 px-2.5 gap-1.5 border-primary/30 text-primary bg-primary/5"
          >
            {briefing.isAiGenerated ? <Bot className="size-3" /> : <Sparkles className="size-3" />}
            {briefing.isAiGenerated ? "Gemini 1.5 Analysis" : "Diagnostic Summary"}
          </Badge>
        </div>

        <p className="text-sm font-medium text-foreground leading-relaxed">
          {briefing.summary}
        </p>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-normal">
            <span className="font-bold text-foreground mr-1">Focal Recommendation:</span>
            {briefing.focalAdvice}
          </div>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create `components/insights/insights-metrics-row.tsx`**

Bento summary pills matching `HealthSummaryRow`:

```tsx
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, PiggyBank, Flame, BellRing } from "lucide-react"

interface InsightsMetricsRowProps {
  metrics: {
    activeCount: number
    anomalyCount: number
    potentialSavingsMonthlyCents: number
    discretionarySurgeCents: number
  }
  currency: string
}

export function InsightsMetricsRow({ metrics, currency }: InsightsMetricsRowProps) {
  const cards = [
    {
      title: "Anomalies Flagged",
      value: metrics.anomalyCount.toString(),
      subtext: "Spikes & outlier alerts",
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Monthly Savings Potential",
      value: formatCurrency(metrics.potentialSavingsMonthlyCents, currency),
      subtext: "Surplus & habit trims",
      icon: PiggyBank,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Discretionary Surge",
      value: formatCurrency(metrics.discretionarySurgeCents, currency),
      subtext: "Above 3-month baseline",
      icon: Flame,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Active Signals",
      value: metrics.activeCount.toString(),
      subtext: "Current radar items",
      icon: BellRing,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.title} className="rounded-2xl border border-border/40 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{c.title}</span>
              <div className={`size-7 rounded-lg ${c.bg} ${c.color} flex items-center justify-center shrink-0`}>
                <Icon className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">{c.value}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">{c.subtext}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/insights/insight-card.tsx`**

Interactive card with 1-click action, bookmark, and dismiss controls:

```tsx
"use client"

import React from "react"
import { SpendingInsight } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import Link from "next/link"
import {
  AlertTriangle,
  Flame,
  PiggyBank,
  Repeat,
  ArrowUpRight,
  Star,
  X,
  TrendingDown,
  Info,
} from "lucide-react"

interface InsightCardProps {
  insight: SpendingInsight
  onDismiss: (id: string) => void
  onToggleBookmark: (id: string, current: boolean) => void
}

const SEVERITY_STYLES = {
  critical: "border-red-500/30 bg-red-500/5 text-red-500",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-500",
  opportunity: "border-purple-500/30 bg-purple-500/5 text-purple-500",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-500",
}

const CATEGORY_ICONS = {
  spikes: Flame,
  outliers: AlertTriangle,
  subscriptions: Repeat,
  savings: PiggyBank,
  cashflow: TrendingDown,
  income: Info,
}

export function InsightCard({ insight, onDismiss, onToggleBookmark }: InsightCardProps) {
  const Icon = CATEGORY_ICONS[insight.category] || Info

  return (
    <Card className="rounded-2xl border border-border/40 bg-card hover:border-border/80 transition-all p-5 flex flex-col justify-between gap-4 shadow-xs">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`rounded-md font-semibold text-[10px] h-5 capitalize ${SEVERITY_STYLES[insight.severity]}`}
            >
              {insight.severity}
            </Badge>

            {insight.metricLabel && (
              <Badge
                variant="outline"
                className="rounded-md font-semibold text-[10px] h-5 border-border/60 bg-muted/40 text-foreground"
              >
                {insight.metricLabel}
              </Badge>
            )}
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleBookmark(insight.id, !!insight.isBookmarked)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Star
                      className={`size-3.5 ${insight.isBookmarked ? "fill-amber-500 text-amber-500" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {insight.isBookmarked ? "Remove Bookmark" : "Bookmark Insight"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDismiss(insight.id)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-red-500"
                  >
                    <X className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Dismiss</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center shrink-0 text-foreground mt-0.5">
            <Icon className="size-4.5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-snug">{insight.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
          </div>
        </div>
      </div>

      {insight.actionUrl && insight.actionLabel && (
        <div className="pt-2 border-t border-border/30 flex justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl font-bold gap-1.5 text-xs h-8 border-border/40 hover:bg-muted/40"
          >
            <Link href={insight.actionUrl}>
              {insight.actionLabel}
              <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Create `components/insights/insights-empty.tsx`**

```tsx
import React from "react"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Sparkles } from "lucide-react"

interface InsightsEmptyProps {
  title?: string
  description?: string
}

export function InsightsEmpty({
  title = "All clear on this radar",
  description = "No active spending spikes, billing anomalies, or irregularities found for this category.",
}: InsightsEmptyProps) {
  return (
    <Empty className="rounded-2xl border border-dashed border-border/60 p-8 flex flex-col items-center justify-center text-center">
      <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Sparkles className="size-5" />
      </div>
      <EmptyHeader>
        <EmptyTitle className="text-base font-bold text-foreground">{title}</EmptyTitle>
        <EmptyDescription className="text-xs text-muted-foreground max-w-sm mt-1">
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
```

- [ ] **Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0.

- [ ] **Step 6: Commit presentation components**

```bash
git add components/insights/
git commit -m "feat(insights): create briefing card, metrics row, insight card and empty components (#9)"
```

---

### Task 7: UI Client Hub & Dedicated Page (`/insights`)

**Files:**
- Create: `components/insights/insights-client.tsx`
- Create: `app/(dashboard)/insights/loading.tsx`
- Create: `app/(dashboard)/insights/page.tsx`

- [ ] **Step 1: Create `components/insights/insights-client.tsx`**

Client controller with tab filtering and optimistic dismiss/bookmark state:

```tsx
"use client"

import React, { useState, useTransition } from "react"
import { SpendingInsightsData, SpendingInsight } from "@/types"
import { InsightsBriefingCard } from "./insights-briefing-card"
import { InsightsMetricsRow } from "./insights-metrics-row"
import { InsightCard } from "./insight-card"
import { InsightsEmpty } from "./insights-empty"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Sparkles, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import {
  dismissInsightAction,
  toggleBookmarkInsightAction,
  restoreAllDismissedInsightsAction,
} from "@/lib/actions/insights"

interface InsightsClientProps {
  data: SpendingInsightsData
}

export function InsightsClient({ data }: InsightsClientProps) {
  const [insights, setInsights] = useState<SpendingInsight[]>(data.insights)
  const [dismissedCount, setDismissedCount] = useState(data.dismissedCount)
  const [isPending, startTransition] = useTransition()

  const handleDismiss = (id: string) => {
    const target = insights.find((i) => i.id === id)
    setInsights((prev) => prev.filter((i) => i.id !== id))
    setDismissedCount((prev) => prev + 1)

    toast("Insight dismissed", {
      description: target?.title,
      action: {
        label: "Undo",
        onClick: () => {
          if (target) {
            setInsights((prev) => [target, ...prev])
            setDismissedCount((prev) => Math.max(0, prev - 1))
          }
        },
      },
    })

    startTransition(async () => {
      await dismissInsightAction(id)
    })
  }

  const handleToggleBookmark = (id: string, current: boolean) => {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isBookmarked: !current } : i))
    )

    toast(current ? "Bookmark removed" : "Insight bookmarked")

    startTransition(async () => {
      await toggleBookmarkInsightAction(id, current)
    })
  }

  const handleRestoreAll = () => {
    startTransition(async () => {
      await restoreAllDismissedInsightsAction()
      toast.success("Restored all previously dismissed insights")
    })
  }

  const anomalies = insights.filter(
    (i) => i.category === "spikes" || i.category === "outliers"
  )
  const subscriptions = insights.filter((i) => i.category === "subscriptions")
  const incomeAndCashflow = insights.filter(
    (i) => i.category === "income" || i.category === "cashflow"
  )
  const savings = insights.filter((i) => i.category === "savings")
  const bookmarked = insights.filter((i) => i.isBookmarked)

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                AI Spending Insights
              </h1>
              <HoverCard openDelay={150}>
                <HoverCardTrigger asChild>
                  <Badge
                    variant="outline"
                    className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default"
                  >
                    {data.currency}
                  </Badge>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3" align="start" side="top">
                  Anomalies and trends are analyzed against your 90-day baseline in {data.currency}.
                </HoverCardContent>
              </HoverCard>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automated anomaly detection, subscription tracking, and intelligent spending optimization.
            </p>
          </div>
        </div>

        {dismissedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreAll}
            disabled={isPending}
            className="rounded-xl font-bold gap-2 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9 self-start md:self-center"
          >
            <RotateCcw className="size-3.5" />
            Restore Dismissed ({dismissedCount})
          </Button>
        )}
      </div>

      {/* ── Briefing Hero ── */}
      <InsightsBriefingCard briefing={data.executiveBriefing} />

      {/* ── Metrics Row ── */}
      <InsightsMetricsRow metrics={data.metrics} currency={data.currency} />

      {/* ── Category Tabs & Feed ── */}
      <Tabs defaultValue="all" className="flex flex-col gap-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="rounded-xl bg-muted/50 p-1 border border-border/40 h-10 inline-flex">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold px-3">
              All ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="rounded-lg text-xs font-semibold px-3">
              Anomalies ({anomalies.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg text-xs font-semibold px-3">
              Subscriptions ({subscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="rounded-lg text-xs font-semibold px-3">
              Income & Cashflow ({incomeAndCashflow.length})
            </TabsTrigger>
            <TabsTrigger value="savings" className="rounded-lg text-xs font-semibold px-3">
              Savings ({savings.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="rounded-lg text-xs font-semibold px-3">
              Bookmarked ({bookmarked.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="m-0">
          {insights.length === 0 ? (
            <InsightsEmpty />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="m-0">
          {anomalies.length === 0 ? (
            <InsightsEmpty title="No Anomalies Flagged" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anomalies.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="m-0">
          {subscriptions.length === 0 ? (
            <InsightsEmpty title="No Subscription Alerts" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cashflow" className="m-0">
          {incomeAndCashflow.length === 0 ? (
            <InsightsEmpty title="Cashflow is Stable" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeAndCashflow.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="savings" className="m-0">
          {savings.length === 0 ? (
            <InsightsEmpty title="No Immediate Savings Gaps" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savings.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarked" className="m-0">
          {bookmarked.length === 0 ? (
            <InsightsEmpty title="No Bookmarked Insights" description="Star important insights to reference them anytime." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarked.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(dashboard)/insights/loading.tsx`**

Loading skeleton matching `/health/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
      </div>

      <Skeleton className="h-44 w-full rounded-2xl" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-10 w-96 rounded-xl" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(dashboard)/insights/page.tsx`**

```tsx
import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialInsightsData } from "@/lib/queries/insights"
import { InsightsClient } from "@/components/insights/insights-client"
import { serializeData } from "@/lib/utils"
import InsightsLoading from "./loading"

async function InsightsPageContent() {
  const session = await requireApprovedUser()
  const data = await getFinancialInsightsData(session.user.id)
  const serialized = serializeData(data)

  return <InsightsClient data={serialized} />
}

export default async function InsightsPage() {
  return (
    <Suspense fallback={<InsightsLoading />}>
      <InsightsPageContent />
    </Suspense>
  )
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0.

- [ ] **Step 5: Commit page and client container**

```bash
git add components/insights/insights-client.tsx app/\(dashboard\)/insights/
git commit -m "feat(insights): create /insights route and client hub (#9)"
```

---

### Task 8: Dashboard Widget Upgrade & Sidebar Navigation

**Files:**
- Modify: `components/dashboard/ai-insights.tsx`
- Modify: `components/layout/dashboard-sidebar.tsx`

- [ ] **Step 1: Upgrade `components/dashboard/ai-insights.tsx`**

Update `components/dashboard/ai-insights.tsx` to read from `getFinancialInsightsData(userId)`, show the briefing + top 3 active insights, and link directly to `/insights`:

```tsx
import React from "react"
import { getFinancialInsightsData } from "@/lib/queries/insights"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Sparkles,
  AlertTriangle,
  Flame,
  PiggyBank,
  Repeat,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react"

interface AIInsightsProps {
  userId: string
  className?: string
}

const CATEGORY_STYLES = {
  critical: "border-red-500/20 bg-red-500/5 text-red-500",
  warning: "border-amber-500/20 bg-amber-500/5 text-amber-500",
  opportunity: "border-purple-500/20 bg-purple-500/5 text-purple-500",
  info: "border-blue-500/20 bg-blue-500/5 text-blue-500",
}

const ICONS = {
  spikes: Flame,
  outliers: AlertTriangle,
  subscriptions: Repeat,
  savings: PiggyBank,
  cashflow: TrendingDown,
  income: Info,
}

export async function AIInsights({ userId, className = "" }: AIInsightsProps) {
  const data = await getFinancialInsightsData(userId)
  const topInsights = data.insights.slice(0, 3)

  return (
    <Card className={`relative overflow-hidden bg-card transition-colors duration-300 h-[400px] flex flex-col ${className}`}>
      <div className="absolute right-0 top-0 -z-10 translate-x-12 -translate-y-12 size-40 rounded-full bg-primary/5 blur-[40px]" />

      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="size-4.5 text-primary animate-pulse" />
            AI Financial Insights
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {data.executiveBriefing.summary}
          </CardDescription>
        </div>

        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-bold text-primary">
          <Link href="/insights">
            Hub
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pb-4">
        {topInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Sparkles className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              No anomalies detected. Your spending is in line with your 3-month baseline.
            </p>
          </div>
        ) : (
          topInsights.map((ins) => {
            const Icon = ICONS[ins.category] || Info
            const style = CATEGORY_STYLES[ins.severity] || CATEGORY_STYLES.info

            return (
              <div
                key={ins.id}
                className={`rounded-xl border ${style} p-3 flex gap-3 text-left transition-all hover:scale-[1.01]`}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40 shadow-xs">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground truncate">{ins.title}</h4>
                    {ins.metricLabel && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm">
                        {ins.metricLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                    {ins.description}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>

      <div className="p-3 border-t border-border/30 bg-muted/10 flex justify-between items-center text-xs text-muted-foreground px-5">
        <span>{data.insights.length} total signals</span>
        <Link href="/insights" className="font-semibold text-primary hover:underline flex items-center gap-1">
          Open Insights Hub ({data.insights.length})
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Add "Insights" to Sidebar Navigation in `components/layout/dashboard-sidebar.tsx`**

In `components/layout/dashboard-sidebar.tsx`:
1. Ensure `Sparkles` is imported from `lucide-react`.
2. Add `{ title: "Insights", href: "/insights", icon: Sparkles }` to `NAV_ITEMS` immediately after Health:

```ts
  { title: "Planner", href: "/planner", icon: Calculator },
  { title: "Health", href: "/health", icon: Activity },
  { title: "Insights", href: "/insights", icon: Sparkles },
  { title: "Budgets", href: "/budgets", icon: PiggyBank },
```

- [ ] **Step 3: Run full verification suite**

Run: `node --experimental-strip-types --test lib/calculations/__tests__/insights.test.ts`
Run: `npx tsc --noEmit`
Run: `npm run build`
Expected: All tests pass, typecheck passes, and Next.js build succeeds.

- [ ] **Step 4: Update roadmap in `docs/superpowers/plans/dime-features-roadmap.md`**

Mark `#9. AI Spending Insights` as completed in `docs/superpowers/plans/dime-features-roadmap.md`.

- [ ] **Step 5: Final Commit**

```bash
git add components/dashboard/ai-insights.tsx components/layout/dashboard-sidebar.tsx docs/superpowers/plans/dime-features-roadmap.md
git commit -m "feat(insights): integrate dashboard widget, sidebar navigation, and finalize roadmap (#9)"
```
