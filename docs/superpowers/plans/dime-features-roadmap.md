# Dime Roadmap – Next Major Features

We want Dime to evolve into a premium, modern personal finance platform comparable to Monarch Money, Copilot Money, YNAB, and Lunch Money while remaining simple, fast, privacy-focused, and beautifully designed.

Before implementing any feature, carefully review the existing codebase, database models, server actions, APIs, background jobs, notification system, search infrastructure, analytics, and UI components. Reuse existing architecture and patterns wherever possible. Extend existing models instead of creating duplicate implementations.

---

# ✅ Completed Features

## Core Finance

* ✅ Wallets & Accounts
* ✅ Transactions
* ✅ Categories
* ✅ Budgets
* ✅ Budget Templates
* ✅ Goals
* ✅ Advanced Search & Universal Command Palette

## Collaboration

* ✅ Couples & Shared Budgeting (Spaces)
* ✅ Shared Expense Settlement & Group Debt Simplification

## Automation

* ✅ Automation Rules Engine

## Money Management

* ✅ Transaction Splitting
* ✅ Loans & Lending (Personal Lending)
* ✅ Recurring Platform (Recurring Transactions)
* ✅ Subscription Manager
* ✅ Bill Manager
* ✅ Cash Flow Calendar
* ✅ Investment Tracker & Portfolio Management

## Analytics

* ✅ Reports & Analytics
* ✅ Net Worth Dashboard
* ✅ Financial Planner (Forecasting & Scenarios)
* ✅ Financial Health Score
* ✅ AI Spending Insights
* ✅ Packed Bento Dashboard (Custom Dashboard Redesign)
* ✅ Spending Heatmaps & Habit Streaks
* ✅ AI Financial Coach
* ✅ Monthly Financial Review

## People

* ✅ Contacts

## Platform

* ✅ Financial Timeline
* ✅ Financial Inbox & Notifications Center
* ✅ Product Polish & User Experience (Bulk Actions, Keyboard Navigation, Saved Views)

---

# 1. Subscription Manager ✅ COMPLETED

Automatically detect and manage recurring subscriptions.

Examples:

* Netflix
* Spotify
* ChatGPT
* Domains
* Hosting
* SaaS
* Gym memberships
* Apple iCloud
* Google One

Features:

* Automatic subscription detection
* Monthly & annual cost
* Renewal calendar
* Upcoming renewals
* Cancellation reminders
* Free trial tracking
* Renewal notifications
* Price increase tracking
* Subscription analytics
* Monthly subscription trends
* Active vs cancelled subscriptions

### Additional Completed Features

* ✅ Subscription detail pages
* ✅ Subscription analytics dashboard
* ✅ Subscription status tracking
* ✅ Upcoming renewal overview
* ✅ Renewal history
* ✅ Manual renewal logging
* ✅ Integration with recurring engine
* ✅ Shared recurring infrastructure

Integrations:

* Notifications
* Automation Rules
* Cash Flow Calendar
* Financial Planner
* Reports
* Dashboard Widgets

Status:

**Completed. Future enhancements should focus on subscription price history, automatic merchant detection improvements, and optional bank synchronization.**

---

# 2. Bill Manager ✅ COMPLETED

Track recurring and one-time bills separately from subscriptions.

Examples:

* Electricity
* Water
* Internet
* Rent
* Insurance
* Taxes
* School fees
* Maintenance
* Phone bill

Features:

* Due dates
* Recurring schedules
* Variable bill amounts
* Paid / unpaid status
* Overdue alerts
* Reminder notifications
* Payment history
* Monthly calendar
* Upcoming bills
* Bill categories
* Auto-create recurring bills

### Additional Completed Features

* ✅ Bill instances
* ✅ Bill payment history
* ✅ Bill detail pages
* ✅ Bill status management
* ✅ Upcoming bills overview
* ✅ Overdue tracking
* ✅ Bill analytics
* ✅ Shared recurring infrastructure
* ✅ Variable amount support
* ✅ Manual payment recording

Integrations:

* Notifications
* Calendar
* Automation Rules
* Financial Planner
* Reports

Status:

**Completed. Future enhancements should focus on OCR bill import, email parsing, and automatic bill detection.**

---

# 3. Net Worth Dashboard ✅ COMPLETED

Provide a complete financial overview.

Assets

* Cash
* Wallets
* Bank Accounts
* Investments
* Gold
* Crypto
* Real Estate
* Vehicles
* Money Lent

Liabilities

* Money Borrowed
* Credit Cards
* Personal Loans
* Mortgages
* Other Debts

Display:

* Current Net Worth
* Monthly Growth
* Asset Allocation
* Liability Breakdown
* Historical Charts
* Net Worth Timeline
* Monthly Changes

### Additional Completed Features

* ✅ Dedicated Assets & Liabilities management
* ✅ Manual asset tracking
* ✅ Manual liability tracking
* ✅ Asset valuation history
* ✅ Historical net worth calculation
* ✅ Currency allocation
* ✅ Asset allocation
* ✅ Top Assets
* ✅ Top Liabilities
* ✅ Financial Health panel
* ✅ Net Worth insights
* ✅ Interactive Bento dashboard
* ✅ Asset detail pages
* ✅ Liability detail pages
* ✅ Ownership percentages
* ✅ Multiple asset categories
* ✅ Historical valuation support
* ✅ Dynamic net worth reconstruction
* ✅ Append-only valuation history

Future Integrations

* Investment Portfolio
* Financial Planner
* AI Financial Coach
* Dashboard Widgets
* Reports
* Open Banking

Status:

**Completed. Future enhancements should focus on investment synchronization and automatic market valuation.**

---

# 4. Investment Tracker ✅ COMPLETED

Track investments manually initially.

> **Status**: Completed. Transaction-ledger portfolio engine, holdings calculation, brokerage account organization, market price snapshots, asset allocation half-donut gauges, and Net Worth integration are fully built and live.

Support:

* ✅ Stocks
* ✅ ETFs
* ✅ Mutual Funds
* ✅ Crypto
* ✅ Gold
* ✅ Bonds
* ✅ EPF
* ✅ PPF
* ✅ NPS
* ✅ Fixed Deposits

Features:

* ✅ Holdings calculation (derived from transaction ledger)
* ✅ Quantity & Weighted Average Buy Price (Cost Basis)
* ✅ Current Market Value
* ✅ Unrealized & Realized Gain/Loss tracking
* ✅ Asset Class Allocation 180° radial gauges & pie charts
* ✅ Portfolio Position Summary & Top Holdings cards
* ✅ Investment Notes & transaction metadata

### Additional Completed Features

* ✅ Transaction-Ledger single source of truth (Buys, Sells, Dividends, Fees)
* ✅ Brokerage Accounts (Wallets with type = investment)
* ✅ Manual market price snapshot logger (`recordPriceSnapshot`)
* ✅ Recent Investment Activity feed with `<HoverCard>` popups
* ✅ Integration into Net Worth overview calculations
* ✅ Holdings and Account detail views (`/investments/[accountId]`, `/investments/[accountId]/[symbol]`)
* ✅ Controlled shadcn `Popover` + `Calendar` transaction date pickers
* ✅ Multi-currency cents unit scaling

Future Enhancements:

* Live price API integrations
* Brokerage account sync (Plaid / Yodlee)
* Investment watchlists UI
* Multi-currency exchange rate forecasting
---

# 5. Shared Expense Settlement ✅ COMPLETED

Extend Shared Spaces and Contacts with expense splitting, dynamic pairwise balance calculation, and debt simplification graph algorithms.

Status:
**Completed.** Pure graph calculations and balance logic implemented in calculation engines (`lib/calculations/shared-expenses.ts`), database persistence in `shared_expenses` and `shared_settlements` collections, Server Actions in `lib/actions/shared-expenses.ts`, dedicated `/shared-expenses` dashboard route, interactive Settle-Up modal, optional wallet linking, inbox notification triggers, and Contacts page integration.

Features:
* ✅ Equal split mode
* ✅ Percentage split mode
* ✅ Custom split mode
* ✅ Dynamic pairwise balance calculations (computed on-the-fly)
* ✅ Derived debt simplification graph algorithm (minimizes total group transfers)
* ✅ 1-Click Settle Up modal with payment method logging & optional wallet linking
* ✅ Shared Expenses feed & Settlement history log
* ✅ Integration with Contacts (`/shared-expenses?contactId=...`)
* ✅ Notification Center inbox notifications for shared expenses
* ✅ Layered architecture with pure calculations separated from server actions and UI

---

# 6. Contacts ✅ COMPLETED

Introduce reusable contacts across Dime.

Each Contact should support:

* Name
* Phone
* Email
* Avatar
* Notes

A contact can be referenced by:

* Loans
* Shared expenses
* Future reimbursements
* Payment history
* Financial timeline

Benefits:

* Autocomplete
* Contact history
* Analytics
* Better search
* Reduced duplicate data

### Additional Completed Features

* ✅ Full contact CRUD (create, edit, delete)
* ✅ Contact detail pages with linked loans
* ✅ Contact activity timeline (loan history)
* ✅ Money lent/borrowed summary per contact
* ✅ Contacts list view with search & filters
* ✅ Contact dialog (create/edit)
* ✅ Integration with Loans module
* ✅ Contact notes support
* ✅ MongoDB collection + indexes

### Additional Planned Features (Future)

* Contact groups
* Favorite contacts
* Contact statistics
* Shared Spaces participation
* Payment preferences
* Contact notes history
* Duplicate detection
* Contact search improvements

Future Integrations:

* Open Banking
* Shared Settlements
* AI Financial Coach
* Financial Timeline
* Notifications

---

# 7. Financial Planner (Forecasting) ✅ COMPLETED

Transform forecasting into an interactive financial planning tool.

Use:

* Historical spending
* Budgets
* Goals
* Recurring transactions
* Bills
* Subscriptions
* Loans
* Investments
* Income
* Cash Flow

Support interactive scenarios:

* Increase monthly savings
* Reduce spending
* Increase investments
* Pay extra toward loans
* Cancel subscriptions
* Delay purchases

Forecast:

* Future balances
* Cash flow
* Goal completion
* Budget overruns
* Savings growth
* Loan payoff dates
* Net worth growth

Provide:

* Scenario comparison
* Interactive charts
* Recommendations
* What-if simulations

### Additional Planned Features

* Investment forecasting
* Retirement projections
* Net worth forecasting
* Inflation adjustments
* Multiple financial scenarios
* Scenario snapshots
* Compare saved scenarios
* Forecast confidence score
* Emergency fund forecasting
* Subscription impact analysis
* Goal acceleration analysis
* Budget optimization suggestions
* Financial milestone predictions

Integrations:

* Goals
* Budgets
* Reports
* Net Worth
* Investments
* AI Financial Coach
* Dashboard Widgets

---

# 8. Financial Health Score ✅ COMPLETED

Generate an overall financial wellness score.

> **Status**: **Completed.** Dedicated domain calculation engine implemented in `lib/calculations/financial-health.ts`, cached data aggregation in `lib/queries/financial-health.ts`, dedicated `/health` page with Next.js 16 Cache Components architecture, semi-circular radial arc score gauge hero card, 5-pillar Bento grid, 6-month historical trajectory chart, interactive score impact simulator sheet, and dashboard overview widget.

Factors:

* ✅ Savings rate
* ✅ Budget adherence
* ✅ Emergency fund
* ✅ Debt ratio
* ✅ Spending stability
* ✅ Goal progress
* ✅ Cash flow
* ✅ Income consistency
* ✅ Subscription burden
* ✅ Loan utilization

Provide actionable recommendations:
* ✅ Dynamic, prioritized recommendations engine with point gain projections and direct in-app links (`/goals`, `/budgets`, `/recurring`, `/loans`, `/investments`).

### Additional Completed Features:

* ✅ 0–100 Composite Wellness Score with 4 health tiers (*Excellent*, *Good*, *Fair*, *Needs Attention*).
* ✅ Balanced 5-Pillar Model (20 pts each):
  * **Liquidity & Emergency Reserve** (reserve coverage in months, liquid cash, monthly burn rate)
  * **Savings Rate & Cash Flow** (net savings rate, monthly cash flow surplus)
  * **Debt & Liabilities** (debt-to-asset ratio, loan repayment timeliness, overdue checks)
  * **Budget & Fixed Cost Control** (budget adherence compliance, recurring subscription burden)
  * **Goals & Wealth Diversification** (active savings goals progress, multi-asset class count)
* ✅ 6-Month Historical Trajectory Chart with tier reference bands and tooltips.
* ✅ Interactive Score Impact Simulator Sheet (`HealthSimulator`) with real-time sliders (Extra Savings, Debt Paydown, Subscription Trims) calculating instant "what-if" score increases.
* ✅ Dashboard Overview Widget (`FinancialHealthWidget`) with live score, tier badge, month-over-month delta, top recommendation snippet, and quick link to `/health`.
* ✅ Sidebar navigation integration ("Health" item with `Activity` icon).
* ✅ Accessible loading skeleton (`app/(dashboard)/health/loading.tsx`).
* ✅ Safe server-to-client serialization with zero database schema migrations required.

Integrations:

* ✅ Dashboard (Overview widget)
* ✅ Reports & Analytics
* ✅ Financial Planner
* Future AI Financial Coach

---

# 9. AI Spending Insights ✅ COMPLETED

Automatically generate personalized financial insights and anomaly detection.

> **Status**: **Completed.** Pure deterministic calculation engine implemented in `lib/calculations/insights.ts`, hybrid Gemini 1.5 Flash natural language executive narrative synthesis with zero-latency deterministic template fallback, cached data aggregation in `lib/queries/insights.ts`, multi-device persistent dismissal/bookmarking in `user_insight_states` MongoDB collection via Server Actions in `lib/actions/insights.ts`, dedicated `/insights` hub with category tabs, optimistic dismiss and undo toasts, upgraded dashboard card, and sidebar navigation.

Features:

* ✅ 6 Statistical Detector Families:
  * **Category Spending Spikes** (3 completed 30-day baseline periods, safeguards for min spend and tx count)
  * **Transaction Outliers** (Z-score standard deviation detection on categories with ≥5 txs)
  * **Subscription Creep & Billing Anomalies** (duplicate charge detection within 5 days, recurring rule price hikes)
  * **Income Irregularities** (detects sudden drops/missing income vs 3-month baseline)
  * **Savings Opportunities** (budget surpluses and micro-spending frequency leakage)
  * **Cash Flow Velocity** (run-rate extrapolation vs incoming cash flow)
* ✅ Natural-Language Executive Briefing (Google Gemini 1.5 Flash with deterministic fallback when offline or unconfigured)
* ✅ Multi-device persistent dismissal, undo dismissals, and star bookmarking with compound MongoDB indexing
* ✅ Dedicated `/insights` Bento Hub (`app/(dashboard)/insights/page.tsx`) with 6 filter tabs (`All`, `Anomalies`, `Subscriptions`, `Income & Cashflow`, `Savings`, `Bookmarked`)
* ✅ Interactive 1-click action links directing users to relevant filtered views (`/transactions?categories=...`, `/recurring`, `/budgets`)
* ✅ Dashboard Overview Widget (`components/dashboard/ai-insights.tsx`) showing executive pulse and top 3 prioritized signals
* ✅ Sidebar navigation integration ("Insights" item with `Sparkles` icon)
* ✅ Accessible loading skeletons and co-located error boundaries (`loading.tsx`, `error.tsx`)
* ✅ 30 comprehensive unit tests covering all detector thresholds, currency conversions, edge cases, and Gemini fallbacks

---

# 10. Cash Flow Calendar ✅ COMPLETED

Provide a future financial calendar.

> **Status**: **Completed.** Pure deterministic calculation engine implemented in `lib/calculations/cash-flow-calendar.ts`, cached data orchestration in `lib/queries/cash-flow-calendar.ts`, one-off planned event persistence in `calendar_events` collection via server actions in `lib/actions/calendar.ts`, dedicated `/calendar` dashboard route with Next.js 16 Suspense architecture, responsive 7-column month grid, mobile-friendly agenda feed, slide-over day detail sheet, Bento KPI strip, and sidebar navigation.

Display:

* ✅ Income
* ✅ Bills
* ✅ Loan repayments
* ✅ Subscription renewals
* ✅ Goals
* ✅ Recurring transactions
* ✅ Expected balances

Allow users to understand future cash flow at a glance.

### Additional Completed Features

* ✅ Hybrid Timeline (settled past transactions + future recurring rules, bills, subscriptions, and loan repayments)
* ✅ Day-by-day forward and backward running balance projection
* ✅ Deficit warnings (`isDeficit: true`, `<AlertCircle />` badges) when projected balances drop below zero, plus low safety buffer flags
* ✅ Toggleable "Liquid Cash" vs "All Accounts" mode (deducting credit liabilities)
* ✅ Month Grid view and mobile-friendly Agenda Feed view
* ✅ Slide-over `CalendarDaySheet` for date inspection, running balance breakdown, and one-off plan management
* ✅ One-off planned events collection `calendar_events` with Server Actions (`createCalendarPlanAction`, `updateCalendarPlanAction`, `deleteCalendarPlanAction`)
* ✅ Top Bento `MetricCard` strip (Expected Inflow, Scheduled Outflow, Net Projected Flow, Lowest Projected Point / Deficit Warning)
* ✅ Accessible loading skeleton and error boundary (`loading.tsx`, `error.tsx`)
* ✅ Sidebar navigation integration (`CalendarDays` icon under Planner)
* ✅ 7 comprehensive automated unit tests covering all math, multi-currency, recurrence frequencies, and edge cases.

Integrations:

* ✅ Financial Planner
* ✅ Bills
* ✅ Subscriptions
* ✅ Loans
* ✅ Wallets & Transactions
* ✅ Dashboard Sidebar
---

# 11. Advanced Search & Universal Command Palette ✅ COMPLETED

Unified cross-entity financial search engine and intelligent query operator parser.

> **Status**: **Completed.** Pure deterministic operator parsing engine in `lib/search/parser.ts`, parallel multi-entity server query aggregator in `lib/queries/search.ts`, upgraded `⌘K` Command Palette in `components/layout/search-command.tsx`, dedicated `/search` hub in `app/(dashboard)/search/`, saved searches persistence in `saved_searches` collection, and seamless operator support in `/transactions`.

Support powerful query operators:

* ✅ `merchant:<name>` / `payee:<name>` (e.g. `merchant:amazon`)
* ✅ `category:<name>` (e.g. `category:food`, `category:"Food & Dining"`)
* ✅ `wallet:<name>` / `account:<name>` (e.g. `wallet:cash`)
* ✅ `amount>500`, `amount<1000`, `amount>=50`, `amount<=200`, `amount=100` (integer cents)
* ✅ `date:this-month`, `date:last-month`, `date:today`, `date:yesterday`, `date:this-year`, explicit `date:2026-01-01..2026-06-30`
* ✅ `currency:INR`, `currency:USD`
* ✅ `tag:vacation`, `tag:grocery`
* ✅ `person:john`, `contact:sarah`
* ✅ `loan:active`, `loan:paid`, `loan:overdue`
* ✅ `subscription:active`, `subscription:cancelled`
* ✅ `bill:overdue`, `bill:paid`, `bill:pending`
* ✅ `goal:active`, `goal:completed`
* ✅ `investment:stocks`, `investment:crypto`, `investment:etf`
* ✅ `asset:real-estate`, `asset:gold`, `asset:vehicle`
* ✅ `liability:mortgage`
* ✅ `budget:active`
* ✅ `recurring:monthly`, `recurring:weekly`
* ✅ `transaction:split`
* ✅ `status:overdue`, `status:active`, `status:flagged`, `status:review`
* ✅ Multi-operator combinations with residual free-text extraction (e.g. `Starbucks category:Food amount>50 date:this-month`)

### Additional Completed Features

* ✅ **Universal Cross-Entity Querying**: Searches Transactions, Wallets, Budgets, Goals, Subscriptions, Bills, Loans, Contacts, Investments, Assets, and Liabilities with financial scope isolation.
* ✅ **Upgraded `⌘K` Command Palette**: 150ms debounced live search, parsed active filter badges, recent search history (instant from `localStorage`), quick operator chips, and deep links.
* ✅ **Dedicated `/search` Hub**: Full-page responsive search hub (`/search`) with categorized entity tabs, result count badges, quick filter pills, and saved searches management.
* ✅ **Saved Searches**: Full persistence in `saved_searches` MongoDB collection via Server Actions (`saveSearchAction`, `deleteSavedSearchAction`, `getSavedSearchesAction`).
* ✅ **Transactions Page Integration**: Transaction search bar automatically parses query operators through `parseSearchQuery()` for seamless filtering.
* ✅ **Automated Unit Tests**: 100% test coverage for query parser, amount inequalities, relative date resolvers, and entity shortcuts.

Integrations:

* ✅ Dashboard Header (`⌘K`)
* ✅ Transactions Page (`/transactions`)
* ✅ Search Hub (`/search`)
* ✅ All Entity Detail Pages
---

# 12. Packed Bento Dashboard (Custom Dashboard Redesign) ✅ COMPLETED

Dense, high-density Bento grid dashboard integrating real-time telemetry, actionable financial workflows, focus alerts, and interactive charts.

> **Status**: **Completed.** Production-ready packed Bento grid architecture with modular widget cards, quick action execution cards, and financial telemetry:
> * ✅ **Packed Bento Grid Architecture**: Responsive 12-column grid (`app/(dashboard)/dashboard/page.tsx` & `components/dashboard/bento-grid.tsx`) with zero wasted whitespace, optimized for desktop and mobile viewports.
> * ✅ **Focus Alert Strip**: Dynamic priority alert ribbon aggregating overdue bills, imminent subscription renewals (within 7 days), loan due dates, and unread system notifications with deep links.
> * ✅ **Quick Action Cards**: 
>   - **Quick Log Card**: One-tap transaction logging with pre-filled category pills, dynamic currency prefix based on default wallet, and instant mutation feedback.
>   - **Loan Action Card**: Quick loan repayment recording with Lent/Borrowed toggle, contact selection, and ledger update.
>   - **Universal Command Center**: Compact shortcut hub with `⌘K` command palette integration, navigation jump targets, and fast search.
> * ✅ **Official shadcn/ui Charts**: Composed using native CSS variables (`--primary`, `--chart-1` through `--chart-5`), Recharts wrappers, custom tooltips, and responsive containers (Income vs Expense breakdown, Cash Flow trends, and Category spending).
> * ✅ **Telemetry & Insights**: Live net worth calculation, active budget burn rate gauges, upcoming bill timeline, and AI financial recommendations.

Widgets:

* Accounts
* Budgets
* Goals
* Net Worth
* Spending
* Categories
* Cash Flow
* Loans
* Investments
* Bills
* Subscriptions
* Calendar
* Forecast
* Recent Transactions
* AI Insights
* Financial Health
* Upcoming Due Dates

Support:

* Drag & Drop
* Resize
* Hide
* Multiple layouts

### Additional Planned Widgets

* Financial Timeline
* Monthly Review
* Spending Heatmap
* Savings Rate
* Income Breakdown
* Expense Breakdown
* Investment Performance
* Portfolio Allocation
* Goal Progress
* Budget Health
* Cash Flow Forecast
* Upcoming Renewals
* Debt Overview
* Financial Score
* AI Coach Summary
* Recent Activity Feed
* Watchlists
* Quick Actions

Additional Features

* Widget presets
* Personal layouts
* Workspace profiles
* Mobile layouts
* Desktop layouts
* Widget pinning
* Widget favorites
* Full dashboard export

---

# 13. Budget Templates ✅ COMPLETED

Provide ready-made budgeting templates and personalized cash-flow-driven allocations.

> **Status**: **Completed.** Domain logic implemented for system presets and recommendations, MongoDB persistence for custom templates in `budget_templates` collection with indexed scope, server actions in `lib/actions/budget-templates.ts`, parallel data fetching in `app/(dashboard)/budgets/page.tsx`, and responsive in-page modal experience with 1-click apply wizard (`components/budgets/budget-templates-dialog.tsx`, `components/budgets/apply-template-step.tsx`).

Curated System Frameworks:

* ✅ **50/30/20 Balanced Rule** (50% Needs, 30% Wants, 20% Savings & Debt)
* ✅ **Zero-Based Budget** (Every single currency unit assigned an intentional job)
* ✅ **Freelancer / Variable Income** (40% Baseline Needs, 25% Tax & Business, 20% Buffer, 15% Lifestyle)
* ✅ **Aggressive Debt Payoff** (Snowball / Avalanche prioritization directing 35% to debt acceleration)
* ✅ **Family / Household** (Mortgage, Groceries, Childcare, Education, Healthcare, and Family Emergencies)
* ✅ **College Student / Young Adult** (Rent/Dorm, Groceries, Textbooks, Campus Social, Transit)
* ✅ **Digital Nomad / Remote Traveler** (Accommodations, Flights, Local Dining, Co-working, Nomad Insurance)
* ✅ **Minimalist / FI-RE Focused** (Modest Living with 50% High-Velocity Investments)

### Additional Completed Features

* ✅ **Smart Cash Flow Recommendation Engine**: Analyzes past 90 days of transactions, detects income volatility and high debt burdens, and automatically recommends the best matching template with pre-filled monthly sizing.
* ✅ **Interactive In-Page Apply Wizard**: Sizing input with currency symbol, strategy selector ("Smart Merge" to preserve non-conflicting budgets vs. "Fresh Start" for clean slates), live category mapping, and automatic provision of missing categories.
* ✅ **Dynamic Allocation Balancing Meter**: Visual progress bar showing total allocated percentage with live adjustment controls.
* ✅ **Custom Templates & Duplication**: "Save Current Budget as Template" action capturing active category budgets and ratios into reusable custom templates.
* ✅ **Zero Context Switching**: Embedded directly into the `/budgets` page via an interactive modal dialog matching Dime's uniform page standards.
* ✅ **Empty State On-Ramp**: Prominent "Choose a Template" CTA when no active budgets exist.
* ✅ **Notification Center Inbox Integration**: Automatically creates an inbox notification upon template application with deep links back to `/budgets`.
* ✅ **Comprehensive Automated Tests**: 100% test coverage across system presets, schema validations, and allocation currency math.

---

# 14. Spending Heatmaps ✅ COMPLETED

Interactive GitHub-style activity heatmaps and financial habit telemetry.

> **Status**: **Completed.** Full SVG contribution graph primitive adapted from Kibo UI / Chánh Đại (`components/reports/contribution-graph.tsx`), pure calculation and quantile partitioning engine (`lib/calculations/heatmaps.ts`), cached multi-currency query layer (`lib/queries/heatmaps.ts`), URL-driven tab integration in `/reports` (`/reports?tab=heatmap`), interactive anchored day inspection popovers (`HeatmapDayPopover`), and 90-day mini-rhythm widget on the Packed Bento Dashboard.

Support:

* ✅ Daily spending intensity (quantile-scaled levels 0–4)
* ✅ Income inflows intensity
* ✅ Net cash flow (positive / negative tracking)
* ✅ Transaction frequency volume
* ✅ Interactive day inspection anchored Popovers with transaction previews
* ✅ Direct deep linking to `/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD`
* ✅ Habit Telemetry (Current zero-spend streak, longest streak, daily average spend, peak spend day)
* ✅ Timeframe switcher (Trailing 12 Months, 2026, 2025, etc.)
* ✅ Category and Wallet filtering
* ✅ Packed Bento Dashboard 90-day mini-rhythm card (`SpendingHeatmapWidget`)
* ✅ 100% automated test coverage on quantile partitioning, calendar grouping, and streak calculations.

Integrations:

* ✅ Reports (`/reports?tab=heatmap`)
* ✅ Dashboard Overview (Row 3b mini-rhythm card)
* ✅ Transactions Ledger (date-filtered drilldown)
* ✅ Command Palette & Deep Links

---

# 15. Financial Timeline ✅ COMPLETED

Chronological financial activity feed and milestone telemetry.

> **Status**: **Completed.** Pure deterministic calculation and grouping engine implemented in `lib/calculations/timeline.ts`, cached multi-entity data aggregation in `lib/queries/timeline.ts`, types in `types/index.ts`, validation schemas in `lib/validations/timeline.schema.ts`, dedicated `/timeline` page with Next.js 16 Suspense architecture, standard Dime page header, `MetricCard` KPI strip, shadcn `Tabs` category filter navigation, shadcn `Item` event cards, vertical spine activity feed, URL-synchronized search & date range picker, CSV/JSON export, sidebar navigation, and `⌘K` command palette integration. Dashboard unified recent transactions stream combines standard and investment transactions seamlessly into full-width Bento layout.

Include:

* ✅ Salary received
* ✅ Bills paid
* ✅ Goal achieved
* ✅ Loan created
* ✅ Loan repaid
* ✅ Investments
* ✅ Subscription renewals
* ✅ Large purchases
* ✅ Budget milestones
* ✅ Shared expense settlements

Support filtering by event type.

### Additional Planned Events

* Asset created
* Asset valuation updated
* Liability created
* Net Worth milestones
* Automation executed
* Budget exceeded
* Budget reset
* Goal contribution
* Goal completed
* Investment purchased
* Investment sold
* Dividend received
* Financial Health improvements
* AI recommendations
* Forecast milestones
* Bank synchronization events
* Document uploads

Additional Features

* Timeline search
* Timeline bookmarks
* Event reactions
* Export timeline
* Timeline summaries
* AI-generated monthly recap

Integrations:

* Dashboard
* Reports
* Notifications
* AI Coach
* Search

Architecture & Layering:
* Calculations: `lib/calculations/timeline.ts` (pure event synthesis, milestone detection, date bracket grouping)
* Queries: `lib/queries/timeline.ts` (cached cross-collection fetching with `React.cache`)
* Types: `types/index.ts`
* Route: `app/(dashboard)/timeline/page.tsx`, `loading.tsx`, `error.tsx`
* Presentation: `components/timeline/`
* Tests: `lib/calculations/__tests__/timeline.test.ts`

---

# 16. AI Financial Coach ✅ COMPLETED

Intelligent, deterministic personal financial coaching with 100% on-demand AI reasoning.

Features & Core Capabilities:
* **Zero AI on Page Load**: Immediate sub-5ms pure TypeScript execution calculating emergency fund runway, debt payoff plans, goal acceleration gaps, subscription trimming, and budget tuning without third-party LLM latency.
* **On-Demand AI Reasoning**: Gemini AI analysis triggered strictly when requested by the user ("Refresh with AI Analysis" or conversational chat inquiries).
* **Emergency Fund Runway Engine**: Tracks liquid reserves (bank, cash, savings) against 3-month and 6-month essential spending baselines.
* **Debt Payoff Engine (Snowball vs. Avalanche)**: Compares smallest-balance-first vs. highest-interest-first debt repayment trajectories, total interest savings, and debt-free dates.
* **Goal Acceleration Matrix**: Computes monthly acceleration delta gaps to pull milestone completion dates forward.
* **Interactive What-If Scenario Simulator**: Real-time client-side parameter tweaking (monthly discretionary cuts, debt acceleration payments, goal booster additions) recalculating runway, debt-free timelines, and total savings dynamically.
* **Official shadcn Chat Interface**: Built using official shadcn messaging primitives (`MessageScroller`, `Message`, `Bubble`, `Marker`, `Attachment`, `Questionnaire`) with prompt suggestions, user feedback markers, context-aware financial memory, and chat history management.
* **UI Design Uniformity**: Matches existing dashboard pages (`health`, `insights`, `timeline`, `net-worth`, `dashboard`) using standard `MetricCard`, `Sheet`, `HoverCard`, and standard `Skeleton` loading states.
* **Strict Safety & Regulatory Disclaimers**: Prominently marked as educational/informational analysis, never financial or investment advice.

Architecture:
* Pure Calculations: `lib/calculations/coach.ts` (100% deterministic functions: `analyzeEmergencyFund`, `analyzeDebtPayoff`, `analyzeGoalAcceleration`, `analyzeSubscriptionTrimming`, `analyzeBudgetTuning`, `synthesizeCoachStrategies`, `generateDeterministicBriefing`, `generateOnDemandAiBriefing`, `generateCoachChatAnswer`)
* Unit Tests: `lib/calculations/__tests__/coach.test.ts` (10 node test suites covering calculations and fallbacks)
* Validation Schemas: `lib/validations/coach.schema.ts` (`askCoachSchema`, `simulateCoachScenarioSchema`)
* Cached Query Layer: `lib/queries/coach.ts` (`getCoachOverviewData` wrapped in `React.cache`)
* Server Actions: `lib/actions/coach.ts` (`askCoachAction`, `clearCoachChatAction`, `refreshAiBriefingAction`)
* Database Collections: `coachMessagesCollection` in `lib/db/collections.ts`
* Type Definitions: `types/index.ts` (`CoachStrategy`, `EmergencyFundAnalysis`, `DebtPayoffComparison`, `GoalAccelerationItem`, `CoachMessage`, `SerializedCoachMessage`, `CoachSummaryBrief`, `CoachOverviewData`)
* Route: `app/(dashboard)/coach/page.tsx`, `loading.tsx`, `error.tsx`
* UI Components: `components/coach/` (`coach-header`, `coach-metrics-row`, `coach-overview-card`, `coach-strategy-card`, `coach-playbooks-view`, `coach-simulator-sheet`, `coach-chat-sheet`, `coach-client`)
* Dashboard Bento: `components/dashboard/coach-widget.tsx` (integrated into `dashboard-bento.tsx` Row 5)
* Navigation: Integrated into `dashboard-sidebar.tsx` and `search-command.tsx`
---

# 17. Open Banking & Account Sync (Future)

Support secure bank integrations where available.

Features:

* Automatic transaction imports
* Account synchronization
* Balance updates
* Duplicate detection
* Manual review
* Institution management

Designed to work as an optional integration layer.

### Additional Planned Features

Supported Accounts

* Checking Accounts
* Savings Accounts
* Credit Cards
* Investment Accounts
* Loan Accounts
* Retirement Accounts
* Business Accounts

Synchronization

* Automatic balance synchronization
* Automatic transaction imports
* Historical transaction imports
* Incremental sync
* Manual refresh
* Background synchronization
* Duplicate prevention
* Conflict resolution

Institution Management

* Multiple institutions
* Multiple accounts
* Account grouping
* Connection health monitoring
* Reauthentication flow
* Institution status

Security

* OAuth support
* Read-only access
* Encrypted credentials
* Permission management
* Institution authorization history

Future

* Investment synchronization
* Automatic recurring detection
* Subscription detection
* Bill detection
* Merchant enrichment
* Categorization improvements
* Exchange rate synchronization

Integrations

* Wallets
* Transactions
* Investments
* Net Worth
* Reports
* Dashboard
* AI Financial Coach
* Automation Rules

---

# 18. Financial Documents Vault (Future — Requires Cloud Storage)

> **Status**: **Deferred to Future Phase.** Dime operates entirely within free-tier infrastructure (MongoDB Atlas M0 with 512MB shared storage and Vercel serverless with 4.5MB request payload limits). Real-world document storage (PDF tax filings, scanned insurance policies, property deeds, warranty papers) requires dedicated S3/Cloudflare R2 object storage to prevent exhausting database storage caps. This feature is earmarked for when external cloud object storage is provisioned.

Securely store financial documents.

Examples:

* Insurance
* Tax documents
* Receipts
* Loan agreements
* Investment statements
* Property documents

Features:

* Secure uploads
* Categories
* OCR search
* Expiry reminders
* Document timeline

### Additional Planned Features

Supported Documents

* Identity Documents
* Passport
* Driver's License
* Insurance Policies
* Property Documents
* Bank Statements
* Brokerage Statements
* Tax Returns
* Salary Slips
* Warranty Documents
* Invoices
* Medical Bills

Organization

* Tags
* Collections
* Folder hierarchy
* Linked entities
* Smart search
* OCR indexing

Automation

* Expiry reminders
* Renewal reminders
* AI document classification
* Duplicate detection
* Version history

Security

* Encryption
* Access logs
* Secure sharing
* Watermarking
* Permission controls

Integrations

* Loans
* Investments
* Assets
* Bills
* Reports
* AI Coach

---

# 19. Financial Inbox & Notifications Center ✅ COMPLETED

Centralize every financial notification into a unified inbox.

Purpose

Provide a single place where users can review every important financial event instead of relying solely on push notifications.

Notification Types

* Upcoming bills
* Overdue bills
* Subscription renewals
* Budget warnings
* Goal milestones
* Loan repayments
* Investment alerts
* Asset valuation reminders
* Net Worth milestones
* Automation Rule executions
* Shared Space activity
* Financial Planner alerts
* AI recommendations

### Additional Completed Features

* ✅ Notifications inbox page (`/notifications`)
* ✅ Notification bell with unread count in header
* ✅ Read / unread state management
* ✅ Archive support
* ✅ Mark all as read
* ✅ Bulk dismiss
* ✅ Notification type system
* ✅ Deep link support (`link` field)
* ✅ MongoDB collection + indexes
* ✅ Server actions for notification management
* ✅ Real-time badge count in sidebar

### Planned Enhancements

* Snooze
* Pin
* Filter by type
* Search within inbox
* Notification preferences per type

Integrations

* Notifications
* Automation Rules
* Bills
* Goals
* Investments
* Net Worth
* Reports
* Dashboard
* AI Coach

---

# 20. Monthly Financial Review (Under Reports) ✅ COMPLETED

> **Status**: **Completed.** Fully integrated into the **Reports & Analytics** hub (`/reports?tab=review`) to eliminate navigation bloat and prevent adding an 18th top-level item to the sidebar. Includes month-by-month selector, deterministic MoM calculation engine, on-demand Gemini AI retrospective executive synthesis, Kibo UI announcement banner on the Packed Bento Dashboard (1st–14th of each month with localStorage dismissal), print-ready PDF view, and smart Month/Year `⌘K` command palette jump targets.

Generate an automatic monthly financial review.

Purpose

Help users understand how their finances changed over the previous month.

Include

* Income summary
* Expense summary
* Savings rate
* Budget performance
* Goal progress
* Net Worth changes
* Loan progress
* Investment performance
* Largest expenses
* Largest income
* Spending trends
* Subscription changes
* Bill summary

Provide

* AI summary
* Financial highlights
* Financial concerns
* Recommendations
* Next month's outlook

Future

* Quarterly review
* Annual review
* Shareable reports
* Printable reports
* PDF export

Integrations

* Reports
* Dashboard
* AI Coach
* Financial Planner

---

# 21. Product Polish & User Experience ✅ COMPLETED

Focus on refining the overall user experience and making Dime feel like a premium, power-user personal finance operating system.

### Completed Features

* ✅ **Bulk Transaction Actions**: Multi-select transactions, batch category reassignment, batch wallet transfer with real-time multi-currency exchange rate conversion, batch tag additions, and batch deletion with atomic multi-wallet balance reversions (`bulkWrite`). Contextual floating dock with clear selection and destructive `AlertDialog` confirmations.
* ✅ **Keyboard-First Transactions Table**: Full table navigation without touching the mouse (`j`/`k` row cursor, `x`/`Space` selection toggle, `Delete`/`Backspace` batch delete prompt, `e` row edit, `Esc` selection clear). Visible high-contrast focus rings (`ring-2 ring-primary/60 bg-primary/10`) and full typing guards (`input`, `textarea`, `select`, `contenteditable`).
* ✅ **Global Keyboard Shortcuts Engine**: Linear/Superhuman style chord architecture (`lib/shortcuts-config.ts`).
  * `g` navigation chords (`g d` dashboard, `g t` transactions, `g b` budgets, `g r` reports, `g c` calendar, `g i` investments, `g n` net worth, `g w` wallets, `g l` loans, `g s` subscriptions, `g p` planner, `g e` review, `g m` timeline, `g u` rules, `g x` settings).
  * `?` Cheat-Sheet Dialog Modal with categorized shortcuts and keyboard chip displays.
  * `c` Global Quick Transaction modal opening from anywhere in the app with auto-fetched wallets and categories.
  * Discoverable keyboard shortcut trigger button in `DashboardHeader` and shortcut command jump in `SearchCommand`.
* ✅ **Saved Transaction Views**: Built-in default quick view tabs (*All*, *This Month*, *Expenses*, *Income*, *High Value*) plus customizable saved filter views with custom names persisted in `localStorage` and synchronized with URL `searchParams`.
* ✅ **Action-Oriented Empty States**: Distinct states for genuinely empty transaction history (with *Add Transaction* and *Import CSV* action triggers) vs zero-result filtered states (with *Reset Filters* CTA).
* ✅ **Pure Calculation & Balance Integrity Engine**: Side-effect free math in `lib/calculations/bulk-transactions.ts` with 100% test coverage validating balance calculations, currency conversions, and tag union deduplication.

---

# 22. Investment Portfolio Enhancements (Future)

Extend the Investment Tracker into a full portfolio management platform.

Features

* Portfolio performance
* Portfolio timeline
* Sector allocation
* Country allocation
* Asset class allocation
* Dividend history
* Dividend forecasting
* Cost basis tracking
* Tax lot management
* Capital gains reporting
* Investment goals
* Portfolio benchmarking
* Risk analysis
* Diversification score
* Performance attribution

Future

* Broker synchronization
* Live pricing
* Options
* ETFs
* Bonds
* Alternative investments
* Retirement planning integration

Integrations

* Net Worth
* Reports
* Dashboard
* AI Coach
* Financial Planner
* Financial Health Score

---

# Future Considerations

Potential future features after the core roadmap is complete.

* Family Financial Management
* Business Finance Mode
* Invoice Management
* Tax Planning
* Estate Planning
* Retirement Planning
* Insurance Tracking
* Credit Score Tracking
* Credit Report Monitoring
* Financial Marketplace
* Public API
* Plugin System
* Developer SDK
* Webhooks
* Apple Shortcuts
* Wearable Apps
* Desktop Applications

---

# General Requirements

* Follow the existing architecture.
* Reuse existing server actions and utilities.
* Extend existing models instead of duplicating functionality.
* Keep database models normalized.
* Design for long-term scalability.
* Mobile-first responsive UI.
* Use shadcn/ui components.
* Support dark mode.
* Accessible UI.
* Loading skeletons.
* Beautiful empty states.
* Type-safe implementation.
* Proper permissions.
* Integrate with Notifications.
* Integrate with Automation Rules.
* Integrate with Search.
* Integrate with Analytics.
* Integrate with Reports.
* Integrate with Dashboard Widgets.
* Integrate with Shared Spaces where applicable.
* Integrate with Financial Timeline.
* Design every feature so it can be consumed by future AI features and the Financial Planner without requiring schema redesign.

## Architectural Principles

Every new feature should:

* Reuse existing infrastructure where possible.
* Be modular and independently maintainable.
* Prefer extending existing domains over introducing duplicate concepts.
* Keep calculations separate from UI.
* Keep business logic separate from presentation.
* Be designed with future AI integrations in mind.
* Be compatible with Shared Spaces.
* Be compatible with Dashboard Widgets.
* Be compatible with Reports & Analytics.
* Be compatible with Notifications.
* Be compatible with Financial Timeline.
* Be API-first where practical.
* Support localization and multi-currency.
* Remain scalable for future Open Banking and Investment integrations.

---

## 🏛️ Codebase Folder Structure & Layering Rules

Dime strictly adheres to a **horizontal layered architecture**. Never create feature or module folders directly inside `lib/`.

| Layer / Directory | Permitted Contents | Rules & Conventions |
| :--- | :--- | :--- |
| `lib/actions/` | Next.js Server Actions (`"use server"`) | Auth & scope guards, Zod validation, mutations, `revalidatePath`, `updateTag`. |
| `lib/calculations/` | Pure business logic, math, transforms, algorithms | 100% deterministic & side-effect free. Never import React, DOM, or DB clients. |
| `lib/calculations/__tests__/` | Unit test suites | Node native test runner (`node:test`, `node:assert/strict`). |
| `lib/queries/` | Read-only data fetching & aggregation | Wrapped in `React.cache()`. Queries MongoDB collections with scope filters. |
| `lib/validators/` | Zod validation schemas | Shared schemas for form inputs, URL query params, and Server Action payloads. |
| `lib/db/` | MongoDB client & collection exports | `client.ts`, `collections.ts`. |
| `types/` | TypeScript types & interfaces | Data models, DTOs, view models, and domain types. |
| `components/<feature>/` | UI presentation components | Composed using shadcn/ui primitives. Small, focused, accessible. |
| `app/(dashboard)/<route>/` | Next.js 16 App Router pages | Server Components default, `await searchParams`, co-located `loading.tsx` & `error.tsx`. |

### 🚫 Strict Anti-Patterns

1. **NO module/feature folders inside `lib/`**:
   * ❌ `lib/timeline/`, `lib/investments/`, `lib/loans/`
   * ✅ Split across layers: `lib/calculations/timeline.ts`, `lib/queries/timeline.ts`, `lib/actions/timeline.ts`, `types/index.ts`.
   *(Note: Existing legacy folders like `lib/budget-templates/`, `lib/shared-expenses/`, and `lib/search/` are earmarked for progressive migration into this standard).*
2. **NO business calculations inside Server Components or Client Components**:
   * All business math and data aggregation must live in `lib/calculations/` to remain easily testable.
3. **NO raw DB access inside Client Components or Actions**:
   * Read queries belong in `lib/queries/`. Mutations belong in `lib/actions/`.
4. **NO `middleware.ts`**:
   * Next.js 16 route protection lives in `proxy.ts` only.