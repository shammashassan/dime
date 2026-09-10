# Feature #9: AI Spending Insights — Design Specification

**Status**: Approved / In Design Review  
**Date**: 2026-09-10  
**Target Module**: AI Spending Insights (`/insights`)  
**Parent Roadmap Item**: #9 in `docs/superpowers/plans/dime-features-roadmap.md`

---

## 1. Executive Summary

Dime needs an intelligent, automated spending analytics engine that spots financial anomalies, tracks subscription price creep, flags income irregularities, and highlights actionable savings opportunities. 

This feature introduces a **Hybrid Analysis Architecture**:
- A fast, pure mathematical calculation engine in `lib/calculations/insights.ts` executing deterministic anomaly detection against 3 completed 30-day baseline periods with zero external API dependencies.
- A natural-language narrative generator using Google Gemini (via `GEMINI_API_KEY`) to synthesize a concise weekly/monthly executive briefing and focal advice, backed by a resilient dynamic template fallback when offline or without an API key.
- A dedicated, high-impact `/insights` hub with category filtering (`All`, `Anomalies`, `Subscriptions`, `Income & Cashflow`, `Savings`, `Bookmarked`), persistent user interaction states (dismissing and bookmarking stored in MongoDB), and direct 1-click action links.
- Consistent UI alignment with Dime's existing design system seen in Financial Health (`/health`), Net Worth (`/net-worth`), and Investments (`/investments`).

---

## 2. Layered Architecture & Directory Structure

Following the established project convention across `lib/`:

```
lib/
├── calculations/
│   ├── insights.ts              # Pure, deterministic anomaly detection & narrative synthesis
│   └── __tests__/
│       └── insights.test.ts     # Thorough unit tests for detectors, edge cases, thresholds
├── queries/
│   └── insights.ts              # Cached React data query (fetches txs, rules, budgets, user states)
├── actions/
│   └── insights.ts              # Server actions for dismissing, bookmarking, and restoring insights
├── validations/
│   └── insight.schema.ts        # Zod schemas for action payloads and filters
└── db/
    └── collections.ts           # Exports userInsightStatesCollection

types/
└── index.ts                     # SpendingInsight, UserInsightState, SpendingInsightsData types

app/(dashboard)/
├── insights/
│   ├── page.tsx                 # Server Component with Suspense
│   └── loading.tsx              # Loading skeleton matching /health & /reports
components/
├── insights/
│   ├── insights-client.tsx      # Interactive client view with tabs and optimistic state
│   ├── insights-briefing-card.tsx # Hero card for Gemini / template executive narrative
│   ├── insights-metrics-row.tsx # Bento metric cards (anomalies, savings, surges, recurring)
│   ├── insight-card.tsx         # shadcn Card with severity badges, metrics, dismiss & bookmark
│   └── insights-empty.tsx       # shadcn Empty state component
└── dashboard/
    └── ai-insights.tsx          # Upgraded dashboard widget pulling from getFinancialInsightsData
```

---

## 3. Data Contracts & Domain Types (`types/index.ts`)

```ts
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

---

## 4. Pure Detection Engine (`lib/calculations/insights.ts`)

All detectors are pure functions, completely decoupled from MongoDB, API network calls, and UI state. They accept strongly-typed historical inputs and return an array of `SpendingInsight` objects:

```ts
export interface InsightEngineInputs {
  transactions: Transaction[]    // Past 120 days (current 30d + 3 completed 30d baseline periods)
  categories: Category[]
  budgets: Budget[]
  recurringRules: RecurringRule[]
  userStates: UserInsightState[]  // For filtering dismissed items & marking bookmarked
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date           // Defaults to new Date(), supports deterministic backtesting
}
```

### 4.1 Detector Families

1. **Category Spike & Shift Detector**
   - **Baseline Windows**: Partitions historical transactions into:
     - Current Period: Days $0 \to 30$
     - Baseline Periods: Period 1 ($30 \to 60\text{d}$), Period 2 ($60 \to 90\text{d}$), Period 3 ($90 \to 120\text{d}$).
     - Baseline average = $\frac{\sum \text{expenses in 3 completed periods}}{3}$.
   - **Safeguards**: Only triggers if baseline average $> \$30$ (3,000 cents) and transaction count in baseline $\ge 3$. Prevents divide-by-zero or wild % increases from near-zero baselines.
   - **Trigger**: Current 30-day spending in category $\ge 1.25 \times \text{baseline}$ and absolute increase $\ge \$25$ (2,500 cents).
   - **Severity**: `critical` if $\ge 1.6 \times$ baseline; otherwise `warning`.

2. **Transaction Outlier Detector**
   - **Safeguard**: Evaluates only categories with $\ge 5$ historical transactions in the last 120 days.
   - **Baseline**: Computes arithmetic mean ($\mu$) and sample standard deviation ($\sigma$) per category.
   - **Trigger**: Any transaction in the current 30-day period where $\text{amount} > \mu + 2.5\sigma$ and $\text{amount} \ge \$50$ (5,000 cents).
   - **Severity**: `warning`. Flags specific vendor and deviation ratio.

3. **Subscription & Recurring Creep Detector**
   - **Description Normalization**: Cleans transaction descriptions via `.toLowerCase().replace(/[^a-z0-9]/g, "").trim()`.
   - **Trigger 1 (Price Hike)**: Identifies recurring rules where recent transactions generated under the rule exceed the rule's stated baseline amount by $\ge 5\%$.
   - **Trigger 2 (Duplicate Charges)**: Detects 2 or more transactions with identical normalized descriptions and amounts occurring within $\le 5$ days of each other (excluding intentional transfers).
   - **Trigger 3 (Creeping Total)**: Compares total monthly recurring commitment across all active rules against historical quarter-start total.

4. **Income Irregularity Detector**
   - **Baseline**: Evaluates regular income frequency and average monthly income over the 3 completed 30-day baseline periods.
   - **Trigger 1 (Missing / Delayed Payday)**: If user historically receives recurring salary between the 25th and 5th, and no income transaction has arrived by the 7th.
   - **Trigger 2 (Income Dip)**: If current 30-day income has dropped by $>25\%$ compared to baseline without a corresponding decrease in scheduled expenses.
   - **Severity**: `critical` for missing salary / major dip; `warning` for minor lag.

5. **Savings Opportunities & Budget Surpluses**
   - **Budget Surpluses**: Detects active budgets where spending was $<75\%$ of budget allocation for 2 consecutive periods. Highlights surplus amount available to allocate toward goals.
   - **Micro-transaction Discretionary Leakage**: Aggregates small discretionary transactions ($< \$15$ / 1,500 cents in food, coffee, entertainment) occurring $\ge 12$ times in 30 days. Computes projected annual savings if cut by 30%.
   - **Severity**: `opportunity`.

6. **Cash Flow Velocity & Burn Rate**
   - Compares 7-day spending rate ($\times 4.3$) against current monthly income.
   - If projected month-end burn rate exceeds income by $\ge \$100$, flags early deficit risk.
   - **Severity**: `critical` if projected deficit $> \$250$; otherwise `warning`.

### 4.2 Deduplication, Scoring & Ranking

- Every insight has a deterministic ID generated from its trigger criteria (e.g. `spike_${categoryId}_${period}`, `outlier_${txId}`, `sub_hike_${ruleId}`).
- Scores range from 0 to 100 based on severity, monetary impact, and category significance.
- Insights are sorted descending by score. Dismissed insights (`status === "dismissed"`) are excluded from the main feed but counted in `dismissedCount`.

### 4.3 Narrative Synthesis (Hybrid Architecture)

```ts
export async function generateExecutiveBriefing(
  insights: SpendingInsight[],
  metrics: SpendingInsightsData["metrics"],
  currency: string
): Promise<{ summary: string; focalAdvice: string; isAiGenerated: boolean }>
```
- **Gemini Engine**: If `process.env.GEMINI_API_KEY` is set, constructs a compact JSON prompt summarizing the top 3-4 detected metrics and asks `gemini-1.5-flash` to return a 2-sentence executive summary and 1 high-priority actionable focus tip.
- **Strict Separation**: Gemini **only summarizes and formats** pre-computed deterministic facts; it is never allowed to calculate, project, or invent numbers.
- **Dynamic Template Fallback**: If `GEMINI_API_KEY` is missing or the API returns an error/times out, a rule-based template engine synthesizes the narrative deterministically based on net surplus/deficit, top category surge, and highest potential savings.

---

## 5. Persistence Layer & Database Schemas

### 5.1 MongoDB Collection: `user_insight_states`
```ts
{
  _id: ObjectId,
  userId: string,
  organizationId: string | null,
  insightKey: string,              // e.g. "spike_650a1b2c3d_2026_09"
  status: "active" | "dismissed" | "bookmarked",
  dismissedAt?: Date,
  bookmarkedAt?: Date,
  updatedAt: Date
}
```
**Indexes**:
- `{ userId: 1, insightKey: 1 }` (unique compound index)
- `{ userId: 1, status: 1 }`

### 5.2 Server Actions (`lib/actions/insights.ts`)
- `dismissInsightAction({ insightKey: string })`: Upserts record with `status: "dismissed"`, `dismissedAt: new Date()`. Calls `revalidatePath("/insights")` and `revalidatePath("/dashboard")`.
- `toggleBookmarkInsightAction({ insightKey: string })`: Toggles between `"bookmarked"` and `"active"`.
- `restoreAllDismissedInsightsAction()`: Removes all `"dismissed"` states for the user to restore their insight feed.

---

## 6. UI & Design System Specifications

### 6.1 Route: `/insights` (`app/(dashboard)/insights/page.tsx`)
- Server Component that authenticates via `requireApprovedUser()`.
- Fetches data via `getFinancialInsightsData(userId)`.
- Serializes via `serializeData()` and passes to `<InsightsClient data={serializedData} />`.
- Wrapped in `<Suspense fallback={<InsightsLoading />}>`.

### 6.2 Visual Hierarchy & Consistency (Matching `/health`, `/net-worth`, `/investments`)
- **Header**:
  - Icon container: `p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5` with `Sparkles`.
  - Title: `text-2xl font-extrabold tracking-tight text-foreground`.
  - Currency Badge: `variant="outline" className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default"` with `HoverCard` explanatory popup.
  - Action Button: `variant="outline" size="sm" className="rounded-xl font-bold gap-2 text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9"`.
- **Top Metrics Row (`insights-metrics-row.tsx`)**:
  - 4 Bento metric cards displaying:
    1. **Active Anomalies**: Count of spikes, outliers, and irregularities with warning accent.
    2. **Monthly Savings Potential**: Deterministically calculated unspent surplus and discretionary leakage.
    3. **Discretionary Spending Surge**: Total delta above baseline across non-essential categories.
    4. **Recurring Commitments Tracked**: Total active recurring rules and subscription count.
- **Executive Briefing Hero Card (`insights-briefing-card.tsx`)**:
  - Card with soft radial gradient accent (`bg-primary/5 blur-[40px]`).
  - AI badge (`Gemini AI` or `Diagnostic Analysis`).
  - Narrative 2-sentence summary and highlighted focal advice callout box.
- **Category Filter Tabs (`insights-client.tsx`)**:
  - shadcn `TabsList` with:
    - `All (${total})`
    - `Anomalies (${anomalyCount})`
    - `Subscriptions (${subCount})`
    - `Income & Cashflow (${cashflowCount})`
    - `Savings (${savingsCount})`
    - `Bookmarked (${bookmarkedCount})`
- **Insight Cards (`insight-card.tsx`)**:
  - `Card` with semantic severity badge:
    - `critical`: `bg-red-500/10 text-red-500 border-red-500/20`
    - `warning`: `bg-amber-500/10 text-amber-500 border-amber-500/20`
    - `opportunity`: `bg-purple-500/10 text-purple-500 border-purple-500/20`
    - `info`: `bg-blue-500/10 text-blue-500 border-blue-500/20`
  - Impact pill badge showing $+X\%$ or delta amount.
  - 1-click action button with `ArrowUpRight` (e.g., `Review Transactions`, `Adjust Budget`, `Manage Recurring`).
  - Star bookmark toggle button and `X` dismiss button with tooltip.
  - Optimistic UI state with `sonner` toast notification containing an "Undo" action.
- **Empty State (`insights-empty.tsx`)**:
  - Uses shadcn `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription` with a clean checkmark or sparkle icon.

### 6.3 Dashboard Integration (`components/dashboard/ai-insights.tsx`)
- Upgrades the existing dashboard widget to consume `getFinancialInsightsData(userId)`.
- Displays the executive briefing blurb + top 3 active high-priority insights.
- Adds an explicit footer link: "View all in Insights Hub →" linking to `/insights`.

### 6.4 Sidebar Navigation (`components/layout/dashboard-sidebar.tsx`)
- Adds `{ title: "Insights", href: "/insights", icon: Sparkles }` to `NAV_ITEMS`, placed right next to *Health* and *Planner*.

---

## 7. Testing & Quality Verification

1. **Unit Tests (`lib/calculations/__tests__/insights.test.ts`)**:
   - Verify category baselines across 3 completed 30-day periods.
   - Test division by zero and near-zero baselines ($<\$30$).
   - Test minimum $\ge 5$ transaction constraint for outlier detection.
   - Test description normalization with special characters, mixed case, and punctuation.
   - Test income irregularity detection for missing payday and income drops.
   - Verify deterministic fallback when `GEMINI_API_KEY` is not present.
2. **Type Safety & Linter Verification**:
   - Strict TypeScript, no `any`, proper imports and exports.
3. **Responsive & Theme Verification**:
   - Full dark mode and light mode token compliance.
   - Mobile and desktop responsive layouts.
