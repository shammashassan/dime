# Cash Flow Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade Cash Flow Calendar (Feature #10) featuring a hybrid timeline (settled historical transactions + future projected recurring rules, bills, subscriptions, loan dues, and custom one-off plans), running daily cash balance projections with deficit warnings, toggleable liquid vs all-accounts modes, and full visual uniformity with Dime's design system.

**Architecture:** A pure mathematical calculation engine in `lib/calculations/cash-flow-calendar.ts` projects day-by-day cash flow and running balances across a complete 35-to-42 cell calendar grid. A cached query in `lib/queries/cash-flow-calendar.ts` fetches and normalizes scoped financial entities in parallel. Server actions in `lib/actions/calendar.ts` manage one-off planned events in `calendar_events`. The UI layer in `components/calendar/` and `app/(dashboard)/calendar/` provides a 7-column month grid, mobile agenda feed, and slide-over day sheet matching Dime's standards.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript 5, MongoDB, Tailwind CSS v4, shadcn/ui, Sonner toasts, Lucide React icons, date-fns.

**Spec:** [`docs/superpowers/specs/2026-09-13-cash-flow-calendar-design.md`](file:///c:/dev/personal-projects/dime/docs/superpowers/specs/2026-09-13-cash-flow-calendar-design.md)

## Global Constraints

- Must follow Next.js 16 conventions (`proxy.ts` not `middleware.ts`, `React.cache()` on queries, `cacheComponents: true`, promises awaited).
- Treat shadcn/ui as the design system (`MetricCard`, `FieldGroup`, `Field`, `InputGroup`, semantic tokens `bg-card`, `border`, `text-muted-foreground`).
- All financial balances and amounts stored strictly as integer cents/paise (no floating point currency).
- Multi-currency normalization using Dime's `createCurrencyConverter`.
- Multi-tenant scoping via `getFinancialScope()` and `getScopeFilter()`.

---

## File Structure Map

| File Path | Role / Responsibility |
|---|---|
| `types/index.ts` | Domain types for `CalendarEventType`, `CalendarEventItem`, `CalendarDaySummary`, `CashFlowMonthOverview`, `CalendarPlanEvent`, `SerializedCalendarPlanEvent` |
| `lib/db/collections.ts` | Export typed `calendarEventsCollection` in MongoDB |
| `lib/validations/calendar.schema.ts` | Zod validation schemas for creating, updating, and deleting one-off planned calendar events |
| `lib/actions/calendar.ts` | Next.js Server Actions with auth guard, financial scope, and MongoDB mutations for planned events |
| `lib/calculations/cash-flow-calendar.ts` | Pure deterministic calculation engine: recurrence generation, backward reconstruction, forward projection, deficit flags, month KPIs |
| `lib/calculations/__tests__/cash-flow-calendar.test.ts` | Automated unit test suite verifying calculations, edge cases, multi-currency, and recurrence rules |
| `lib/queries/cash-flow-calendar.ts` | Cached server query orchestrating wallets, transactions, recurring rules, bills, loans, and planned events |
| `components/calendar/calendar-header.tsx` | Page header with month controls, Liquid/All toggle, view mode switcher, and "+ Add Plan" button |
| `components/calendar/calendar-metrics-row.tsx` | Top Bento row using `MetricCard` (Inflow, Outflow, Net Cash Flow, Lowest Projected Balance) |
| `components/calendar/plan-event-dialog.tsx` | Accessible shadcn dialog for creating/editing one-off planned events |
| `components/calendar/calendar-day-sheet.tsx` | Slide-over Sheet for date inspection, running balance breakdown, 1-click "Mark Paid", and plan management |
| `components/calendar/calendar-month-grid.tsx` | Responsive 7-column calendar grid with daily closing balance pills, top 3 event badges, and deficit styling |
| `components/calendar/calendar-agenda-list.tsx` | Mobile-friendly chronological agenda feed grouped by day |
| `components/calendar/calendar-client.tsx` | Client controller orchestrating month state, viewMode, walletMode, optimistic actions, and toasts |
| `app/(dashboard)/calendar/page.tsx` | Server Component route wrapped in Suspense with auth guard |
| `app/(dashboard)/calendar/loading.tsx` | Accessible shimmer skeleton matching `/insights` and `/health` |
| `app/(dashboard)/calendar/error.tsx` | Co-located error boundary with 1-click retry |
| `components/layout/dashboard-sidebar.tsx` | Navigation item in `NAV_ITEMS` linking to `/calendar` with `CalendarDays` icon |

---

### Task 1: Domain Types and Database Collection

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/db/collections.ts`

**Interfaces:**
- Produces: `CalendarEventType`, `CalendarEventStatus`, `CalendarEventItem`, `CalendarDaySummary`, `CashFlowMonthOverview`, `CalendarPlanEvent`, `SerializedCalendarPlanEvent`, `calendarEventsCollection`

- [ ] **Step 1: Add domain types to `types/index.ts`**

Append the following types to the end of `types/index.ts`:

```ts
// ── Cash Flow Calendar Domain Types ──

export type CalendarEventType =
  | "transaction"
  | "recurring"
  | "bill"
  | "subscription"
  | "loan"
  | "plan"

export type CalendarEventStatus = "settled" | "upcoming" | "overdue" | "planned"

export interface CalendarEventItem {
  id: string
  date: string                   // YYYY-MM-DD
  title: string
  amount: number                 // Original currency cents (always positive)
  currency: string
  convertedAmount: number        // Target currency cents
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
  sourceId?: string
  notes?: string
}

export interface CalendarDaySummary {
  date: string                   // YYYY-MM-DD
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  closingBalance: number         // Target currency cents
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
  totalInflow: number            // Sum of month inflows
  totalOutflow: number           // Sum of month outflows
  netCashFlow: number            // totalInflow - totalOutflow
  lowestBalance: number          // Minimum projected balance in month
  lowestBalanceDate: string      // Date of minimum balance
  deficitDaysCount: number       // Days with closingBalance < 0
  days: CalendarDaySummary[]     // Complete calendar cells (35 or 42)
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
  isCompleted: boolean
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

- [ ] **Step 2: Export `calendarEventsCollection` in `lib/db/collections.ts`**

Import `CalendarPlanEvent` in `lib/db/collections.ts` and add:
```ts
export const calendarEventsCollection = db.collection<CalendarPlanEvent>("calendar_events")
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS with zero errors.

- [ ] **Step 4: Commit**

```bash
git add types/index.ts lib/db/collections.ts
git commit -m "feat(calendar): define domain types and export calendar_events collection"
```

---

### Task 2: Validation Schemas & Server Actions

**Files:**
- Create: `lib/validations/calendar.schema.ts`
- Create: `lib/actions/calendar.ts`

**Interfaces:**
- Consumes: `CalendarPlanEvent`, `calendarEventsCollection`, `requireApprovedUser`, `getFinancialScope`
- Produces: `createCalendarPlanSchema`, `updateCalendarPlanSchema`, `createCalendarPlanAction`, `updateCalendarPlanAction`, `deleteCalendarPlanAction`, `toggleCalendarPlanCompletedAction`

- [ ] **Step 1: Create `lib/validations/calendar.schema.ts`**

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
  id: z.string().min(1, "Plan ID is required"),
  isCompleted: z.boolean().optional(),
})

export type CreateCalendarPlanInput = z.infer<typeof createCalendarPlanSchema>
export type UpdateCalendarPlanInput = z.infer<typeof updateCalendarPlanSchema>
```

- [ ] **Step 2: Create `lib/actions/calendar.ts`**

```ts
"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { calendarEventsCollection } from "@/lib/db/collections"
import {
  createCalendarPlanSchema,
  updateCalendarPlanSchema,
  CreateCalendarPlanInput,
  UpdateCalendarPlanInput,
} from "@/lib/validations/calendar.schema"
import { CalendarPlanEvent } from "@/types"

export async function createCalendarPlanAction(input: CreateCalendarPlanInput) {
  const session = await requireApprovedUser()
  const validated = createCalendarPlanSchema.parse(input)
  const scope = await getFinancialScope()

  const [year, month, day] = validated.date.split("-").map(Number)
  const scheduledDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  const newDoc: CalendarPlanEvent = {
    _id: new ObjectId(),
    userId: session.user.id,
    organizationId: scope.isOrganization ? scope.organizationId : null,
    ownerUserId: session.user.id,
    title: validated.title,
    amount: validated.amount,
    currency: validated.currency.toUpperCase(),
    date: scheduledDate,
    flow: validated.flow,
    walletId: validated.walletId || undefined,
    categoryId: validated.categoryId || undefined,
    notes: validated.notes || undefined,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await calendarEventsCollection.insertOne(newDoc)
  revalidatePath("/calendar")

  return { success: true, id: newDoc._id.toString() }
}

export async function updateCalendarPlanAction(input: UpdateCalendarPlanInput) {
  const session = await requireApprovedUser()
  const validated = updateCalendarPlanSchema.parse(input)
  const scope = await getFinancialScope()

  const updateFields: Partial<CalendarPlanEvent> = {
    updatedAt: new Date(),
  }

  if (validated.title !== undefined) updateFields.title = validated.title
  if (validated.amount !== undefined) updateFields.amount = validated.amount
  if (validated.currency !== undefined) updateFields.currency = validated.currency.toUpperCase()
  if (validated.flow !== undefined) updateFields.flow = validated.flow
  if (validated.walletId !== undefined) updateFields.walletId = validated.walletId || undefined
  if (validated.categoryId !== undefined) updateFields.categoryId = validated.categoryId || undefined
  if (validated.notes !== undefined) updateFields.notes = validated.notes || undefined
  if (validated.isCompleted !== undefined) updateFields.isCompleted = validated.isCompleted

  if (validated.date) {
    const [year, month, day] = validated.date.split("-").map(Number)
    updateFields.date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  }

  const result = await calendarEventsCollection.updateOne(
    {
      _id: new ObjectId(validated.id),
      ...getScopeFilter(scope),
    },
    { $set: updateFields }
  )

  if (result.matchedCount === 0) {
    throw new Error("Planned event not found or unauthorized")
  }

  revalidatePath("/calendar")
  return { success: true }
}

export async function deleteCalendarPlanAction(planId: string) {
  const session = await requireApprovedUser()
  const scope = await getFinancialScope()

  const result = await calendarEventsCollection.deleteOne({
    _id: new ObjectId(planId),
    ...getScopeFilter(scope),
  })

  if (result.deletedCount === 0) {
    throw new Error("Planned event not found or unauthorized")
  }

  revalidatePath("/calendar")
  return { success: true }
}

export async function toggleCalendarPlanCompletedAction(planId: string, isCompleted: boolean) {
  return updateCalendarPlanAction({ id: planId, isCompleted })
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/validations/calendar.schema.ts lib/actions/calendar.ts
git commit -m "feat(calendar): implement validation schemas and server actions for planned events"
```

---

### Task 3: Pure Calculation Engine & Unit Tests

**Files:**
- Create: `lib/calculations/cash-flow-calendar.ts`
- Create: `lib/calculations/__tests__/cash-flow-calendar.test.ts`

**Interfaces:**
- Produces: `calculateCashFlowCalendar`, `generateCalendarGridDays`, `projectRecurringOccurrences`

- [ ] **Step 1: Write the failing unit tests in `lib/calculations/__tests__/cash-flow-calendar.test.ts`**

```ts
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { ObjectId } from "mongodb"
import type {
  Wallet,
  Transaction,
  RecurringRule,
  BillInstance,
  Loan,
  LoanRepayment,
  CalendarPlanEvent,
  Category,
} from "@/types"
import {
  calculateCashFlowCalendar,
  generateCalendarGridDays,
  projectRecurringOccurrences,
  // @ts-expect-error -- Node ESM test runner requires .ts extension
} from "../cash-flow-calendar.ts"

describe("Cash Flow Calendar Calculation Engine", () => {
  const mockCategories: Category[] = [
    { _id: new ObjectId(), userId: "u1", name: "Income", type: ["income"], icon: "briefcase" },
    { _id: new ObjectId(), userId: "u1", name: "Housing", type: ["expense"], icon: "home" },
  ]

  const mockWallets: Wallet[] = [
    {
      _id: new ObjectId(),
      userId: "u1",
      name: "Checking",
      type: "bank",
      currency: "USD",
      balance: 500000, // $5,000.00
      color: "#3b82f6",
      icon: "building",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "u1",
      name: "Credit Card",
      type: "credit_card",
      currency: "USD",
      balance: 100000, // $1,000 debt
      color: "#ef4444",
      icon: "credit-card",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  it("1. generates a complete 35 or 42 day grid covering the month", () => {
    const days = generateCalendarGridDays(2026, 10, "2026-10-15") // Oct 2026
    assert.ok(days.length === 35 || days.length === 42)
    assert.strictEqual(days[0].date.length, 10)
    assert.ok(days.some((d) => d.isCurrentMonth && d.dayOfMonth === 1))
    assert.ok(days.some((d) => d.isCurrentMonth && d.dayOfMonth === 31))
  })

  it("2. correctly projects recurring occurrences for monthly rule", () => {
    const rule: RecurringRule = {
      _id: new ObjectId(),
      userId: "u1",
      walletId: mockWallets[0]._id.toString(),
      type: "expense",
      amount: 1500, // $15.00
      currency: "USD",
      description: "Netflix",
      frequency: "monthly",
      interval: 1,
      startDate: new Date("2026-01-15T00:00:00Z"),
      nextOccurrence: new Date("2026-10-15T00:00:00Z"),
      isActive: true,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const occurrences = projectRecurringOccurrences(rule, "2026-10-01", "2026-10-31")
    assert.strictEqual(occurrences.length, 1)
    assert.strictEqual(occurrences[0].date, "2026-10-15")
    assert.strictEqual(occurrences[0].amount, 1500)
    assert.strictEqual(occurrences[0].flow, "outflow")
  })

  it("3. projects running balance forward and backward accurately", () => {
    const transactions: Transaction[] = [
      {
        _id: new ObjectId(),
        userId: "u1",
        walletId: mockWallets[0]._id.toString(),
        type: "expense",
        amount: 5000, // $50.00
        currency: "USD",
        description: "Past Groceries",
        date: new Date("2026-10-10T12:00:00Z"),
        tags: [],
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const plans: CalendarPlanEvent[] = [
      {
        _id: new ObjectId(),
        userId: "u1",
        title: "Upcoming Freelance",
        amount: 100000, // $1,000.00
        currency: "USD",
        date: new Date("2026-10-20T12:00:00Z"),
        flow: "inflow",
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const result = calculateCashFlowCalendar({
      targetMonth: "2026-10",
      todayDate: "2026-10-15",
      wallets: mockWallets,
      transactions,
      recurringRules: [],
      bills: [],
      loans: [],
      repayments: [],
      plans,
      categories: mockCategories,
      targetCurrency: "USD",
      exchangeRates: { USD: 1.0 },
      mode: "liquid",
      safetyBufferCents: 100000, // $1,000 safety buffer
    })

    assert.strictEqual(result.month, "2026-10")
    assert.strictEqual(result.totalInflow, 100000)
    assert.strictEqual(result.totalOutflow, 5000)
    assert.strictEqual(result.netCashFlow, 95000)
    assert.ok(result.days.length >= 35)

    // Check Oct 20th contains the freelance inflow
    const day20 = result.days.find((d) => d.date === "2026-10-20")
    assert.ok(day20)
    assert.strictEqual(day20?.totalInflow, 100000)
    assert.ok((day20?.closingBalance ?? 0) > 500000)
  })

  it("4. flags deficit days when balance drops below 0", () => {
    const lowWallets: Wallet[] = [
      {
        ...mockWallets[0],
        balance: 2000, // Only $20.00 in checking
      },
    ]

    const bigBill: BillInstance = {
      _id: new ObjectId(),
      userId: "u1",
      name: "Rent",
      amount: 120000, // $1,200.00
      currency: "USD",
      dueDate: new Date("2026-10-18T12:00:00Z"),
      isPaid: false,
      status: "upcoming",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = calculateCashFlowCalendar({
      targetMonth: "2026-10",
      todayDate: "2026-10-15",
      wallets: lowWallets,
      transactions: [],
      recurringRules: [],
      bills: [bigBill],
      loans: [],
      repayments: [],
      plans: [],
      categories: mockCategories,
      targetCurrency: "USD",
      exchangeRates: { USD: 1.0 },
      mode: "liquid",
      safetyBufferCents: 0,
    })

    assert.ok(result.deficitDaysCount > 0)
    assert.ok(result.lowestBalance < 0)
    assert.strictEqual(result.lowestBalanceDate, "2026-10-18")

    const day18 = result.days.find((d) => d.date === "2026-10-18")
    assert.strictEqual(day18?.isDeficit, true)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test lib/calculations/__tests__/cash-flow-calendar.test.ts`  
Expected: FAIL with module not found (`../cash-flow-calendar.ts`).

- [ ] **Step 3: Implement `lib/calculations/cash-flow-calendar.ts`**

```ts
import {
  Wallet,
  Transaction,
  RecurringRule,
  BillInstance,
  Loan,
  LoanRepayment,
  CalendarPlanEvent,
  Category,
  CalendarEventItem,
  CalendarDaySummary,
  CashFlowMonthOverview,
} from "@/types"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isBefore,
  isAfter,
  addDays,
  addWeeks,
  addMonths,
  addYears,
} from "date-fns"

export function createCurrencyConverter(targetCurrency: string, exchangeRates: Record<string, number>) {
  const targetUpper = targetCurrency.toUpperCase()
  return (amount: number, fromCurrency?: string) => {
    const fromUpper = (fromCurrency || targetCurrency).toUpperCase()
    if (fromUpper === targetUpper) return amount
    const rate = exchangeRates[fromUpper]
    if (rate && rate > 0) {
      return Math.round(amount / rate)
    }
    return amount
  }
}

export function generateCalendarGridDays(
  year: number,
  month: number,
  todayStr: string
): CalendarDaySummary[] {
  const monthDate = new Date(Date.UTC(year, month - 1, 1))
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })

  const rawDays = eachDayOfInterval({ start, end })

  return rawDays.map((d) => {
    const dateStr = format(d, "yyyy-MM-dd")
    const dMonth = d.getUTCMonth() + 1
    const dYear = d.getUTCFullYear()

    return {
      date: dateStr,
      dayOfMonth: d.getUTCDate(),
      isCurrentMonth: dYear === year && dMonth === month,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      closingBalance: 0,
      totalInflow: 0,
      totalOutflow: 0,
      netChange: 0,
      events: [],
      isDeficit: false,
      isLowBuffer: false,
    }
  })
}

export function projectRecurringOccurrences(
  rule: RecurringRule,
  windowStartStr: string,
  windowEndStr: string
): CalendarEventItem[] {
  if (!rule.isActive) return []

  const occurrences: CalendarEventItem[] = []
  const windowStart = parseISO(windowStartStr)
  const windowEnd = parseISO(windowEndStr)
  const ruleStart = new Date(rule.startDate)
  const ruleEnd = rule.endDate ? new Date(rule.endDate) : null

  let cur = new Date(rule.nextOccurrence || ruleStart)
  // Rewind if cur is after windowStart to ensure we catch all instances
  while (isAfter(cur, windowStart) && isAfter(cur, ruleStart)) {
    if (rule.frequency === "daily") cur = addDays(cur, -(rule.interval || 1))
    else if (rule.frequency === "weekly" || rule.frequency === "biweekly") cur = addWeeks(cur, -(rule.interval || (rule.frequency === "biweekly" ? 2 : 1)))
    else if (rule.frequency === "monthly") cur = addMonths(cur, -(rule.interval || 1))
    else if (rule.frequency === "yearly") cur = addYears(cur, -(rule.interval || 1))
    else break
  }

  // Fast forward into window
  let safety = 0
  while (safety++ < 1000) {
    if (isAfter(cur, windowEnd)) break
    if (ruleEnd && isAfter(cur, ruleEnd)) break

    const dateStr = format(cur, "yyyy-MM-dd")
    if (dateStr >= windowStartStr && dateStr <= windowEndStr && !isBefore(cur, ruleStart)) {
      occurrences.push({
        id: `rec_${rule._id.toString()}_${dateStr}`,
        date: dateStr,
        title: rule.description,
        amount: Math.abs(rule.amount),
        currency: rule.currency || "USD",
        convertedAmount: Math.abs(rule.amount),
        type: rule.type === "income" ? "recurring" : (rule.isSubscription ? "subscription" : "recurring"),
        flow: rule.type === "income" ? "inflow" : "outflow",
        status: "upcoming",
        walletId: rule.walletId,
        sourceId: rule._id.toString(),
      })
    }

    if (rule.frequency === "daily") cur = addDays(cur, rule.interval || 1)
    else if (rule.frequency === "weekly") cur = addWeeks(cur, rule.interval || 1)
    else if (rule.frequency === "biweekly") cur = addWeeks(cur, 2 * (rule.interval || 1))
    else if (rule.frequency === "monthly") cur = addMonths(cur, rule.interval || 1)
    else if (rule.frequency === "yearly") cur = addYears(cur, rule.interval || 1)
    else break
  }

  return occurrences
}

export interface CalculateCashFlowCalendarInputs {
  targetMonth: string // YYYY-MM
  todayDate?: string  // YYYY-MM-DD override for testing
  wallets: Wallet[]
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  bills: BillInstance[]
  loans: Loan[]
  repayments: LoanRepayment[]
  plans: CalendarPlanEvent[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  mode: "liquid" | "all"
  safetyBufferCents?: number
}

export function calculateCashFlowCalendar(inputs: CalculateCashFlowCalendarInputs): CashFlowMonthOverview {
  const {
    targetMonth,
    wallets,
    transactions,
    recurringRules,
    bills,
    loans,
    repayments,
    plans,
    categories,
    targetCurrency,
    exchangeRates,
    mode,
    safetyBufferCents = 0,
  } = inputs

  const todayStr = inputs.todayDate || format(new Date(), "yyyy-MM-dd")
  const [yearStr, monthStr] = targetMonth.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const convert = createCurrencyConverter(targetCurrency, exchangeRates || {})
  const categoryMap = new Map<string, Category>()
  categories.forEach((c) => categoryMap.set(c._id.toString(), c))

  const walletMap = new Map<string, Wallet>()
  wallets.forEach((w) => walletMap.set(w._id.toString(), w))

  // 1. Compute today's baseline cash balance
  let baselineCash = 0
  for (const w of wallets) {
    if (w.isArchived) continue
    if (mode === "liquid") {
      if (w.type === "cash" || w.type === "bank" || w.type === "savings") {
        baselineCash += convert(w.balance, w.currency)
      }
    } else {
      // All wallets: credit cards are liabilities
      const val = convert(w.balance, w.currency)
      if (w.type === "credit_card") {
        baselineCash -= Math.abs(val)
      } else {
        baselineCash += val
      }
    }
  }

  // 2. Generate calendar cells (35 or 42 days)
  const days = generateCalendarGridDays(year, month, todayStr)
  const windowStartStr = days[0].date
  const windowEndStr = days[days.length - 1].date

  const dayMap = new Map<string, CalendarDaySummary>()
  days.forEach((d) => dayMap.set(d.date, d))

  // Helper to attach event to a day
  const attachEvent = (item: CalendarEventItem) => {
    const day = dayMap.get(item.date)
    if (!day) return
    day.events.push(item)
    if (item.flow === "inflow") {
      day.totalInflow += item.convertedAmount
    } else {
      day.totalOutflow += item.convertedAmount
    }
    day.netChange = day.totalInflow - day.totalOutflow
  }

  // 3. Map Historical Settled Transactions (Past & Today)
  for (const tx of transactions) {
    const txDateStr = format(new Date(tx.date), "yyyy-MM-dd")
    if (txDateStr > todayStr || txDateStr < windowStartStr) continue

    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined
    const w = walletMap.get(tx.walletId)
    const converted = convert(tx.amount, tx.currency)

    attachEvent({
      id: `tx_${tx._id.toString()}`,
      date: txDateStr,
      title: tx.description,
      amount: tx.amount,
      currency: tx.currency,
      convertedAmount: converted,
      type: "transaction",
      flow: tx.type === "income" ? "inflow" : "outflow",
      status: "settled",
      category: cat ? { id: cat._id.toString(), name: cat.name, icon: cat.icon, color: cat.color } : undefined,
      walletId: tx.walletId,
      walletName: w?.name,
      sourceId: tx._id.toString(),
      notes: tx.notes,
    })
  }

  // 4. Map Recurring Rule Occurrences (Today & Future)
  for (const rule of recurringRules) {
    const occurrences = projectRecurringOccurrences(rule, todayStr, windowEndStr)
    for (const occ of occurrences) {
      occ.convertedAmount = convert(occ.amount, occ.currency)
      attachEvent(occ)
    }
  }

  // 5. Map Bill Instances (Today & Future or Overdue)
  for (const bill of bills) {
    const billDateStr = format(new Date(bill.dueDate), "yyyy-MM-dd")
    if (bill.isPaid && billDateStr < todayStr) continue // Settled bills in past already captured via transactions

    const converted = convert(bill.amount, bill.currency)
    const isOverdue = !bill.isPaid && billDateStr < todayStr
    const effectiveDate = isOverdue ? todayStr : billDateStr // Overdue bills press on today's cash flow

    attachEvent({
      id: `bill_${bill._id.toString()}`,
      date: effectiveDate,
      title: bill.name,
      amount: bill.amount,
      currency: bill.currency,
      convertedAmount: converted,
      type: "bill",
      flow: "outflow",
      status: isOverdue ? "overdue" : (bill.isPaid ? "settled" : "upcoming"),
      sourceId: bill._id.toString(),
      notes: isOverdue ? "Overdue Bill" : undefined,
    })
  }

  // 6. Map Loan Repayments
  for (const rep of repayments) {
    const repDateStr = format(new Date(rep.date), "yyyy-MM-dd")
    if (repDateStr < todayStr) continue

    const converted = convert(rep.amount, rep.currency || targetCurrency)
    const loan = loans.find((l) => l._id.toString() === rep.loanId)
    const isLent = loan?.type === "lent"

    attachEvent({
      id: `loan_rep_${rep._id.toString()}`,
      date: repDateStr,
      title: loan ? `${loan.name} Repayment` : "Loan Repayment",
      amount: rep.amount,
      currency: rep.currency || targetCurrency,
      convertedAmount: converted,
      type: "loan",
      flow: isLent ? "inflow" : "outflow",
      status: "upcoming",
      sourceId: rep.loanId,
    })
  }

  // 7. Map One-off Planned Events
  for (const plan of plans) {
    const planDateStr = format(new Date(plan.date), "yyyy-MM-dd")
    if (plan.isCompleted && planDateStr < todayStr) continue

    const converted = convert(plan.amount, plan.currency)
    const cat = plan.categoryId ? categoryMap.get(plan.categoryId) : undefined
    const w = plan.walletId ? walletMap.get(plan.walletId) : undefined

    attachEvent({
      id: `plan_${plan._id.toString()}`,
      date: planDateStr,
      title: plan.title,
      amount: plan.amount,
      currency: plan.currency,
      convertedAmount: converted,
      type: "plan",
      flow: plan.flow,
      status: plan.isCompleted ? "settled" : "planned",
      category: cat ? { id: cat._id.toString(), name: cat.name, icon: cat.icon, color: cat.color } : undefined,
      walletId: plan.walletId,
      walletName: w?.name,
      sourceId: plan._id.toString(),
      notes: plan.notes,
    })
  }

  // 8. Calculate Daily Running Balances (Backward & Forward)
  const todayIdx = days.findIndex((d) => d.date === todayStr)
  const effectiveTodayIdx = todayIdx !== -1 ? todayIdx : days.findIndex((d) => d.date > todayStr)

  // Forward trajectory from today
  let running = baselineCash
  for (let i = (effectiveTodayIdx !== -1 ? effectiveTodayIdx : 0); i < days.length; i++) {
    const d = days[i]
    running += d.netChange
    d.closingBalance = running
    d.isDeficit = d.closingBalance < 0
    d.isLowBuffer = d.closingBalance < safetyBufferCents
  }

  // Backward trajectory for historical days
  let backwardRunning = baselineCash
  for (let i = (effectiveTodayIdx !== -1 ? effectiveTodayIdx - 1 : days.length - 1); i >= 0; i--) {
    const d = days[i]
    d.closingBalance = backwardRunning
    d.isDeficit = d.closingBalance < 0
    d.isLowBuffer = d.closingBalance < safetyBufferCents
    backwardRunning -= d.netChange
  }

  // 9. Compute Month-Level Aggregate KPIs
  let totalInflow = 0
  let totalOutflow = 0
  let lowestBalance = Infinity
  let lowestBalanceDate = todayStr
  let deficitDaysCount = 0

  for (const d of days) {
    if (!d.isCurrentMonth) continue
    totalInflow += d.totalInflow
    totalOutflow += d.totalOutflow

    if (d.closingBalance < lowestBalance) {
      lowestBalance = d.closingBalance
      lowestBalanceDate = d.date
    }
    if (d.isDeficit) {
      deficitDaysCount++
    }
  }

  const currentMonthDays = days.filter((d) => d.isCurrentMonth)
  const startingBalance = currentMonthDays[0]?.closingBalance - currentMonthDays[0]?.netChange || baselineCash
  const projectedEndingBalance = currentMonthDays[currentMonthDays.length - 1]?.closingBalance || baselineCash

  return {
    month: targetMonth,
    targetCurrency,
    startingBalance,
    projectedEndingBalance,
    totalInflow,
    totalOutflow,
    netCashFlow: totalInflow - totalOutflow,
    lowestBalance: lowestBalance === Infinity ? baselineCash : lowestBalance,
    lowestBalanceDate,
    deficitDaysCount,
    days,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/calculations/__tests__/cash-flow-calendar.test.ts`  
Expected: PASS (4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add lib/calculations/cash-flow-calendar.ts lib/calculations/__tests__/cash-flow-calendar.test.ts
git commit -m "feat(calendar): implement pure calculation engine and unit tests"
```

---

### Task 4: Cached Server Query Layer

**Files:**
- Create: `lib/queries/cash-flow-calendar.ts`

**Interfaces:**
- Consumes: `walletsCollection`, `transactionsCollection`, `recurringRulesCollection`, `billInstancesCollection`, `loansCollection`, `loanRepaymentsCollection`, `calendarEventsCollection`, `categoriesCollection`, `getExchangeRates`, `getPreferences`, `getFinancialScope`, `calculateCashFlowCalendar`
- Produces: `getCashFlowCalendarData`

- [ ] **Step 1: Create `lib/queries/cash-flow-calendar.ts`**

```ts
import { cache } from "react"
import { ObjectId } from "mongodb"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import {
  walletsCollection,
  transactionsCollection,
  recurringRulesCollection,
  categoriesCollection,
  loansCollection,
  loanRepaymentsCollection,
  calendarEventsCollection,
  getCollection,
} from "@/lib/db/collections"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { calculateCashFlowCalendar } from "@/lib/calculations/cash-flow-calendar"
import {
  Wallet,
  Transaction,
  RecurringRule,
  BillInstance,
  Loan,
  LoanRepayment,
  CalendarPlanEvent,
  Category,
  CashFlowMonthOverview,
} from "@/types"
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"

export interface GetCashFlowCalendarOptions {
  month?: string // YYYY-MM
  mode?: "liquid" | "all"
}

export const getCashFlowCalendarData = cache(
  async (userId: string, options: GetCashFlowCalendarOptions = {}): Promise<CashFlowMonthOverview> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)

    const targetMonth = options.month || format(new Date(), "yyyy-MM")
    const mode = options.mode || "liquid"

    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const [yearStr, monthStr] = targetMonth.split("-")
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    const monthDate = new Date(Date.UTC(year, month - 1, 1))
    const windowStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
    const windowEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })

    const billsColl = await getCollection<BillInstance>("bill_instances")

    const [
      wallets,
      transactions,
      recurringRules,
      bills,
      loans,
      repayments,
      plans,
      categories,
      exchangeRates,
    ] = await Promise.all([
      walletsCollection.find(filter).toArray(),
      transactionsCollection
        .find({
          ...filter,
          date: { $gte: windowStart },
        })
        .sort({ date: 1 })
        .toArray(),
      recurringRulesCollection.find({ ...filter, isActive: true }).toArray(),
      billsColl.find(filter).toArray(),
      loansCollection.find(filter).toArray(),
      loanRepaymentsCollection.find(filter).toArray(),
      calendarEventsCollection
        .find({
          ...filter,
          date: { $gte: windowStart, $lte: windowEnd },
        })
        .toArray(),
      categoriesCollection.find({}).toArray(),
      getExchangeRates(targetCurrency),
    ])

    return calculateCashFlowCalendar({
      targetMonth,
      wallets,
      transactions,
      recurringRules,
      bills,
      loans,
      repayments,
      plans,
      categories,
      targetCurrency,
      exchangeRates: exchangeRates || {},
      mode,
      safetyBufferCents: 50000, // $500 default buffer
    })
  }
)
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/queries/cash-flow-calendar.ts
git commit -m "feat(calendar): implement cached query layer for cash flow calendar"
```

---

### Task 5: Header, Metrics Row, and Plan Event Dialog

**Files:**
- Create: `components/calendar/calendar-header.tsx`
- Create: `components/calendar/calendar-metrics-row.tsx`
- Create: `components/calendar/plan-event-dialog.tsx`

**Interfaces:**
- Consumes: `MetricCard`, `Button`, `Badge`, `Dialog`, `FieldGroup`, `Field`, `Input`, `Select`, `ToggleGroup`
- Produces: `CalendarHeader`, `CalendarMetricsRow`, `PlanEventDialog`

- [ ] **Step 1: Create `components/calendar/calendar-header.tsx`**

```tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { addMonths, format, parseISO } from "date-fns"

interface CalendarHeaderProps {
  currentMonth: string // YYYY-MM
  onMonthChange: (month: string) => void
  walletMode: "liquid" | "all"
  onWalletModeChange: (mode: "liquid" | "all") => void
  viewMode: "grid" | "agenda"
  onViewModeChange: (view: "grid" | "agenda") => void
  onOpenAddPlan: () => void
  currency: string
}

export function CalendarHeader({
  currentMonth,
  onMonthChange,
  walletMode,
  onWalletModeChange,
  viewMode,
  onViewModeChange,
  onOpenAddPlan,
  currency,
}: CalendarHeaderProps) {
  const currentDate = parseISO(`${currentMonth}-01`)
  const monthLabel = format(currentDate, "MMMM yyyy")

  const handlePrev = () => {
    onMonthChange(format(addMonths(currentDate, -1), "yyyy-MM"))
  }

  const handleNext = () => {
    onMonthChange(format(addMonths(currentDate, 1), "yyyy-MM"))
  }

  const handleToday = () => {
    onMonthChange(format(new Date(), "yyyy-MM"))
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* ── Title & Meta ── */}
      <div className="flex items-start gap-3.5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
          <CalendarDays className="size-6" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Cash Flow Calendar
            </h1>
            <HoverCard openDelay={150}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  tabIndex={0}
                  className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5 cursor-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {currency}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-64 text-xs rounded-xl border border-border/40 shadow-lg p-3"
                align="start"
                side="top"
              >
                All projections and daily running balances are normalized in {currency}.
              </HoverCardContent>
            </HoverCard>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize day-by-day cash trajectory, upcoming bills, subscriptions, and liquidity.
          </p>
        </div>
      </div>

      {/* ── Month & Action Controls ── */}
      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
        {/* Month Navigator */}
        <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-2xl border border-border/40 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            aria-label="Previous month"
            className="size-7 rounded-xl hover:bg-background cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="text-xs font-bold px-2 min-w-[100px] text-center select-none">
            {monthLabel}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            aria-label="Next month"
            className="size-7 rounded-xl hover:bg-background cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="rounded-xl font-bold text-xs border-border/40 hover:bg-muted/40 cursor-pointer h-9 px-3"
        >
          Today
        </Button>

        {/* Liquid vs All Toggle */}
        <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <button
            onClick={() => onWalletModeChange("liquid")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              walletMode === "liquid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Liquid Cash
          </button>
          <button
            onClick={() => onWalletModeChange("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              walletMode === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Accounts
          </button>
        </div>

        {/* Grid vs Agenda Toggle */}
        <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <button
            onClick={() => onViewModeChange("grid")}
            aria-label="Calendar Grid View"
            className={cn(
              "size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="size-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("agenda")}
            aria-label="Agenda Feed View"
            className={cn(
              "size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
              viewMode === "agenda"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3.5" />
          </button>
        </div>

        {/* Add Plan Button */}
        <Button
          onClick={onOpenAddPlan}
          size="sm"
          className="rounded-xl font-bold gap-1.5 text-xs h-9 cursor-pointer shadow-sm"
        >
          <Plus className="size-3.5" />
          Add Planned
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/calendar/calendar-metrics-row.tsx`**

```tsx
import React from "react"
import { formatCurrency } from "@/lib/utils"
import { MetricCard } from "@/components/ui/metric-card"
import { TrendingUp, TrendingDown, ArrowDownRight, ShieldAlert } from "lucide-react"
import { CashFlowMonthOverview } from "@/types"

interface CalendarMetricsRowProps {
  overview: CashFlowMonthOverview
}

export function CalendarMetricsRow({ overview }: CalendarMetricsRowProps) {
  const { totalInflow, totalOutflow, netCashFlow, lowestBalance, lowestBalanceDate, deficitDaysCount, targetCurrency } = overview

  const isLowestDeficit = lowestBalance < 0

  return (
    <div className="flex flex-wrap gap-4 w-full">
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={TrendingUp}
        color="#10b981"
        label="Expected Inflow"
        value={formatCurrency(totalInflow, targetCurrency)}
        valueClassName="text-emerald-500"
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={TrendingDown}
        color="#ef4444"
        label="Scheduled Outflow"
        value={formatCurrency(totalOutflow, targetCurrency)}
        valueClassName="text-rose-500"
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={ArrowDownRight}
        color="#8b5cf6"
        label="Net Projected Flow"
        value={formatCurrency(netCashFlow, targetCurrency)}
        valueClassName={netCashFlow >= 0 ? "text-emerald-500" : "text-rose-500"}
      />
      <MetricCard
        style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
        icon={ShieldAlert}
        color={isLowestDeficit ? "#ef4444" : "#f59e0b"}
        label={isLowestDeficit ? `Deficit Warning (${deficitDaysCount}d)` : "Lowest Cash Point"}
        value={formatCurrency(lowestBalance, targetCurrency)}
        valueClassName={isLowestDeficit ? "text-rose-500" : undefined}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create `components/calendar/plan-event-dialog.tsx`**

```tsx
"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createCalendarPlanAction } from "@/lib/actions/calendar"

interface PlanEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  currency: string
}

export function PlanEventDialog({
  open,
  onOpenChange,
  defaultDate,
  currency,
}: PlanEventDialogProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0])
  const [flow, setFlow] = useState<"inflow" | "outflow">("outflow")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount) {
      toast.error("Please provide a title and valid amount")
      return
    }

    const parsedAmount = Math.round(parseFloat(amount) * 100)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than zero")
      return
    }

    try {
      setLoading(true)
      await createCalendarPlanAction({
        title: title.trim(),
        amount: parsedAmount,
        currency,
        date,
        flow,
        notes: notes.trim() || undefined,
      })

      toast.success("Planned event added to calendar")
      onOpenChange(false)
      setTitle("")
      setAmount("")
      setNotes("")
    } catch (err: any) {
      toast.error(err.message || "Failed to add planned event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Planned Event</DialogTitle>
          <DialogDescription>
            Pencil in a one-off upcoming expense or income to simulate its impact on your cash flow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Title</label>
            <Input
              placeholder="e.g. Flight Tickets, Freelance Bonus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Type</label>
              <Select value={flow} onValueChange={(val: "inflow" | "outflow") => setFlow(val)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="outflow">Expense (Outflow)</SelectItem>
                  <SelectItem value="inflow">Income (Inflow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Amount ({currency})</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Notes (Optional)</label>
            <Textarea
              placeholder="Add details, link, or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl font-bold cursor-pointer"
            >
              {loading ? "Saving..." : "Add to Calendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/calendar/calendar-header.tsx components/calendar/calendar-metrics-row.tsx components/calendar/plan-event-dialog.tsx
git commit -m "feat(calendar): implement header, metrics row, and plan dialog components"
```

---

### Task 6: Month Grid & Day Details Sheet

**Files:**
- Create: `components/calendar/calendar-month-grid.tsx`
- Create: `components/calendar/calendar-day-sheet.tsx`

**Interfaces:**
- Consumes: `CalendarDaySummary`, `CalendarEventItem`, `Sheet`, `formatCurrency`, `deleteCalendarPlanAction`
- Produces: `CalendarMonthGrid`, `CalendarDaySheet`

- [ ] **Step 1: Create `components/calendar/calendar-day-sheet.tsx`**

```tsx
"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  CalendarDaySummary,
  CalendarEventItem,
} from "@/types"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  Plus,
  AlertCircle,
  Receipt,
  Repeat,
  Sparkles,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import { deleteCalendarPlanAction } from "@/lib/actions/calendar"

interface CalendarDaySheetProps {
  day: CalendarDaySummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  onAddPlanForDate: (date: string) => void
}

function getEventIcon(type: CalendarEventItem["type"]) {
  switch (type) {
    case "bill":
      return Receipt
    case "subscription":
    case "recurring":
      return Repeat
    case "plan":
      return Sparkles
    case "loan":
      return CreditCard
    default:
      return Receipt
  }
}

export function CalendarDaySheet({
  day,
  open,
  onOpenChange,
  currency,
  onAddPlanForDate,
}: CalendarDaySheetProps) {
  if (!day) return null

  const dateObj = parseISO(day.date)
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy")

  const handleDeletePlan = async (id: string) => {
    try {
      await deleteCalendarPlanAction(id)
      toast.success("Planned event removed")
    } catch {
      toast.error("Failed to delete event")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-lg font-bold">{formattedDate}</SheetTitle>
            {day.isToday && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                Today
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs mt-1">
            Projected End-of-Day Balance:{" "}
            <span
              className={
                day.isDeficit
                  ? "font-extrabold text-rose-500"
                  : "font-extrabold text-foreground"
              }
            >
              {formatCurrency(day.closingBalance, currency)}
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* Day Flow Banner */}
        <div className="grid grid-cols-2 gap-2 p-4 bg-muted/40 border-b border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Total Inflow
            </span>
            <span className="text-emerald-500 font-extrabold text-sm">
              +{formatCurrency(day.totalInflow, currency)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Total Outflow
            </span>
            <span className="text-rose-500 font-extrabold text-sm">
              -{formatCurrency(day.totalOutflow, currency)}
            </span>
          </div>
        </div>

        {/* Events Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {day.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground">
              <CheckCircle2 className="size-8 stroke-[1.5] mb-2 opacity-50 text-emerald-500" />
              <p className="text-xs font-semibold">No scheduled commitments</p>
              <p className="text-[11px] mt-0.5">Your cash flow is steady on this day.</p>
            </div>
          ) : (
            day.events.map((evt) => {
              const Icon = getEventIcon(evt.type)
              const isInflow = evt.flow === "inflow"

              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={
                        isInflow
                          ? "size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
                          : "size-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"
                      }
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-foreground">
                        {evt.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="capitalize">{evt.type}</span>
                        {evt.walletName && <span>• {evt.walletName}</span>}
                        {evt.status === "overdue" && (
                          <span className="text-rose-500 font-bold flex items-center gap-0.5">
                            <AlertCircle className="size-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={
                        isInflow
                          ? "text-xs font-black text-emerald-500"
                          : "text-xs font-black text-rose-500"
                      }
                    >
                      {isInflow ? "+" : "-"}
                      {formatCurrency(evt.convertedAmount, currency)}
                    </span>

                    {evt.type === "plan" && evt.sourceId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePlan(evt.sourceId!)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 cursor-pointer"
                        title="Delete planned event"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-card flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddPlanForDate(day.date)}
            className="w-full rounded-xl font-bold text-xs gap-1.5 h-9 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Add Planned Event on this Day
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Create `components/calendar/calendar-month-grid.tsx`**

```tsx
"use client"

import React from "react"
import { CalendarDaySummary, CalendarEventItem } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface CalendarMonthGridProps {
  days: CalendarDaySummary[]
  currency: string
  onSelectDay: (day: CalendarDaySummary) => void
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarMonthGrid({ days, currency, onSelectDay }: CalendarMonthGridProps) {
  return (
    <div className="flex flex-col w-full rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/40 text-center py-2.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {w}
          </div>
        ))}
      </div>

      {/* 7-Col Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/40">
        {days.map((day) => {
          const visibleEvents = day.events.slice(0, 3)
          const overflowCount = Math.max(0, day.events.length - 3)

          return (
            <div
              key={day.date}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[100px] p-2 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-muted/30 relative",
                !day.isCurrentMonth && "bg-muted/10 opacity-40",
                day.isToday && "ring-2 ring-primary/40 bg-primary/[0.02]",
                day.isDeficit && "bg-rose-500/[0.03]"
              )}
            >
              {/* Day Header: Day Number & Projected Balance */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "text-xs font-bold size-6 flex items-center justify-center rounded-full transition-colors",
                    day.isToday
                      ? "bg-primary text-primary-foreground font-black"
                      : "text-foreground group-hover:text-primary"
                  )}
                >
                  {day.dayOfMonth}
                </span>

                <span
                  className={cn(
                    "text-[10px] font-black tabular-nums truncate",
                    day.isDeficit
                      ? "text-rose-500 flex items-center gap-0.5"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {day.isDeficit && <AlertCircle className="size-2.5 shrink-0" />}
                  {formatCurrency(day.closingBalance, currency)}
                </span>
              </div>

              {/* Event Badges Feed */}
              <div className="flex flex-col gap-1 my-1.5 flex-1 justify-start">
                {visibleEvents.map((evt) => {
                  const isInflow = evt.flow === "inflow"

                  return (
                    <div
                      key={evt.id}
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate flex items-center justify-between gap-1",
                        isInflow
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      )}
                    >
                      <span className="truncate">{evt.title}</span>
                      <span className="font-bold shrink-0 tabular-nums">
                        {isInflow ? "+" : "-"}{formatCurrency(evt.convertedAmount, currency)}
                      </span>
                    </div>
                  )
                })}

                {overflowCount > 0 && (
                  <span className="text-[9px] font-bold text-muted-foreground px-1">
                    +{overflowCount} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/calendar/calendar-month-grid.tsx components/calendar/calendar-day-sheet.tsx
git commit -m "feat(calendar): implement month grid and day details sheet"
```

---

### Task 7: Agenda List & Main Client Controller

**Files:**
- Create: `components/calendar/calendar-agenda-list.tsx`
- Create: `components/calendar/calendar-client.tsx`

**Interfaces:**
- Consumes: `CashFlowMonthOverview`, `CalendarHeader`, `CalendarMetricsRow`, `CalendarMonthGrid`, `CalendarDaySheet`, `PlanEventDialog`
- Produces: `CalendarAgendaList`, `CalendarClient`

- [ ] **Step 1: Create `components/calendar/calendar-agenda-list.tsx`**

```tsx
"use client"

import React from "react"
import { CalendarDaySummary } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { AlertCircle, ChevronRight } from "lucide-react"

interface CalendarAgendaListProps {
  days: CalendarDaySummary[]
  currency: string
  onSelectDay: (day: CalendarDaySummary) => void
}

export function CalendarAgendaList({ days, currency, onSelectDay }: CalendarAgendaListProps) {
  // Only show days that have events or are today
  const activeDays = days.filter((d) => d.events.length > 0 || d.isToday)

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/50 bg-card">
        <p className="text-sm font-semibold text-foreground">No events scheduled this month</p>
        <p className="text-xs text-muted-foreground mt-1">Use "+ Add Planned" to simulate future expenses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {activeDays.map((day) => {
        const dateObj = parseISO(day.date)
        const dateHeader = format(dateObj, "EEE, MMM d")

        return (
          <div
            key={day.date}
            onClick={() => onSelectDay(day)}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all cursor-pointer gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  day.isToday
                    ? "size-10 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0 font-extrabold text-xs"
                    : "size-10 rounded-xl bg-muted text-foreground flex flex-col items-center justify-center shrink-0 font-bold text-xs"
                }
              >
                <span>{day.dayOfMonth}</span>
              </div>

              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  {dateHeader}
                  {day.isToday && (
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.2 rounded-md font-bold">
                      Today
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {day.events.length} {day.events.length === 1 ? "event" : "events"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Projected Balance
                </div>
                <div
                  className={
                    day.isDeficit
                      ? "text-xs font-black text-rose-500 flex items-center gap-0.5 justify-end"
                      : "text-xs font-black text-foreground"
                  }
                >
                  {day.isDeficit && <AlertCircle className="size-3" />}
                  {formatCurrency(day.closingBalance, currency)}
                </div>
              </div>

              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/calendar/calendar-client.tsx`**

```tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { CashFlowMonthOverview, CalendarDaySummary } from "@/types"
import { CalendarHeader } from "./calendar-header"
import { CalendarMetricsRow } from "./calendar-metrics-row"
import { CalendarMonthGrid } from "./calendar-month-grid"
import { CalendarAgendaList } from "./calendar-agenda-list"
import { CalendarDaySheet } from "./calendar-day-sheet"
import { PlanEventDialog } from "./plan-event-dialog"

interface CalendarClientProps {
  data: CashFlowMonthOverview
}

export function CalendarClient({ data }: CalendarClientProps) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<CalendarDaySummary | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [addPlanDefaultDate, setAddPlanDefaultDate] = useState<string | undefined>(undefined)
  const [walletMode, setWalletMode] = useState<"liquid" | "all">("liquid")
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid")

  const handleMonthChange = (newMonth: string) => {
    router.push(`/calendar?month=${newMonth}&mode=${walletMode}`)
  }

  const handleWalletModeChange = (newMode: "liquid" | "all") => {
    setWalletMode(newMode)
    router.push(`/calendar?month=${data.month}&mode=${newMode}`)
  }

  const handleSelectDay = (day: CalendarDaySummary) => {
    setSelectedDay(day)
    setIsSheetOpen(true)
  }

  const handleAddPlanForDate = (date: string) => {
    setAddPlanDefaultDate(date)
    setIsAddPlanOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Header & Navigator */}
      <CalendarHeader
        currentMonth={data.month}
        onMonthChange={handleMonthChange}
        walletMode={walletMode}
        onWalletModeChange={handleWalletModeChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddPlan={() => {
          setAddPlanDefaultDate(undefined)
          setIsAddPlanOpen(true)
        }}
        currency={data.targetCurrency}
      />

      {/* 2. Top Bento Metrics Row */}
      <CalendarMetricsRow overview={data} />

      {/* 3. Main Calendar Body: Month Grid or Agenda List */}
      {viewMode === "grid" ? (
        <CalendarMonthGrid
          days={data.days}
          currency={data.targetCurrency}
          onSelectDay={handleSelectDay}
        />
      ) : (
        <CalendarAgendaList
          days={data.days}
          currency={data.targetCurrency}
          onSelectDay={handleSelectDay}
        />
      )}

      {/* 4. Day Details Sheet */}
      <CalendarDaySheet
        day={selectedDay}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        currency={data.targetCurrency}
        onAddPlanForDate={handleAddPlanForDate}
      />

      {/* 5. Add Planned Event Dialog */}
      <PlanEventDialog
        open={isAddPlanOpen}
        onOpenChange={setIsAddPlanOpen}
        defaultDate={addPlanDefaultDate}
        currency={data.targetCurrency}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/calendar/calendar-agenda-list.tsx components/calendar/calendar-client.tsx
git commit -m "feat(calendar): implement agenda list and main client controller"
```

---

### Task 8: Route Setup, Loading Skeleton, Error Boundary & Sidebar Navigation

**Files:**
- Create: `app/(dashboard)/calendar/page.tsx`
- Create: `app/(dashboard)/calendar/loading.tsx`
- Create: `app/(dashboard)/calendar/error.tsx`
- Modify: `components/layout/dashboard-sidebar.tsx`

**Interfaces:**
- Consumes: `requireApprovedUser`, `getCashFlowCalendarData`, `serializeData`, `CalendarClient`
- Produces: `/calendar` dashboard route

- [ ] **Step 1: Create `app/(dashboard)/calendar/loading.tsx`**

```tsx
import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-5 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-12 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="flex flex-wrap gap-4 w-full">
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-20 flex-1 min-w-[200px] rounded-2xl" />
      </div>

      {/* Month Grid Skeleton */}
      <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(dashboard)/calendar/error.tsx`**

```tsx
"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Calendar error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/50 bg-card">
      <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Failed to load Cash Flow Calendar</h2>
      <p className="text-xs text-muted-foreground mt-1 max-w-md">
        An unexpected error occurred while projecting your cash flow.
      </p>
      <Button
        onClick={() => reset()}
        variant="outline"
        className="rounded-xl font-bold text-xs mt-4 cursor-pointer"
      >
        Try Again
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(dashboard)/calendar/page.tsx`**

```tsx
import { Suspense } from "react"
import type { Metadata } from "next"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getCashFlowCalendarData } from "@/lib/queries/cash-flow-calendar"
import { CalendarClient } from "@/components/calendar/calendar-client"
import { serializeData } from "@/lib/utils"
import CalendarLoading from "./loading"

export const metadata: Metadata = {
  title: "Cash Flow Calendar",
  description: "Visualize your day-by-day cash balance trajectory, upcoming bills, subscriptions, and liquidity.",
}

interface CalendarPageProps {
  searchParams: Promise<{
    month?: string
    mode?: "liquid" | "all"
  }>
}

async function CalendarPageContent({ searchParams }: CalendarPageProps) {
  const session = await requireApprovedUser()
  const { month, mode } = await searchParams

  const data = await getCashFlowCalendarData(session.user.id, {
    month,
    mode,
  })

  const serialized = serializeData(data)
  return <CalendarClient data={serialized} />
}

export default async function CalendarPage(props: CalendarPageProps) {
  return (
    <Suspense fallback={<CalendarLoading />}>
      <CalendarPageContent {...props} />
    </Suspense>
  )
}
```

- [ ] **Step 4: Update `components/layout/dashboard-sidebar.tsx` with Calendar Item**

Add `{ title: "Calendar", href: "/calendar", icon: CalendarDays }` to `NAV_ITEMS` in `components/layout/dashboard-sidebar.tsx` (right after Planner).

- [ ] **Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/calendar/ components/layout/dashboard-sidebar.tsx
git commit -m "feat(calendar): add page route, loading skeleton, error boundary, and sidebar item"
```

---

### Task 9: End-to-End Verification & Roadmap Finalization

**Files:**
- Modify: `docs/superpowers/plans/dime-features-roadmap.md`

- [ ] **Step 1: Run automated unit tests**

Run: `npx tsx --test lib/calculations/__tests__/cash-flow-calendar.test.ts`  
Expected: PASS (all 4 tests passing).

- [ ] **Step 2: Run all calculation tests across the project**

Run: `npx tsx --test lib/calculations/__tests__/insights.test.ts`  
Expected: PASS (all 30 tests passing).

- [ ] **Step 3: Run strict TypeScript typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS with zero errors.

- [ ] **Step 4: Mark Feature #10 Completed in Roadmap**

Update `docs/superpowers/plans/dime-features-roadmap.md` to mark **#10. Cash Flow Calendar** as `✅ COMPLETED` with detailed completed notes.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/dime-features-roadmap.md
git commit -m "docs: mark Feature #10 Cash Flow Calendar as completed in roadmap"
```
