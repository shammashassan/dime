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
  createCurrencyConverter,
  calculateCashFlowCalendar,
  generateCalendarGridDays,
  projectRecurringOccurrences,
  // @ts-expect-error -- Node ESM test runner requires .ts extension
} from "../cash-flow-calendar.ts"

describe("Cash Flow Calendar Calculation Engine", () => {
  const mockCategories: Category[] = [
    {
      _id: new ObjectId(),
      userId: "u1",
      name: "Income",
      type: ["income"],
      icon: "briefcase",
      color: "#10b981",
      isDefault: true,
      createdAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "u1",
      name: "Housing",
      type: ["expense"],
      icon: "home",
      color: "#6366f1",
      isDefault: false,
      createdAt: new Date(),
    },
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
    const rule: RecurringRule & { interval?: number; nextOccurrence?: Date } = {
      _id: new ObjectId(),
      userId: "u1",
      walletId: mockWallets[0]._id.toString(),
      categoryId: "cat_housing",
      type: "expense",
      amount: 1500, // $15.00
      currency: "USD",
      description: "Netflix",
      frequency: "monthly",
      interval: 1,
      startDate: new Date("2026-01-15T00:00:00Z"),
      nextDueDate: new Date("2026-10-15T00:00:00Z"),
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

    const bigBill: BillInstance & { name?: string; amount?: number; isPaid?: boolean } = {
      _id: new ObjectId(),
      userId: "u1",
      ruleId: "rule_rent",
      description: "Rent",
      name: "Rent",
      amount: 120000, // $1,200.00
      expectedAmount: 120000,
      currency: "USD",
      dueDate: new Date("2026-10-18T12:00:00Z"),
      isPaid: false,
      status: "upcoming" as any,
      version: 1,
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

  it("5. createCurrencyConverter handles same currency, valid rate, zero, and missing rates", () => {
    const converter = createCurrencyConverter("USD", { EUR: 0.8, GBP: 0.0, JPY: NaN })
    // Same currency
    assert.strictEqual(converter(1000, "USD"), 1000)
    assert.strictEqual(converter(1000), 1000)
    // Rate conversion: EUR 800 at 0.8 => 1000 USD
    assert.strictEqual(converter(800, "EUR"), 1000)
    // Zero rate protection: fallback to original amount without division by zero
    assert.strictEqual(converter(500, "GBP"), 500)
    // NaN rate protection: fallback to original amount
    assert.strictEqual(converter(500, "JPY"), 500)
    // Unlisted currency: fallback to original amount
    assert.strictEqual(converter(500, "CAD"), 500)
    // Zero or invalid amount
    assert.strictEqual(converter(0, "EUR"), 0)
    assert.strictEqual(converter(NaN, "EUR"), 0)
  })

  it("6. correctly handles mode='all' deducting credit card liabilities", () => {
    const result = calculateCashFlowCalendar({
      targetMonth: "2026-10",
      todayDate: "2026-10-15",
      wallets: mockWallets, // Checking: 500,000, Credit Card: 100,000
      transactions: [],
      recurringRules: [],
      bills: [],
      loans: [],
      repayments: [],
      plans: [],
      categories: mockCategories,
      targetCurrency: "USD",
      exchangeRates: { USD: 1.0 },
      mode: "all",
      safetyBufferCents: 0,
    })

    // Mode 'all': baseline cash is 500,000 - 100,000 = 400,000
    const today = result.days.find((d) => d.date === "2026-10-15")
    assert.ok(today)
    assert.strictEqual(today?.closingBalance, 400000)
  })

  it("7. projects recurring rules with weekly and biweekly frequencies", () => {
    const weeklyRule: RecurringRule & { interval?: number; nextOccurrence?: Date } = {
      _id: new ObjectId(),
      userId: "u1",
      walletId: mockWallets[0]._id.toString(),
      categoryId: "cat_inc",
      type: "income",
      amount: 10000, // $100.00
      currency: "USD",
      description: "Weekly Tutoring",
      frequency: "weekly",
      interval: 1,
      startDate: new Date("2026-10-01T12:00:00Z"),
      nextDueDate: new Date("2026-10-01T12:00:00Z"),
      nextOccurrence: new Date("2026-10-01T12:00:00Z"),
      isActive: true,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const occurrences = projectRecurringOccurrences(weeklyRule, "2026-10-01", "2026-10-31")
    // October 2026: 1st, 8th, 15th, 22nd, 29th -> 5 occurrences
    assert.strictEqual(occurrences.length, 5)
    assert.strictEqual(occurrences[0].flow, "inflow")
  })
})
