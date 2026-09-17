import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import {
  convertAmount,
  formatCurrency,
  analyzeEmergencyFund,
  analyzeDebtPayoff,
  analyzeGoalAcceleration,
  analyzeSubscriptionTrimming,
  analyzeBudgetTuning,
  synthesizeCoachStrategies,
  generateDeterministicBriefing,
  generateCoachChatAnswer,
} from "../coach"
import type {
  Wallet,
  Transaction,
  Goal,
  Loan,
  LoanRepayment,
} from "@/types"
import { ObjectId } from "mongodb"

describe("AI Financial Coach Calculation Engine", () => {
  const refDate = new Date("2026-09-15T12:00:00Z")

  // Mock wallets
  const mockWallets: Wallet[] = [
    {
      _id: new ObjectId(),
      userId: "user_1",
      name: "Checking",
      type: "bank",
      balance: 450000, // $4,500
      currency: "USD",
      color: "#6366f1",
      icon: "wallet",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "user_1",
      name: "Savings",
      type: "savings",
      balance: 600000, // $6,000
      currency: "USD",
      color: "#10b981",
      icon: "piggy-bank",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "user_1",
      name: "Archived Old",
      type: "savings",
      balance: 999999,
      currency: "USD",
      color: "#f59e0b",
      icon: "archive",
      isArchived: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  // Mock transactions
  const mockTransactions: Transaction[] = [
    {
      _id: new ObjectId(),
      userId: "user_1",
      walletId: "w1",
      type: "expense",
      amount: 200000, // $2,000
      currency: "USD",
      description: "Rent",
      date: new Date("2026-08-25T12:00:00Z"),
      categoryId: "cat_living",
      tags: [],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "user_1",
      walletId: "w1",
      type: "expense",
      amount: 250000, // $2,500
      currency: "USD",
      description: "Groceries & Utilities",
      date: new Date("2026-07-20T12:00:00Z"),
      categoryId: "cat_living",
      tags: [],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "user_1",
      walletId: "w1",
      type: "expense",
      amount: 150000, // $1,500
      currency: "USD",
      description: "Healthcare",
      date: new Date("2026-07-01T12:00:00Z"),
      categoryId: "cat_living",
      tags: [],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: "user_1",
      walletId: "w1",
      type: "income",
      amount: 500000,
      currency: "USD",
      description: "Salary",
      date: new Date("2026-08-01T12:00:00Z"),
      tags: [],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  describe("1. Currency Helpers", () => {
    it("converts amount with rates", () => {
      const rates = { EUR: 0.9, USD: 1 }
      const converted = convertAmount(10000, "USD", "EUR", rates)
      assert.equal(converted, 9000)
    })

    it("formats currency without decimals", () => {
      const formatted = formatCurrency(125000, "USD")
      assert.ok(formatted.includes("1,250"))
    })
  })

  describe("2. analyzeEmergencyFund", () => {
    it("calculates liquid savings and monthly burn rate accurately", () => {
      const result = analyzeEmergencyFund({
        wallets: mockWallets,
        transactions: mockTransactions,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: refDate,
      })

      // Liquid = 450000 + 600000 = 1,050,000 cents ($10,500)
      assert.equal(result.liquidSavingsCents, 1050000)
      // Total 90-day expense = 200000 + 250000 + 150000 = 600,000 cents ($6,000)
      // Monthly burn = 600,000 / 3 = 200,000 cents ($2,000)
      assert.equal(result.monthlyBurnRateCents, 200000)
      // Runway = 1,050,000 / 200,000 = 5.25 -> 5.3
      assert.ok(result.currentRunwayMonths >= 5.2 && result.currentRunwayMonths <= 5.3)
      assert.equal(result.healthTier, "adequate")
      // Target 6 months = 1,200,000 cents -> shortfall = 150,000 cents ($1,500)
      assert.equal(result.shortfallCents, 150000)
    })

    it("handles zero burn rate gracefully without division by zero", () => {
      const result = analyzeEmergencyFund({
        wallets: mockWallets,
        transactions: [],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: refDate,
      })

      assert.equal(result.monthlyBurnRateCents, 0)
      assert.equal(result.currentRunwayMonths, 12)
      assert.equal(result.healthTier, "exceptional")
      assert.equal(result.shortfallCents, 0)
    })
  })

  describe("3. analyzeDebtPayoff", () => {
    const loan1Id = new ObjectId()
    const loan2Id = new ObjectId()

    const mockLoans: Loan[] = [
      {
        _id: loan1Id,
        userId: "user_1",
        organizationId: null,
        contactId: "c1",
        type: "borrowed",
        personName: "Consolidation Lender",
        amount: 500000, // $5,000
        currency: "USD",
        interestRate: 15,
        status: "active",
        walletId: "w1",
        transactionId: "t1",
        date: new Date(),
        remainingAmount: 400000, // $4,000 remaining
        reminderSchedule: [],
        sentReminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      {
        _id: loan2Id,
        userId: "user_1",
        organizationId: null,
        contactId: "c2",
        type: "borrowed",
        personName: "Auto Finance",
        amount: 1500000, // $15,000
        currency: "USD",
        interestRate: 6,
        status: "active",
        walletId: "w1",
        transactionId: "t2",
        date: new Date(),
        remainingAmount: 1500000,
        reminderSchedule: [],
        sentReminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]

    const mockRepayments: LoanRepayment[] = [
      {
        _id: new ObjectId(),
        loanId: loan1Id.toString(),
        transactionId: "tx1",
        amount: 100000,
        date: new Date(),
        createdAt: new Date(),
      },
    ]

    it("returns null when no borrowed active loans exist", () => {
      const res = analyzeDebtPayoff({
        loans: [],
        repayments: [],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
      })
      assert.equal(res, null)
    })

    it("calculates snowball priority and accelerated payoff timeline", () => {
      const res = analyzeDebtPayoff({
        loans: mockLoans,
        repayments: mockRepayments,
        extraMonthlyPaymentCents: 10000, // +$100
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
      })

      assert.ok(res !== null)
      assert.equal(res.totalDebtCents, 1900000)
      assert.equal(res.activeLoanCount, 2)
      assert.equal(res.snowballPriorityLoan?.loanId, loan1Id.toString())
      assert.equal(res.snowballPriorityLoan?.balanceCents, 400000)
      assert.ok(res.acceleratedPayoffMonths <= res.currentPayoffMonths)
      assert.ok(res.monthsSaved >= 0)
    })
  })

  describe("4. analyzeGoalAcceleration", () => {
    it("identifies behind schedule goals and computes required boost", () => {
      const mockGoals: Goal[] = [
        {
          _id: new ObjectId(),
          userId: "user_1",
          name: "Down Payment",
          targetAmount: 2000000, // $20,000
          currentAmount: 200000, // $2,000
          currency: "USD",
          targetDate: new Date("2026-12-31T00:00:00Z"),
          color: "#6366f1",
          icon: "target",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const items = analyzeGoalAcceleration({
        goals: mockGoals,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: refDate,
      })

      assert.equal(items.length, 1)
      assert.equal(items[0].status, "behind")
      assert.ok(items[0].suggestedMonthlyBoostCents > 0)
      assert.ok(items[0].requiredMonthlyCents > 0)
    })
  })

  describe("5. synthesizeCoachStrategies", () => {
    it("scores and prioritizes high impact strategies", () => {
      const emergency = analyzeEmergencyFund({
        wallets: mockWallets,
        transactions: mockTransactions,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: refDate,
      })

      const strategies = synthesizeCoachStrategies({
        emergencyFund: emergency,
        debtComparison: null,
        goalAccelerations: [],
        subscriptionStats: {
          totalMonthlyCents: 15000,
          totalAnnualCents: 180000,
          activeRulesCount: 5,
          highBurdenCount: 1,
        },
        budgetStats: {
          overspentCategoriesCount: 1,
          totalSurplusCents: 30000,
          totalDeficitCents: 10000,
        },
        currency: "USD",
      })

      assert.ok(strategies.length >= 2)
      for (let i = 0; i < strategies.length - 1; i++) {
        assert.ok(strategies[i].score >= strategies[i + 1].score)
      }
    })
  })

  describe("6. Briefing & Q&A Synthesis", () => {
    it("generates instant deterministic briefing with zero API calls", () => {
      const emergency = analyzeEmergencyFund({
        wallets: mockWallets,
        transactions: mockTransactions,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: refDate,
      })

      const brief = generateDeterministicBriefing({
        strategies: [],
        emergencyFund: emergency,
        debtComparison: null,
        currency: "USD",
      })

      assert.equal(brief.isAiGenerated, false)
      assert.ok(brief.headline.length > 0)
      assert.ok(brief.focalAdvice.length > 0)
      assert.equal(brief.keyHighlights.length, 3)
    })

    it("returns deterministic fallback answer for chat when GEMINI_API_KEY is not set", async () => {
      const originalKey = process.env.GEMINI_API_KEY
      delete process.env.GEMINI_API_KEY

      try {
        const answer = await generateCoachChatAnswer({
          question: "How can I pay off my debt faster?",
          context: {
            liquidSavingsCents: 1050000,
            monthlyBurnRateCents: 200000,
            runwayMonths: 5.2,
            totalDebtCents: 500000,
            activeLoansCount: 2,
            activeGoalsCount: 1,
            currency: "USD",
            topStrategies: ["Snowball Debt Freedom"],
          },
        })

        assert.ok(answer.includes("Snowball"))
        assert.ok(answer.includes("5,000"))
      } finally {
        if (originalKey !== undefined) {
          process.env.GEMINI_API_KEY = originalKey
        }
      }
    })
  })
})
