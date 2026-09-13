# Cash Flow Calendar Design Specification

**Feature ID:** 10 — Cash Flow Calendar  
**Date:** 2026-09-13  
**Status:** Approved for Implementation  
**Target Release:** Next.js 16 (App Router), React 19, TypeScript 5, MongoDB, Tailwind CSS v4, shadcn/ui  

---

## 1. Executive Summary & Goals

The **Cash Flow Calendar** provides a visual, interactive financial timeline enabling users to understand their day-by-day cash balance trajectory, anticipated inflows, and upcoming commitments at a glance.

By synthesizing existing Dime infrastructure—**Wallets**, **Settled Transactions**, **Active Recurring Rules**, **Bills**, **Subscriptions**, and **Loan Repayments**—with a lightweight new **One-off Planned Events** capability, the calendar eliminates overdraft surprises, surfaces cash flow deficits before they happen, and empowers proactive financial planning.

### Core Objectives
1. **Hybrid Timeline View**: Seamlessly merge past actual transactions and historical ending balances with forward-looking scheduled commitments and projected daily balances.
2. **Running Daily Balance Projection**: Day-by-day calculation of projected closing balances from today's live wallet balances, with visual deficit warnings whenever balances drop below zero or dip below a safe buffer.
3. **Liquidity vs. Net Cash Modes**: Instant toggle between *Liquid Cash* (Checking, Savings, Cash) and *All Wallets* (including credit liabilities).
4. **Actionable Day Inspector**: Interactive slide-over sheet allowing users to mark bills/recurring commitments as paid, convert planned events into settled transactions, and log one-off future expenses.
5. **Dime Design System Uniformity**: Strict visual coherence with existing feature pages (`/insights`, `/health`, `/planner`, `/recurring`) using shared primitives (`MetricCard`, squircle headers, pill-tab controls, and shadcn dialogs/sheets).

---

## 2. User Personas & Key Workflows

### Primary User Stories
* **Overdraft Prevention**: *"As a user living with variable paychecks and fixed bills, I want to see exactly which days my checking account dips close to or below zero so I can adjust payment timing or transfer funds."*
* **Commitment Tracking**: *"As a subscriber to multiple SaaS and household services, I want to see every renewal and bill due date plotted on a monthly calendar with direct 1-click 'Mark Paid' actions."*
* **Scenario & Purchase Planning**: *"As someone planning a major purchase or trip, I want to pencil in a one-off planned expense on a specific date to immediately see its impact on my projected end-of-month cash balance."*
* **Historical Review**: *"As someone reviewing last week's spending, I want to see actual settled transactions alongside what was scheduled so I can verify nothing was missed."*

---

## 3. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Cash Flow Calendar Flow                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [ Historical Data (Past) ]                    [ Projected Data (Future) ]
  • Settled Transactions (<= Today)              • Active Recurring Rules
  • Historical Wallet Balance Math               • Unpaid/Upcoming Bill Instances
                                                 • Scheduled Loan Repayments
                                                 • One-Off Planned Events (DB)
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                  [ lib/queries/cash-flow-calendar.ts ]
       Parallel fetch via Promise.all + getFinancialScope() + Currency Rates
                                       │
                                       ▼
                [ lib/calculations/cash-flow-calendar.ts ]
                 1. Event Occurrence Mapping across 35-42 days
                 2. Backward balance reconstruction (Past)
                 3. Forward balance trajectory: Balance_d = Balance_{d-1} + Net_d
                 4. Deficit and Low-Buffer Detection (Balance < 0)
                 5. Month Aggregate KPIs (Inflow, Outflow, Net, Lowest Balance)
                                       │
                                       ▼
                      [ app/(dashboard)/calendar/page.tsx ]
                         Wrapped in Suspense + loading.tsx
                                       │
                                       ▼
                      [ components/calendar/calendar-client.tsx ]
       ┌───────────────────────┬───────────────────────┬────────────────────────┐
       ▼                       ▼                       ▼                        ▼
[ Header & Controls ]   [ MetricCard Strip ]   [ 7-Col Month Grid ]    [ Day Details Sheet ]
- Month navigation       - Expected Inflow      - Daily closing pill    - Event breakdowns
- Liquid / All Toggle    - Scheduled Outflow    - Event chips (Top 3)   - 1-click Mark Paid
- Month / Agenda Tabs    - Net Cash Flow        - Deficit alert badge   - Add Plan Event
- + Add Plan button      - Lowest Balance Dip   - Day click trigger     - Edit/Delete Plan
```

---

## 4. Data Models & Database Schema

### 4.1 Domain Types (`types/index.ts`)

```ts
// ── Cash Flow Calendar Domain Types ──

export type CalendarEventType = 
  | "transaction"    // Past settled transaction
  | "recurring"      // Active recurring rule projection
  | "bill"           // Bill instance (unpaid or paid)
  | "subscription"   // Recurring subscription renewal
  | "loan"           // Scheduled loan installment (lent or borrowed)
  | "plan"           // Custom one-off planned item (from calendar_events)

export type CalendarEventStatus = "settled" | "upcoming" | "overdue" | "planned"

export interface CalendarEventItem {
  id: string                     // Unique key (e.g. "tx_...", "rec_ruleId_YYYY-MM-DD", "bill_...", "plan_...")
  date: string                   // YYYY-MM-DD
  title: string
  amount: number                 // Amount in original currency cents (always positive)
  currency: string
  convertedAmount: number        // Normalized to user's display currency cents
  type: CalendarEventType
  flow: "inflow" | "outflow"
  status: CalendarEventStatus
  category?: {
    id: string
    name: string
    icon?: string
    color?: string
  }
  walletId?: string
  walletName?: string
  sourceId?: string              // Underlying Mongo ID for navigation or mutation
  notes?: string
}

export interface CalendarDaySummary {
  date: string                   // YYYY-MM-DD
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  closingBalance: number         // Projected end-of-day balance in target currency cents
  totalInflow: number            // Target currency cents
  totalOutflow: number           // Target currency cents
  netChange: number              // totalInflow - totalOutflow
  events: CalendarEventItem[]
  isDeficit: boolean             // closingBalance < 0
  isLowBuffer: boolean           // closingBalance < safetyBuffer
}

export interface CashFlowMonthOverview {
  month: string                  // YYYY-MM
  targetCurrency: string
  startingBalance: number        // Opening balance on day 1 of month
  projectedEndingBalance: number // Closing balance on last day of month
  totalInflow: number            // Sum of all month inflows
  totalOutflow: number           // Sum of all month outflows
  netCashFlow: number            // totalInflow - totalOutflow
  lowestBalance: number          // Minimum projected balance in month
  lowestBalanceDate: string      // Date of minimum balance
  deficitDaysCount: number       // Count of days where closingBalance < 0
  days: CalendarDaySummary[]     // Complete calendar cells (35 or 42 days)
}

export interface CalendarPlanEvent {
  _id: ObjectId
  userId: string
  organizationId?: string | null
  ownerUserId?: string
  title: string
  amount: number                 // in cents
  currency: string
  date: Date                     // Scheduled execution date
  flow: "inflow" | "outflow"
  walletId?: string
  categoryId?: string
  notes?: string
  isCompleted: boolean           // Whether converted / fulfilled
  createdAt: Date
  updatedAt: Date
}

export interface SerializedCalendarPlanEvent extends Omit<CalendarPlanEvent, "_id" | "date" | "createdAt" | "updatedAt"> {
  _id: string
  date: string
  createdAt: string
  updatedAt: string
}
```

### 4.2 MongoDB Collection (`lib/db/collections.ts`)
* Export: `export const calendarEventsCollection = db.collection<CalendarPlanEvent>("calendar_events")`
* Compound Indexes:
  * `{ userId: 1, date: 1 }`
  * `{ organizationId: 1, date: 1 }`

---

## 5. Pure Calculation Engine Specifications (`lib/calculations/cash-flow-calendar.ts`)

A 100% deterministic, side-effect-free calculation module:

### Functions:
1. `createCurrencyConverter(targetCurrency, exchangeRates)`:
   * Reuses standard Dime conversion logic to convert cents from any currency to the target currency.
2. `generateCalendarGridDays(year, month, startOfWeek)`:
   * Generates a complete 35-day or 42-day array of `CalendarDaySummary` covering all weeks required to display the target month without date clipping.
3. `projectRecurringOccurrences(rule, windowStart, windowEnd)`:
   * Generates occurrences for daily, weekly, bi-weekly, monthly, and yearly recurring rules within the visible window.
4. `calculateCashFlowCalendar(inputs)`:
   * **Inputs**:
     * `targetMonth`: `string` (`YYYY-MM`)
     * `wallets`: `Wallet[]`
     * `transactions`: `Transaction[]` (settled transactions up to today)
     * `recurringRules`: `RecurringRule[]` (active rules)
     * `bills`: `BillInstance[]`
     * `loans`: `Loan[]` & `repayments: LoanRepayment[]`
     * `plans`: `CalendarPlanEvent[]`
     * `categories`: `Category[]`
     * `targetCurrency`: `string`
     * `exchangeRates`: `Record<string, number>`
     * `mode`: `"liquid" | "all"`
     * `safetyBufferCents`: `number` (defaults to 0 or user preference)
   * **Outputs**: `CashFlowMonthOverview`.
   * **Algorithm**:
     1. Compute `baselineCash`:
        * In `"liquid"` mode: sum active wallets with `type === "cash" || type === "bank" || type === "savings"`.
        * In `"all"` mode: sum all active wallets (credit cards counted as negative balance liabilities).
     2. Populate day events by matching dates:
        * Past days: settled transactions.
        * Today & Future days: projected recurring occurrences, unpaid bills, loan payments, active one-off plans.
     3. Backward Trajectory (days before today):
        * Calculate day balance backwards: $\text{Balance}_{d-1} = \text{Balance}_{d} - \text{NetChange}_{d}$.
     4. Forward Trajectory (today and future):
        * $\text{Balance}_{d} = \text{Balance}_{d-1} + \text{NetChange}_{d}$.
     5. Derive KPIs (`totalInflow`, `totalOutflow`, `netCashFlow`, `lowestBalance`, `deficitDaysCount`).

---

## 6. Query Layer Specifications (`lib/queries/cash-flow-calendar.ts`)

* Wrapped in `React.cache()` for request deduplication.
* Uses `getFinancialScope()` and `getScopeFilter()` to guarantee strict multi-tenant isolation (Personal vs. Organization / Space).
* Executes all underlying collection reads in parallel using `Promise.all`:
  * `walletsCollection.find(...)`
  * `transactionsCollection.find({ date: { $gte: windowStart, $lte: today } })`
  * `recurringRulesCollection.find({ isActive: true })`
  * `billInstancesCollection.find({ dueDate: { $gte: windowStart, $lte: windowEnd } })`
  * `loansCollection.find(...)`
  * `calendarEventsCollection.find({ date: { $gte: windowStart, $lte: windowEnd } })`
  * `getExchangeRates(targetCurrency)`
  * `getPreferences(userId)`
* Calls `calculateCashFlowCalendar` and returns serialized, client-safe `CashFlowMonthOverview`.

---

## 7. Server Actions & Validations

### 7.1 Validation Schema (`lib/validations/calendar.schema.ts`)
```ts
import { z } from "zod"

export const createCalendarPlanSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  amount: z.number().int().positive("Amount must be greater than zero"),
  currency: z.string().length(3).default("USD"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  flow: z.enum(["inflow", "outflow"]),
  walletId: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const updateCalendarPlanSchema = createCalendarPlanSchema.partial().extend({
  id: z.string().min(1),
  isCompleted: z.boolean().optional(),
})
```

### 7.2 Server Actions (`lib/actions/calendar.ts`)
* `createCalendarPlanAction(data)`: Authenticates user, validates with Zod, inserts into `calendar_events`, calls `revalidatePath("/calendar")`.
* `updateCalendarPlanAction(data)`: Validates ownership/scope, updates document, revalidates path.
* `deleteCalendarPlanAction(planId)`: Validates ownership, deletes document, revalidates path.
* `toggleCalendarPlanCompletedAction(planId, isCompleted)`: Toggles completion flag, optionally converting to settled transaction if requested.

---

## 8. UI Architecture & Components

### 8.1 Component Hierarchy
```
app/(dashboard)/calendar/
├── page.tsx                    (Server Component, auth-guarded, Suspense)
├── loading.tsx                 (Shimmer skeleton: header + 4 metric cards + 7-col grid)
└── error.tsx                   (Error boundary with 1-click retry)

components/calendar/
├── calendar-client.tsx         (Client controller managing active month, viewMode, walletMode)
├── calendar-header.tsx         (Month arrows, Today button, Liquid/All toggle, Agenda toggle, +Add Plan)
├── calendar-metrics-row.tsx    (4 MetricCard instances matching /insights)
├── calendar-month-grid.tsx     (7-column CSS grid, date cells, daily closing pill, event chips)
├── calendar-agenda-list.tsx    (Mobile-friendly chronological list grouped by date)
├── calendar-day-sheet.tsx      (Slide-over Sheet for inspecting selected date & events)
└── plan-event-dialog.tsx       (Accessible Dialog for adding/editing one-off planned events)
```

### 8.2 Uniform Design Patterns
* **Metric Cards**:
  * Inflows: Green accent (`#10b981`)
  * Outflows: Rose accent (`#ef4444`)
  * Net Flow: Violet accent (`#8b5cf6`)
  * Lowest Point: Amber (`#f59e0b`) or Red (`#ef4444`) when negative with a glowing `AlertTriangle` icon.
* **Month Grid Cells**:
  * Rounded `rounded-xl`, subtle border `border-border/40`.
  * Date indicator in top-left; closing balance pill in top-right.
  * Today cell highlighted with `ring-2 ring-primary/40 bg-primary/[0.02]`.
  * Event chips: Pill-style with category/source icon, formatted amount, truncated title.
  * Overflow: `+N more` chip if events exceed 3 on desktop.
* **Sidebar Integration**:
  * Add entry to `NAV_ITEMS` in `components/layout/dashboard-sidebar.tsx`:
    `{ title: "Calendar", href: "/calendar", icon: CalendarDays }` placed alongside Planner and Recurring.

---

## 9. Edge Cases & Resilience

1. **Leap Years & Month Offsets**: Handled safely via `date-fns` month manipulation functions.
2. **Missing Exchange Rates**: Fallback to 1.0 multiplier with safe non-crashing division.
3. **Floating Point Precision**: All monetary values stored and calculated strictly in integer cents/paise.
4. **Deleted References**: If a wallet, category, or contact associated with an event is deleted, the event renders with a graceful fallback title (`"Uncategorized"`, `"General Wallet"`).
5. **No Data / Cold Start**: Informative empty state card with quick actions to configure recurring income or create a planned event.

---

## 10. Verification & Test Plan

### 10.1 Automated Unit Tests (`lib/calculations/__tests__/cash-flow-calendar.test.ts`)
* `test("projects daily running balances accurately across a 30-day month")`
* `test("reconstructs historical balances backward from today's baseline")`
* `test("correctly flags deficit days when projected balance dips below 0")`
* `test("accurately computes month KPIs: inflow, outflow, net cash flow, lowest point")`
* `test("converts multi-currency events to user target currency")`
* `test("generates correct recurrence occurrences for daily, weekly, bi-weekly, monthly, yearly rules")`

### 10.2 Manual & Visual QA
* Navigate through previous, current, and future months using header controls.
* Switch between "Liquid Cash" and "All Wallets" modes and verify balances recalculate accurately.
* Switch between Month Grid and Agenda List views across desktop and mobile screen sizes.
* Add a one-off planned expense via the dialog, observe it appear on the target date, and verify the projected balance updates.
* Open the Day Details sheet on a date with an upcoming bill, click "Mark as Paid", and verify status reconciliation.
