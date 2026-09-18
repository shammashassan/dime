import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  getQuarterMonths,
  getQuarterDateRange,
  getAnnualDateRange,
  getPreviousQuarter,
  formatShortMonthLabel,
  aggregatePeriodMetrics,
  aggregateCategoryBreakdown,
  buildMonthlyBreakdown,
  buildQuarterlyBreakdown,
  generateDeterministicPeriodBrief,
} from "../annual-review"
import type { Transaction, Category } from "@/types"
import { ObjectId } from "mongodb"

describe("Annual & Quarterly Financial Review Calculation Engine", () => {
  const rates: Record<string, number> = { USD: 1, EUR: 0.9, INR: 83 }

  function makeTransaction(data: Partial<Transaction>): Transaction {
    return {
      _id: new ObjectId(),
      userId: "user_1",
      walletId: "w1",
      amount: 1000,
      currency: "USD",
      type: "expense",
      description: "Sample",
      tags: [],
      isRecurring: false,
      date: new Date("2026-08-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    } as Transaction
  }

  describe("1. Date & Quarter Helpers", () => {
    it("returns correct months for quarters", () => {
      assert.deepStrictEqual(getQuarterMonths(2026, 1), ["2026-01", "2026-02", "2026-03"])
      assert.deepStrictEqual(getQuarterMonths(2026, 3), ["2026-07", "2026-08", "2026-09"])
      assert.deepStrictEqual(getQuarterMonths(2026, 4), ["2026-10", "2026-11", "2026-12"])
    })

    it("calculates quarter date ranges", () => {
      const q1 = getQuarterDateRange(2026, 1)
      assert.strictEqual(q1.start.toISOString().slice(0, 10), "2026-01-01")
      assert.strictEqual(q1.end.toISOString().slice(0, 10), "2026-03-31")

      const q4 = getQuarterDateRange(2026, 4)
      assert.strictEqual(q4.start.toISOString().slice(0, 10), "2026-10-01")
      assert.strictEqual(q4.end.toISOString().slice(0, 10), "2026-12-31")
    })

    it("calculates annual date range", () => {
      const annual = getAnnualDateRange(2026)
      assert.strictEqual(annual.start.toISOString().slice(0, 10), "2026-01-01")
      assert.strictEqual(annual.end.toISOString().slice(0, 10), "2026-12-31")
    })

    it("calculates previous quarter correctly", () => {
      assert.deepStrictEqual(getPreviousQuarter(2026, 1), { year: 2025, quarter: 4 })
      assert.deepStrictEqual(getPreviousQuarter(2026, 3), { year: 2026, quarter: 2 })
    })

    it("formats short month label", () => {
      assert.strictEqual(formatShortMonthLabel("2026-01"), "Jan")
      assert.strictEqual(formatShortMonthLabel("2026-12"), "Dec")
    })
  })

  describe("2. aggregatePeriodMetrics", () => {
    it("aggregates inflows, outflows, and savings rate correctly", () => {
      const txs = [
        makeTransaction({ amount: 600000, type: "income" }), // $6,000
        makeTransaction({ amount: 400000, type: "expense" }), // $4,000
        makeTransaction({ amount: 100000, type: "transfer", transferType: "credit" }), // $1,000 inflow
      ]

      const metrics = aggregatePeriodMetrics({
        transactions: txs,
        targetCurrency: "USD",
        exchangeRates: rates,
        openingNetWorthCents: 5000000,
        closingNetWorthCents: 5300000,
      })

      assert.strictEqual(metrics.totalIncomeCents, 700000)
      assert.strictEqual(metrics.totalExpenseCents, 400000)
      assert.strictEqual(metrics.netSavingsCents, 300000)
      assert.strictEqual(metrics.savingsRatePercentage, 43) // 300k / 700k = 42.8% -> 43%
      assert.strictEqual(metrics.netWorthDeltaCents, 300000)
    })
  })

  describe("3. aggregateCategoryBreakdown", () => {
    const cat1Id = new ObjectId()
    const cat2Id = new ObjectId()
    const categories: Category[] = [
      { _id: cat1Id, name: "Groceries", color: "#10b981", icon: "cart" } as any,
      { _id: cat2Id, name: "Rent", color: "#3b82f6", icon: "home" } as any,
    ]

    it("computes category percentages and period-over-period shift", () => {
      const current = [
        makeTransaction({ categoryId: cat1Id.toString(), amount: 30000, type: "expense" }),
        makeTransaction({ categoryId: cat2Id.toString(), amount: 70000, type: "expense" }),
      ]
      const previous = [
        makeTransaction({ categoryId: cat1Id.toString(), amount: 20000, type: "expense" }),
        makeTransaction({ categoryId: cat2Id.toString(), amount: 70000, type: "expense" }),
      ]

      const breakdown = aggregateCategoryBreakdown({
        currentTransactions: current,
        previousTransactions: previous,
        categories,
        targetCurrency: "USD",
        exchangeRates: rates,
      })

      assert.strictEqual(breakdown.length, 2)
      assert.strictEqual(breakdown[0].categoryName, "Rent")
      assert.strictEqual(breakdown[0].percentage, 70)
      assert.strictEqual(breakdown[0].deltaPercentage, 0)

      assert.strictEqual(breakdown[1].categoryName, "Groceries")
      assert.strictEqual(breakdown[1].percentage, 30)
      assert.strictEqual(breakdown[1].deltaPercentage, 50) // (30k - 20k) / 20k = +50%
    })
  })

  describe("4. buildMonthlyBreakdown & buildQuarterlyBreakdown", () => {
    it("groups transactions by month and quarterly rollup", () => {
      const months = ["2026-01", "2026-02", "2026-03"]
      const txs = [
        makeTransaction({ date: new Date("2026-01-15"), amount: 50000, type: "income" }),
        makeTransaction({ date: new Date("2026-01-20"), amount: 20000, type: "expense" }),
        makeTransaction({ date: new Date("2026-02-10"), amount: 60000, type: "income" }),
        makeTransaction({ date: new Date("2026-02-15"), amount: 30000, type: "expense" }),
      ]

      const monthly = buildMonthlyBreakdown({
        transactions: txs,
        months,
        targetCurrency: "USD",
        exchangeRates: rates,
      })

      assert.strictEqual(monthly.length, 3)
      assert.strictEqual(monthly[0].monthLabel, "Jan")
      assert.strictEqual(monthly[0].incomeCents, 50000)
      assert.strictEqual(monthly[0].expenseCents, 20000)
      assert.strictEqual(monthly[0].netSavingsCents, 30000)

      assert.strictEqual(monthly[1].monthLabel, "Feb")
      assert.strictEqual(monthly[1].incomeCents, 60000)
      assert.strictEqual(monthly[1].expenseCents, 30000)

      assert.strictEqual(monthly[2].monthLabel, "Mar")
      assert.strictEqual(monthly[2].incomeCents, 0)
      assert.strictEqual(monthly[2].expenseCents, 0)

      const quarterly = buildQuarterlyBreakdown(monthly)
      assert.strictEqual(quarterly.length, 4)
      assert.strictEqual(quarterly[0].label, "Q1")
      assert.strictEqual(quarterly[0].incomeCents, 110000)
      assert.strictEqual(quarterly[0].expenseCents, 50000)
      assert.strictEqual(quarterly[0].netSavingsCents, 60000)
    })
  })

  describe("5. generateDeterministicPeriodBrief", () => {
    it("generates structured brief with highlights and recommendations", () => {
      const brief = generateDeterministicPeriodBrief({
        metrics: {
          totalIncomeCents: 1000000,
          totalExpenseCents: 600000,
          netSavingsCents: 400000,
          savingsRatePercentage: 40,
          netWorthOpeningCents: 2000000,
          netWorthClosingCents: 2400000,
          netWorthDeltaCents: 400000,
        },
        topCategories: [{ categoryId: "c1", categoryName: "Housing", amountCents: 300000, percentage: 50, previousPeriodAmountCents: 250000, deltaPercentage: 20 }],
        periodLabel: "Q3 2026",
        previousMetrics: {
          totalIncomeCents: 900000,
          totalExpenseCents: 650000,
          netSavingsCents: 250000,
          savingsRatePercentage: 28,
          netWorthOpeningCents: 1750000,
          netWorthClosingCents: 2000000,
          netWorthDeltaCents: 250000,
        },
        targetCurrency: "USD",
      })

      assert.ok(brief.headline.includes("40%"))
      assert.ok(brief.summary.includes("Q3 2026"))
      assert.ok(brief.highlights.length > 0)
      assert.ok(brief.recommendations.length > 0)
      assert.strictEqual(brief.isAiGenerated, false)
    })
  })
})
