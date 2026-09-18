import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  convertAmount,
  formatCurrency,
  formatMonthLabel,
  calculateMonthlyMetrics,
  calculateCategorySpendBreakdown,
  calculateBudgetPerformance,
  extractTopTransactions,
  calculateGoalAndLoanProgress,
  generateDeterministicReviewBrief,
  generateAiReviewBrief,
} from "../monthly-review"
import type { Transaction, Category, Budget, Goal, Loan, LoanRepayment } from "@/types"
import { ObjectId } from "mongodb"

describe("Monthly Financial Review Calculation Engine", () => {
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

  describe("1. Currency & Month Helpers", () => {
    it("converts amount with exchange rates", () => {
      const converted = convertAmount(10000, "USD", "INR", rates)
      assert.strictEqual(converted, 830000)
    })

    it("formats month label properly", () => {
      assert.strictEqual(formatMonthLabel("2026-08"), "August 2026")
      assert.strictEqual(formatMonthLabel("2026-01"), "January 2026")
    })
  })

  describe("2. calculateMonthlyMetrics", () => {
    const targetTransactions: Transaction[] = [
      makeTransaction({
        amount: 500000, // $5,000 income
        type: "income",
        date: new Date("2026-08-01"),
      }),
      makeTransaction({
        amount: 320000, // $3,200 expense
        type: "expense",
        date: new Date("2026-08-10"),
      }),
    ]

    const baselineTransactions: Transaction[] = [
      makeTransaction({
        amount: 450000, // $4,500 income
        type: "income",
        date: new Date("2026-07-01"),
      }),
      makeTransaction({
        amount: 300000, // $3,000 expense
        type: "expense",
        date: new Date("2026-07-15"),
      }),
    ]

    it("calculates income, expense, and savings rate accurately", () => {
      const metrics = calculateMonthlyMetrics({
        targetTransactions,
        baselineTransactions,
        targetCurrency: "USD",
        exchangeRates: rates,
        openingNetWorthCents: 1000000,
        closingNetWorthCents: 1180000,
      })

      assert.strictEqual(metrics.totalIncomeCents, 500000)
      assert.strictEqual(metrics.totalExpenseCents, 320000)
      assert.strictEqual(metrics.netSavingsCents, 180000)
      assert.strictEqual(metrics.savingsRatePercentage, 36) // 180000 / 500000 = 36%
      assert.strictEqual(metrics.previousMonthIncomeCents, 450000)
      assert.strictEqual(metrics.previousMonthExpenseCents, 300000)
      assert.strictEqual(metrics.incomeDeltaPercentage, 11) // (500000 - 450000) / 450000 = 11%
      assert.strictEqual(metrics.expenseDeltaPercentage, 7) // (320000 - 300000) / 300000 = 7%
      assert.strictEqual(metrics.netWorthDeltaCents, 180000)
    })

    it("handles zero income without division by zero", () => {
      const metrics = calculateMonthlyMetrics({
        targetTransactions: [
          makeTransaction({
            amount: 150000,
            type: "expense",
            date: new Date("2026-08-05"),
          }),
        ],
        baselineTransactions: [],
        targetCurrency: "USD",
        exchangeRates: rates,
        openingNetWorthCents: 500000,
        closingNetWorthCents: 350000,
      })

      assert.strictEqual(metrics.totalIncomeCents, 0)
      assert.strictEqual(metrics.totalExpenseCents, 150000)
      assert.strictEqual(metrics.netSavingsCents, -150000)
      assert.strictEqual(metrics.savingsRatePercentage, 0)
      assert.strictEqual(metrics.netWorthDeltaCents, -150000)
    })
  })

  describe("3. calculateCategorySpendBreakdown", () => {
    const catDining = new ObjectId()
    const catGroceries = new ObjectId()

    const categories: Category[] = [
      {
        _id: catDining,
        userId: "user_1",
        name: "Dining Out",
        color: "#f59e0b",
        icon: "utensils",
        type: ["expense"],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: catGroceries,
        userId: "user_1",
        name: "Groceries",
        color: "#10b981",
        icon: "shopping-cart",
        type: ["expense"],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const targetTxs: Transaction[] = [
      makeTransaction({
        categoryId: catDining.toString(),
        amount: 30000, // $300
        type: "expense",
        date: new Date("2026-08-02"),
      }),
      makeTransaction({
        categoryId: catGroceries.toString(),
        amount: 20000, // $200
        type: "expense",
        date: new Date("2026-08-12"),
      }),
    ]

    const baselineTxs: Transaction[] = [
      makeTransaction({
        categoryId: catDining.toString(),
        amount: 20000, // $200
        type: "expense",
        date: new Date("2026-07-02"),
      }),
    ]

    it("aggregates category spending, shares, and MoM deltas", () => {
      const breakdown = calculateCategorySpendBreakdown({
        targetTransactions: targetTxs,
        baselineTransactions: baselineTxs,
        categories,
        targetCurrency: "USD",
        exchangeRates: rates,
      })

      assert.strictEqual(breakdown.length, 2)
      // Dining Out should be top
      assert.strictEqual(breakdown[0].categoryName, "Dining Out")
      assert.strictEqual(breakdown[0].amountCents, 30000)
      assert.strictEqual(breakdown[0].percentage, 60) // 300 / 500 = 60%
      assert.strictEqual(breakdown[0].deltaPercentage, 50) // (300 - 200) / 200 = 50%

      assert.strictEqual(breakdown[1].categoryName, "Groceries")
      assert.strictEqual(breakdown[1].amountCents, 20000)
      assert.strictEqual(breakdown[1].percentage, 40)
    })
  })

  describe("4. calculateBudgetPerformance", () => {
    const catId = new ObjectId()
    const budgets: Budget[] = [
      {
        _id: new ObjectId(),
        userId: "user_1",
        categoryId: catId.toString(),
        name: "Dining Out",
        amount: 25000, // $250 budget
        currency: "USD",
        period: "monthly",
        startDate: new Date(),
        isActive: true,
        alertThreshold: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it("identifies budget overruns and usage percentage", () => {
      const performance = calculateBudgetPerformance({
        budgets,
        categorySpendList: [
          {
            categoryId: catId.toString(),
            categoryName: "Dining Out",
            amountCents: 30000, // $300 spent
            percentage: 100,
            previousMonthAmountCents: 20000,
            deltaPercentage: 50,
          },
        ],
        targetCurrency: "USD",
        exchangeRates: rates,
      })

      assert.strictEqual(performance.length, 1)
      assert.strictEqual(performance[0].isOverBudget, true)
      assert.strictEqual(performance[0].overrunCents, 5000) // $50 overrun
      assert.strictEqual(performance[0].percentageUsed, 120)
    })
  })

  describe("5. extractTopTransactions", () => {
    it("sorts and extracts top single expenses and incomes", () => {
      const txs: Transaction[] = [
        makeTransaction({
          description: "Flight Tickets",
          amount: 80000,
          type: "expense",
          date: new Date("2026-08-04"),
        }),
        makeTransaction({
          description: "Dinner",
          amount: 12000,
          type: "expense",
          date: new Date("2026-08-06"),
        }),
        makeTransaction({
          description: "Monthly Salary",
          amount: 600000,
          type: "income",
          date: new Date("2026-08-01"),
        }),
      ]

      const top = extractTopTransactions({
        targetTransactions: txs,
        categories: [],
        wallets: [{ _id: "w1", name: "Checking" }],
        targetCurrency: "USD",
        exchangeRates: rates,
      })

      assert.strictEqual(top.topExpenses.length, 2)
      assert.strictEqual(top.topExpenses[0].name, "Flight Tickets")
      assert.strictEqual(top.topIncomes.length, 1)
      assert.strictEqual(top.topIncomes[0].name, "Monthly Salary")
    })
  })

  describe("6. Briefing Synthesis", () => {
    it("generates deterministic review brief instantly with zero API calls", () => {
      const brief = generateDeterministicReviewBrief({
        monthLabel: "August 2026",
        metrics: {
          totalIncomeCents: 500000,
          totalExpenseCents: 320000,
          netSavingsCents: 180000,
          savingsRatePercentage: 36,
          netWorthDeltaCents: 180000,
        },
        categoryBreakdown: [
          {
            categoryId: "c1",
            categoryName: "Dining Out",
            amountCents: 100000,
            percentage: 31,
            previousMonthAmountCents: 70000,
            deltaPercentage: 43,
          },
        ],
        budgetPerformance: [],
        topExpenses: [],
        currency: "USD",
      })

      assert.ok(brief.headline.includes("Exceptional savings velocity"))
      assert.ok(brief.summary.includes("August 2026"))
      assert.ok(brief.highlights.length > 0)
      assert.strictEqual(brief.isAiGenerated, false)
    })

    it("falls back to deterministic brief when GEMINI_API_KEY is not configured", async () => {
      const brief = await generateAiReviewBrief({
        monthLabel: "August 2026",
        metrics: {
          totalIncomeCents: 400000,
          totalExpenseCents: 300000,
          netSavingsCents: 100000,
          savingsRatePercentage: 25,
          netWorthDeltaCents: 100000,
        },
        categoryBreakdown: [],
        budgetPerformance: [],
        topExpenses: [],
        currency: "USD",
      })

      assert.ok(brief.headline)
      assert.strictEqual(brief.isAiGenerated, false)
    })
  })
})
