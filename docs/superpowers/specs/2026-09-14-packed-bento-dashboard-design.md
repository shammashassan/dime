# Packed Bento Dashboard Design Specification

**Feature ID:** 12 — High-Density Packed Bento Dashboard  
**Date:** 2026-09-14  
**Status:** Approved for Implementation  
**Target Release:** Next.js 16 (App Router), React 19, TypeScript 5, MongoDB, Tailwind CSS v4, shadcn/ui, GSAP, Recharts  

---

## 1. Executive Summary & Goals

Dime's primary overview dashboard at [`app/(dashboard)/dashboard/page.tsx`](file:///c:/dev/personal-projects/dime/app/%28dashboard%29/dashboard/page.tsx) serves as the central command center for the user's financial life. Following the completion of 11 major domain modules (Investments, Net Worth, Cash Flow Calendar, Bills, Subscriptions, Financial Health, AI Insights, Budgets, Loans, Contacts, and Universal Search), the existing dashboard consists of a conventional vertical stack that underutilizes available screen real estate and lacks immediate actionability.

Inspired by the high-density, multi-tier Bento architecture of [Volt's Workspace](file:///c:/dev/personal-projects/volt/components/dashboard/workspace-bento.tsx), this redesign transforms Dime's dashboard into an **ultra-dense, action-packed Bento Financial Command Center**. It couples real-time financial telemetry, official shadcn/ui charts, and live operational feeds with frictionless inline action cards—enabling users to log expenses/income, manage personal loans, trigger global searches, and inspect critical alerts in seconds.

### Core Objectives
1. **High-Density Bento Grid**: A cohesive, responsive 3-column CSS Bento grid featuring curated card heights, subtle micro-labels (`font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60`), and subtle translucent styling (`border-border/50 bg-card/60 shadow-sm backdrop-blur-sm`).
2. **Inline Action Cards**:
   - **Quick Log Card**: Fast transaction logging for both **Expense** and **Income** with dynamic wallet currency prefix, pre-selected default wallet, and instant submission.
   - **Loan Action Card**: Instant recording of personal debts with a toggle for **Lent** vs. **Borrowed**, contact selector, amount, and live outstanding debt summaries.
   - **Command Center**: Global search trigger (`⌘K`) plus quick-action shortcuts for modals (`+ Transaction`, `+ Budget`, `+ Goal`, `Settle Up`, `Transfer`).
3. **Official Shadcn/ui Chart Suite**: Strict compliance with shadcn chart primitives (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartConfig`) across dual-area cash flow trends, category spending donuts, and semi-circular health gauges.
4. **Actionable Today's Focus Strip**: Top-level alert badges for time-sensitive tasks (Overdue Bills, 7-Day Upcoming Renewals, Pending Loan Repayments, and Unread Notifications).
5. **GSAP Staggered Entrance**: Fluid entry animation honoring `prefers-reduced-motion` for a polished, premium feel matching Volt.
6. **Zero-Waterfall Next.js 16 Data Architecture**: Full parallel data aggregation using `Promise.all` with `React.cache()` and streaming Suspense skeletons.

---

## 2. Layout & Information Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Welcome greeting + Status Badge (v2.0 / Active Scope) + Current Date          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ROW 0: TODAY'S FINANCIAL FOCUS (4 Actionable Alert Pills)                             │
│  [ Overdue Bills (3) ]  [ Upcoming Renewals (5) ]  [ Loan Dues (2) ]  [ Unread (4) ]   │
├────────────────────────────────────────────────────────┬───────────────────────────────┤
│  ROW 1: COMMAND & QUICK LOG                            │                               │
│  [ Command Center Card: ⌘K Search + Quick Action Btns ]│ [ Quick Log: Expense/Income ] │
│  (Span 2 cols)                                         │ (Span 1 col)                  │
├────────────────────────────────────────────────────────┼───────────────────────────────┤
│  ROW 2: LOANS & FINANCIAL HEALTH                       │                               │
│  [ Quick Loan Action Card: Lent / Borrowed + Contact ] │ [ Financial Health Gauge Card]│
│  (Span 2 cols)                                         │ (Span 1 col - 0-100 Score Arc)│
├────────────────────────────────────────────────────────┴───────────────────────────────┤
│  ROW 3: EXECUTIVE KPI BENCHMARK STRIP                                                  │
│  [ Net Worth: $48,250 (+4.2%) ] [ Cash Flow: +$3,420 ] [ Savings Rate: 34.5% ]         │
├────────────────────────────────────────────────────────┬───────────────────────────────┤
│  ROW 4: CORE VISUAL ANALYTICS (Shadcn Charts)          │                               │
│  [ Income vs Expense Cash Flow Trend (Area/Bar Chart) ]│ [ Category Spending Donut ]   │
│  (Span 2 cols - 30d/60d/90d toggle)                    │ (Span 1 col - % Distribution) │
├────────────────────────────────────────────────────────┼───────────────────────────────┤
│  ROW 5: INTELLIGENCE & GOALS                           │                               │
│  [ AI Spending Insights: Executive Pulse + 3 Signals ] │ [ Active Savings Goals Rings ]│
│  (Span 2 cols)                                         │ (Span 1 col - Target Milest.) │
├────────────────────────────────────────────────────────┼───────────────────────────────┤
│  ROW 6: LIVE OPERATIONS & FEEDS                        │                               │
│  [ Upcoming Bills & Subs with 1-Click "Mark Paid" ]    │ [ Active Budgets Utilization] │
│  (Span 1.5 cols)                                       │ (Span 1.5 cols)               │
├────────────────────────────────────────────────────────┴───────────────────────────────┤
│  ROW 7: RECENT TRANSACTIONS STREAM                                                     │
│  [ Live feed with Merchant Logos, Category Pills, Status Tags, and Deep Links ]        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Desktop (`lg` / ≥ 1024px)**: 3-column CSS Grid (`grid-cols-3 gap-4`).
- **Tablet (`md` / 768px – 1023px)**: 2-column layout; 2-col spans remain 2-cols, 1-col cards wrap cleanly.
- **Mobile (`< 768px`)**: Single-column vertical stream (`grid-cols-1 gap-4`) with horizontal scrolling where appropriate (e.g. Focus pills).

---

## 3. Detailed Component Specifications

### 3.1 Header & Hero
- **File**: `components/dashboard/dashboard-header.tsx`
- **Props**: `userName: string`, `scopeName?: string`, `isOrganization?: boolean`
- **Visual Elements**:
  - Small uppercase mono subtitle: `dime workspace // financial os`
  - Pill badge: `v2.0` or active space name
  - Heading: `Welcome back, <Name>` with linear gradient text highlight
  - Right side: Formatted current date and quick status summary

---

### 3.2 Today's Financial Focus (`components/dashboard/financial-focus-strip.tsx`)
Four compact cards grouped in a responsive grid displaying real-time actionable counts:
1. **Overdue Bills**: Red badge with count and total overdue amount; links to `/recurring?tab=bills&status=overdue`.
2. **Upcoming Renewals (7 Days)**: Amber badge with count of subscriptions/bills renewing within 7 days; links to `/recurring`.
3. **Pending Loan Dues**: Indigo/Violet badge with loans nearing due date or overdue; links to `/loans`.
4. **Unread Alerts**: Rose badge showing unread notification count; links to `/notifications`.

---

### 3.3 Command Center Card (`components/dashboard/command-center-card.tsx`)
- **Span**: 2 columns on desktop.
- **Search Trigger**: Full-width faux input bar with `Search` icon, placeholder `"Search transactions, budgets, contacts, goals..."`, and `⌘K` keyboard badge. Clicking dispatches `open-global-search` window event to open Dime's Universal Command Palette.
- **Quick Action Bar**:
  - `+ Transaction`: Opens standard full transaction dialog (with splits/notes).
  - `+ Budget`: Opens create budget modal.
  - `+ Goal`: Opens create goal modal.
  - `Settle Up`: Opens shared expense settlement sheet.
  - `Transfer`: Opens wallet-to-wallet transfer modal.

---

### 3.4 Quick Log Card (`components/dashboard/quick-log-card.tsx`)
- **Span**: 1 column on desktop.
- **Controls**:
  - **Transaction Type Toggle**: Compact `ToggleGroup` switching between `expense` (default, destructive/rose accent) and `income` (emerald accent).
  - **Amount Input**: Controlled number/decimal input wrapped in `InputGroup`. Prefix dynamically renders the **selected wallet's currency symbol** (e.g. `$`, `€`, `₹`, `£`).
  - **Description Input**: Text input with placeholder `"What was this for?"` (e.g., *"Coffee"*, *"Client payment"*).
  - **Wallet Dropdown**: `Select` element listing all non-archived user wallets. **Pre-selected** to the user's preferred wallet from preferences. Selecting a different wallet immediately updates the currency prefix.
  - **Category Dropdown**: Compact category selector pre-filtered by selected type (`expense` or `income`).
  - **Submit Button**: Quick submit button with spinner state calling `createTransaction`.
- **User Feedback**: Immediate optimistic clear, Sonner toast notification with `"Transaction logged!"` and action link `"View →"`.

---

### 3.5 Loan Action Card (`components/dashboard/loan-action-card.tsx`)
- **Span**: 2 columns on desktop.
- **Header Summary**:
  - Displays live aggregate stats from `getOwedSummaries()`: **Total Lent** (incoming assets) vs. **Total Borrowed** (liabilities) with net debt status pill.
- **Inline Loan Creator**:
  - **Type Toggle**: `Lent` (*"I lent to someone"*) vs. `Borrowed` (*"I borrowed from someone"*).
  - **Contact Dropdown**: Searchable selector of existing contacts (`getContacts()`) with avatar initials and a quick `+ New Contact` option.
  - **Amount Input**: Currency input with base currency prefix.
  - **Due Date Options**: Preset buttons (*"Next Week"*, *"End of Month"*, or custom date).
  - **Submit**: Calls `createLoanAction` with Sonner toast feedback.
- **Quick Peek Drawer / Tab**:
  - Toggle to view the 3 nearest upcoming loan repayments with 1-click navigate to `/loans/[id]`.

---

### 3.6 Financial Health Arc Gauge (`components/dashboard/financial-health-gauge-card.tsx`)
- **Span**: 1 column on desktop.
- **Visualization**: Semi-circular 180° `RadialBarChart` using shadcn `ChartContainer` mapping score (0–100) into 4 color tiers:
  - *Needs Attention* (< 40, Rose)
  - *Fair* (40–59, Amber)
  - *Good* (60–79, Blue)
  - *Excellent* (80–100, Emerald)
- **Content**:
  - Large central score typography with tier badge.
  - 4 micro progress meters: Liquidity, Savings Rate, Debt Control, Budget Adherence.
  - Top dynamic recommendation banner with projected point gain.
  - Deep-link button: `View Full Health Analysis →` (`/health`).

---

### 3.7 Executive KPI Benchmark Strip (`components/dashboard/executive-kpi-strip.tsx`)
Full-width 3-card bento strip:
1. **Net Worth**: Total balance calculated from all active assets & liabilities, 30-day change delta (`+$1,240 (+3.2%)`), and mini SVG sparkline.
2. **Monthly Cash Flow**: Total Inflow vs. Total Outflow for the current calendar month with a net surplus/deficit indicator.
3. **Savings Rate**: Calculated `(Inflow - Outflow) / Inflow * 100` with visual progress bar against healthy savings benchmarks (20% rule).

---

### 3.8 Cash Flow & Spending Trend Chart (`components/dashboard/spending-trend-chart.tsx`)
- **Span**: 2 columns on desktop.
- **Chart Type**: Shadcn `AreaChart` with dual gradient areas:
  - `income`: `var(--chart-1)` (Emerald)
  - `expense`: `var(--chart-2)` (Rose)
- **Time Controls**: `ToggleGroup` header switching between **30D**, **60D**, and **90D**.
- **Tooltip**: `ChartTooltipContent` displaying formatted currency, day label, and daily net flow.

---

### 3.9 Category Spending Donut Chart (`components/dashboard/category-breakdown.tsx`)
- **Span**: 1 column on desktop.
- **Chart Type**: Shadcn `PieChart` (Donut with inner radius 60, outer radius 85).
- **Data**: Top 5 spending categories + aggregated *Others* slice.
- **Center Label**: Total expense amount for the selected period rendered inside the donut ring.
- **Legend**: `ChartLegendContent` with colored indicator dots, category names, amounts, and percentage shares.

---

### 3.10 AI Spending Insights Card (`components/dashboard/ai-insights.tsx`)
- **Span**: 2 columns on desktop.
- **Content**:
  - Executive natural language narrative synthesized from spending trends.
  - Top 3 prioritized anomalous signals (e.g. Category spike, Subscription creep, Duplicate billing).
  - 1-click action links (e.g. `/transactions?category=Dining`).

---

### 3.11 Active Savings Goals Card (`components/dashboard/active-goals-card.tsx`)
- **Span**: 1 column on desktop.
- **Content**:
  - Top 3 active goals with current balance, target amount, and circular or linear percentage progress meters.
  - Target date countdown badge (*"3 months left"*).
  - Quick link to `/goals`.

---

### 3.12 Live Operations & Feeds
1. **Upcoming Recurring & Bills (`components/dashboard/upcoming-recurring.tsx`)**:
   - Lists recurring transactions and bills due in the next 14 days.
   - Includes 1-click **"Mark Paid"** action button that records the transaction immediately.
2. **Active Budgets List (`components/dashboard/budget-progress-list.tsx`)**:
   - Progress bars showing monthly spend vs. budget limit.
   - Color transitions: Green (<80%), Amber (80-99%), Destructive (≥100%).
   - Daily remaining allowance calculation.
3. **Recent Transactions Feed (`components/dashboard/recent-transactions.tsx`)**:
   - Live stream of the last 10 transactions with merchant avatar/icon, category badge, wallet indicator, amount (green for income, default for expense), and direct link to `/transactions`.

---

## 4. GSAP Entrance Animation Specification

To replicate Volt's signature entrance feel:
- In `components/dashboard/dashboard-bento.tsx`:
  ```ts
  useGSAP(() => {
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
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "transform",
      })
    })

    return () => mm.revert()
  }, { scope: containerRef })
  ```
- All bento grid items receive the `.bento-tile` class.
- Initial hide is managed via GSAP (`gsap.set`) so users without JavaScript enabled or with reduced motion see content without layout flash.

---

## 5. Backend Data Queries & Server Architecture

### 5.1 Parallel Data Fetching in `app/(dashboard)/dashboard/page.tsx`
No sequential waterfalls. The server component fetches all scoped entities in parallel:

```ts
const [
  prefs,
  wallets,
  contacts,
  owedSummary,
  focusCounts,
  trendData,
  categoryBreakdown,
  healthData,
  insightsData,
  activeBudgets,
  activeGoals,
  upcomingRecurring,
  recentTransactions
] = await Promise.all([
  getPreferences(userId),
  getWallets(userId),
  getContacts(),
  getOwedSummaries(),
  getDashboardFocusCounts(userId),
  getDailyIncomeExpenseTrend(userId),
  getCategoryBreakdown(userId),
  getFinancialHealthScore(userId),
  getExecutiveInsights(userId),
  getBudgets(userId),
  getGoals(userId),
  getUpcomingRecurring(userId),
  getRecentTransactions(userId, 10),
])
```

### 5.2 New Query: `getDashboardFocusCounts(userId: string)`
Located in `lib/queries/dashboard.ts`:
- Returns:
  ```ts
  export interface DashboardFocusCounts {
    overdueBillsCount: number
    overdueBillsAmount: number
    upcomingRenewalsCount: number // next 7 days
    pendingLoansCount: number     // due within 7 days or overdue
    unreadNotificationsCount: number
    baseCurrency: string
  }
  ```
- Evaluates overdue bills, recurring rules with `nextRun` in the next 7 days, active loans with `dueDate` in the next 7 days or overdue, and unread notifications from `notificationsCollection`.
- Wrapped in `React.cache()` for query deduplication.

### 5.3 Server Actions & Revalidation
- **`createTransaction`**: Existing action in `lib/actions/transactions.ts`. Successfully logging an expense or income revalidates `/dashboard` and `/transactions`.
- **`createLoanAction`**: Existing action in `lib/actions/loans.ts`. Creating a loan updates loan summaries and revalidates `/dashboard` and `/loans`.
- **`markRecurringPaidAction`** / **`markBillPaidAction`**: Revalidates `/dashboard` and `/recurring`.

---

## 6. Verification & Testing Plan

### 6.1 Automated Unit Tests
- **Focus Counts Calculation**: Test `getDashboardFocusCounts` logic with edge cases (overdue dates, bills spanning months, multi-currency conversion).
- **Quick Log Form Validation**: Verify `transactionSchema` validates amount integer conversion and wallet currency matching.
- **Loan Action Form Validation**: Verify `loanSchema` correctly handles `lent` vs `borrowed` types, contact assignment, and optional due dates.

### 6.2 Manual Verification Steps
1. **Responsive Bento Grid**:
   - Inspect desktop (`lg`), tablet (`md`), and mobile (`< 768px`) screen sizes. Verify no overflow or collapsed cards.
2. **Quick Log Execution**:
   - Log an expense with the default wallet. Verify instant Sonner toast and wallet balance update.
   - Switch toggle to Income, select a different currency wallet (e.g. EUR wallet), verify currency prefix changes to `€`, and log income.
3. **Loan Action Execution**:
   - Select a contact, toggle `Lent`, record a loan, and verify `Total Lent` immediately increments.
   - Toggle `Borrowed`, record a borrowed loan, and verify `Total Borrowed` increments.
4. **Shadcn Charts Fidelity**:
   - Hover over Area Chart and Donut Chart, verify tooltips render proper currency symbols and formatted dates.
   - Switch Area Chart from 30D to 60D and 90D; verify seamless data re-render.
5. **Animation & Accessibility**:
   - Verify GSAP staggered entrance runs smoothly on load.
   - Test with `prefers-reduced-motion: reduce` in DevTools; verify instant display without animation.
   - Verify keyboard tab navigation through all interactive action cards and command triggers.
