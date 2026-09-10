import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { ObjectId } from "mongodb"
import type {
  Transaction,
  Category,
  Budget,
  RecurringRule,
  UserInsightState,
} from "@/types"
import {
  normalizeDescription,
  convertAmount,
  detectCategorySpikes,
  detectTransactionOutliers,
  detectSubscriptionCreep,
  detectIncomeIrregularities,
  detectSavingsOpportunities,
  detectCashFlowVelocity,
  calculateSpendingInsights,
  // @ts-expect-error -- Node 22 ESM test runner requires .ts extension
} from "../insights.ts"

const MOCK_DATE = new Date("2026-09-10T12:00:00Z")

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    _id: new ObjectId(),
    userId: "user_1",
    walletId: "wallet_1",
    type: "expense",
    amount: 1000,
    currency: "USD",
    description: "Sample transaction",
    date: MOCK_DATE,
    tags: [],
    isRecurring: false,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    ...overrides,
  }
}

describe("AI Spending Insights Calculation Engine", () => {
  describe("1. normalizeDescription", () => {
    it("lowercases, strips punctuation and non-alphanumeric, and trims", () => {
      assert.equal(normalizeDescription("  Netflix.com/Payment*123 "), "netflixcompayment123")
      assert.equal(normalizeDescription("STARBUCKS #1042!"), "starbucks1042")
      assert.equal(normalizeDescription("Apple.com/Bill - US"), "applecombillus")
    })

    it("handles empty and edge string inputs safely", () => {
      assert.equal(normalizeDescription(""), "")
      assert.equal(normalizeDescription("   "), "")
      assert.equal(normalizeDescription("!@#$%^&*()"), "")
    })
  })

  describe("2. convertAmount", () => {
    it("returns exact amount when fromCurrency matches targetCurrency", () => {
      const rates = { USD: 1, EUR: 0.9, INR: 83 }
      assert.equal(convertAmount(5000, "USD", "USD", rates), 5000)
      assert.equal(convertAmount(5000, "usd", "USD", rates), 5000)
    })

    it("converts amount using exchange rates and rounds to nearest integer", () => {
      const rates = { USD: 1, EUR: 0.92, INR: 83.5 }
      // 1000 EUR to USD = 1000 / 0.92 * 1 = 1087
      assert.equal(convertAmount(1000, "EUR", "USD", rates), Math.round(1000 / 0.92))
      // 8350 INR to USD = 8350 / 83.5 * 1 = 100
      assert.equal(convertAmount(8350, "INR", "USD", rates), 100)
    })

    it("falls back to 1:1 if currency is not in rates", () => {
      const rates = { USD: 1 }
      assert.equal(convertAmount(2500, "XYZ", "USD", rates), 2500)
    })
  })

  describe("3. detectCategorySpikes", () => {
    const diningCategory: Category = {
      _id: new ObjectId(),
      userId: "user_1",
      name: "Dining Out",
      type: ["expense"],
      icon: "Utensils",
      color: "#f59e0b",
      isDefault: false,
      createdAt: MOCK_DATE,
    }

    it("requires baseline average >= 3,000 cents ($30) and baseline count >= 3", () => {
      const catId = diningCategory._id.toString()
      // Only 2 baseline txs: count safeguard fails
      const txsWithLowCount: Transaction[] = [
        makeTx({ categoryId: catId, amount: 5000, date: new Date("2026-08-01") }),
        makeTx({ categoryId: catId, amount: 5000, date: new Date("2026-07-01") }),
        makeTx({ categoryId: catId, amount: 20000, date: new Date("2026-09-05") }),
      ]

      const spikesLowCount = detectCategorySpikes({
        transactions: txsWithLowCount,
        categories: [diningCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })
      assert.equal(spikesLowCount.length, 0)

      // 3 baseline txs but total baseline average < $30
      const txsLowAvg: Transaction[] = [
        makeTx({ categoryId: catId, amount: 500, date: new Date("2026-08-01") }),
        makeTx({ categoryId: catId, amount: 500, date: new Date("2026-07-01") }),
        makeTx({ categoryId: catId, amount: 500, date: new Date("2026-06-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-09-05") }),
      ]
      const spikesLowAvg = detectCategorySpikes({
        transactions: txsLowAvg,
        categories: [diningCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })
      assert.equal(spikesLowAvg.length, 0)
    })

    it("triggers critical spike if ratio >= 1.6 and delta >= 2,500 cents", () => {
      const catId = diningCategory._id.toString()
      // Baseline 3 months: $100/mo (10,000 cents each month)
      const pastTxs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-08-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-07-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-06-01") }),
      ]
      // Current 30d: $170 (17,000 cents) -> 1.7x baseline (70% increase)
      const currentTxs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 17000, date: new Date("2026-09-05") }),
      ]

      const spikes = detectCategorySpikes({
        transactions: [...currentTxs, ...pastTxs],
        categories: [diningCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(spikes.length, 1)
      assert.equal(spikes[0].category, "spikes")
      assert.equal(spikes[0].severity, "critical")
      assert.equal(spikes[0].id, `spike_${catId}_2026_9`)
      assert.match(spikes[0].title, /Dining Out Spending Surge/i)
      assert.match(spikes[0].metricLabel || "", /\+70% vs baseline/)
      assert.equal(spikes[0].metricImpact, 7000)
    })

    it("triggers warning spike if ratio >= 1.25 and < 1.6 with delta >= 2,500 cents", () => {
      const catId = diningCategory._id.toString()
      const pastTxs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-08-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-07-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-06-01") }),
      ]
      // Current 30d: $135 (13,500 cents) -> 1.35x baseline (+35%)
      const currentTxs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 13500, date: new Date("2026-09-05") }),
      ]

      const spikes = detectCategorySpikes({
        transactions: [...currentTxs, ...pastTxs],
        categories: [diningCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(spikes.length, 1)
      assert.equal(spikes[0].severity, "warning")
      assert.match(spikes[0].metricLabel || "", /\+35% vs baseline/)
    })
  })

  describe("4. detectTransactionOutliers", () => {
    const techCategory: Category = {
      _id: new ObjectId(),
      userId: "user_1",
      name: "Technology",
      type: ["expense"],
      icon: "Laptop",
      color: "#3b82f6",
      isDefault: false,
      createdAt: MOCK_DATE,
    }

    it("ignores categories with fewer than 5 historical transactions", () => {
      const catId = techCategory._id.toString()
      const txs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 3000, date: new Date("2026-08-10") }),
        makeTx({ categoryId: catId, amount: 3000, date: new Date("2026-08-15") }),
        makeTx({ categoryId: catId, amount: 3000, date: new Date("2026-08-20") }),
        makeTx({ categoryId: catId, amount: 45000, date: new Date("2026-09-02") }),
      ]

      const outliers = detectTransactionOutliers({
        transactions: txs,
        categories: [techCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(outliers.length, 0)
    })

    it("flags transaction where amount > mean + 2.5 * stdDev and amount >= $50", () => {
      const catId = techCategory._id.toString()
      const txs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 2000, date: new Date("2026-07-05") }),
        makeTx({ categoryId: catId, amount: 2200, date: new Date("2026-07-12") }),
        makeTx({ categoryId: catId, amount: 2100, date: new Date("2026-07-19") }),
        makeTx({ categoryId: catId, amount: 2000, date: new Date("2026-07-26") }),
        makeTx({ categoryId: catId, amount: 2100, date: new Date("2026-08-02") }),
        makeTx({ categoryId: catId, amount: 2000, date: new Date("2026-08-09") }),
        makeTx({ categoryId: catId, amount: 2200, date: new Date("2026-08-16") }),
        makeTx({ categoryId: catId, amount: 2100, date: new Date("2026-08-23") }),
        makeTx({ categoryId: catId, amount: 2000, date: new Date("2026-08-30") }),
        // Outlier in current 30d: $250 (25,000 cents)
        makeTx({
          _id: new ObjectId("650000000000000000000099"),
          categoryId: catId,
          amount: 25000,
          description: "4K Monitor Setup",
          date: new Date("2026-09-03"),
        }),
      ]

      const outliers = detectTransactionOutliers({
        transactions: txs,
        categories: [techCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(outliers.length, 1)
      assert.equal(outliers[0].category, "outliers")
      assert.equal(outliers[0].severity, "warning")
      assert.equal(outliers[0].id, "outlier_650000000000000000000099")
      assert.match(outliers[0].title, /Unusual Expense: 4K Monitor Setup/i)
      assert.equal(outliers[0].actionUrl, "/transactions/650000000000000000000099")
    })

    it("does not flag if outlier amount is under $50 (5,000 cents)", () => {
      const catId = techCategory._id.toString()
      const txs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 100, date: new Date("2026-07-10") }),
        makeTx({ categoryId: catId, amount: 100, date: new Date("2026-07-20") }),
        makeTx({ categoryId: catId, amount: 100, date: new Date("2026-08-05") }),
        makeTx({ categoryId: catId, amount: 100, date: new Date("2026-08-15") }),
        makeTx({ categoryId: catId, amount: 100, date: new Date("2026-08-25") }),
        // Exceeds mean+2.5stdDev but amount is $30 (< $50)
        makeTx({ categoryId: catId, amount: 3000, date: new Date("2026-09-03") }),
      ]

      const outliers = detectTransactionOutliers({
        transactions: txs,
        categories: [techCategory],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(outliers.length, 0)
    })
  })

  describe("5. detectSubscriptionCreep", () => {
    it("detects duplicate charges with identical normalized descriptions and amounts within 5 days", () => {
      const idA = new ObjectId("650000000000000000000001")
      const idB = new ObjectId("650000000000000000000002")
      const txs: Transaction[] = [
        makeTx({
          _id: idA,
          description: "Spotify AB",
          amount: 1199,
          date: new Date("2026-09-01"),
        }),
        makeTx({
          _id: idB,
          description: "Spotify AB*",
          amount: 1199,
          date: new Date("2026-09-04"),
        }),
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
      assert.equal(creeps[0].severity, "critical")
      assert.match(creeps[0].title, /Duplicate Charge Detected/i)
      assert.equal(creeps[0].metricImpact, 1199)
    })

    it("ignores identical charges that are more than 5 days apart", () => {
      const txs: Transaction[] = [
        makeTx({ description: "Spotify AB", amount: 1199, date: new Date("2026-08-15") }),
        makeTx({ description: "Spotify AB", amount: 1199, date: new Date("2026-09-01") }),
      ]

      const creeps = detectSubscriptionCreep({
        transactions: txs,
        recurringRules: [],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(creeps.length, 0)
    })

    it("detects recurring rule price hike >= 5%", () => {
      const ruleId = new ObjectId("650000000000000000000077")
      const rule: RecurringRule = {
        _id: ruleId,
        userId: "user_1",
        walletId: "wallet_1",
        categoryId: "cat_sub",
        type: "expense",
        amount: 2000, // $20 base
        currency: "USD",
        description: "Cloud Storage Pro",
        frequency: "monthly",
        startDate: new Date("2026-01-01"),
        nextDueDate: new Date("2026-10-01"),
        isActive: true,
        tags: [],
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
      }

      // Recent transaction charged $24 (exceeds $20 by 20% >= 5%)
      const txs: Transaction[] = [
        makeTx({
          recurringId: ruleId.toString(),
          description: "Cloud Storage Pro",
          amount: 2400,
          date: new Date("2026-09-05"),
        }),
      ]

      const creeps = detectSubscriptionCreep({
        transactions: txs,
        recurringRules: [rule],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(creeps.length, 1)
      assert.equal(creeps[0].severity, "warning")
      assert.match(creeps[0].title, /Subscription Price Hike: Cloud Storage Pro/i)
      assert.equal(creeps[0].metricImpact, 400)
      assert.match(creeps[0].metricLabel || "", /\+20% price hike/)
    })
  })

  describe("6. detectIncomeIrregularities", () => {
    it("flags missing or delayed income if baseline income >= $500 and current drops by >= 30%", () => {
      // 3 completed baseline periods: $4,000 each (400,000 cents)
      const pastSalary: Transaction[] = [
        makeTx({ type: "income", amount: 400000, description: "Acme Payroll", date: new Date("2026-08-01") }),
        makeTx({ type: "income", amount: 400000, description: "Acme Payroll", date: new Date("2026-07-01") }),
        makeTx({ type: "income", amount: 400000, description: "Acme Payroll", date: new Date("2026-06-01") }),
      ]

      // Current 30d has $0 income (100% drop) -> critical
      const irregularitiesZero = detectIncomeIrregularities({
        transactions: pastSalary,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(irregularitiesZero.length, 1)
      assert.equal(irregularitiesZero[0].category, "income")
      assert.equal(irregularitiesZero[0].severity, "critical")
      assert.match(irregularitiesZero[0].title, /Delayed or Missing Income/i)

      // Current 30d has $2,000 income (50% drop >= 30%) -> warning
      const irregularitiesDip = detectIncomeIrregularities({
        transactions: [
          ...pastSalary,
          makeTx({ type: "income", amount: 200000, description: "Acme Payroll", date: new Date("2026-09-02") }),
        ],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(irregularitiesDip.length, 1)
      assert.equal(irregularitiesDip[0].severity, "warning")
      assert.match(irregularitiesDip[0].metricLabel || "", /-50% below baseline/)
    })

    it("does not flag if baseline income is under $500 safeguard", () => {
      const pastLowIncome: Transaction[] = [
        makeTx({ type: "income", amount: 10000, date: new Date("2026-08-01") }),
        makeTx({ type: "income", amount: 10000, date: new Date("2026-07-01") }),
        makeTx({ type: "income", amount: 10000, date: new Date("2026-06-01") }),
      ]

      const irregularities = detectIncomeIrregularities({
        transactions: pastLowIncome,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(irregularities.length, 0)
    })
  })

  describe("7. detectSavingsOpportunities", () => {
    const groceriesCat: Category = {
      _id: new ObjectId("650000000000000000000010"),
      userId: "user_1",
      name: "Groceries",
      type: ["expense"],
      icon: "ShoppingCart",
      color: "#10b981",
      isDefault: false,
      createdAt: MOCK_DATE,
    }

    it("detects budget surpluses where budget >= $100 and spending < 70%", () => {
      const budgetId = new ObjectId("650000000000000000000020")
      const budget: Budget = {
        _id: budgetId,
        userId: "user_1",
        categoryId: groceriesCat._id.toString(),
        name: "Monthly Groceries",
        amount: 50000, // $500 limit
        currency: "USD",
        period: "monthly",
        startDate: new Date("2026-09-01"),
        isActive: true,
        alertThreshold: 80,
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
      }

      // Spent only $200 (40% of limit < 70%)
      const txs: Transaction[] = [
        makeTx({
          categoryId: groceriesCat._id.toString(),
          amount: 20000,
          date: new Date("2026-09-05"),
        }),
      ]

      const opportunities = detectSavingsOpportunities({
        transactions: txs,
        budgets: [budget],
        categories: [groceriesCat],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      const surplus = opportunities.find((o) => o.id.startsWith("savings_surplus"))
      assert.ok(surplus)
      assert.equal(surplus?.category, "savings")
      assert.equal(surplus?.severity, "opportunity")
      assert.equal(surplus?.metricImpact, 30000) // $300 surplus
    })

    it("detects micro-spending frequency leakage (<= $15, >= 12 times in 30d)", () => {
      // 15 small coffee transactions of $6.00 (600 cents) each
      const microTxs: Transaction[] = Array.from({ length: 15 }).map((_, i) =>
        makeTx({
          amount: 600,
          description: `Coffee Shop #${i + 1}`,
          date: new Date(`2026-09-0${(i % 8) + 1}`),
        })
      )

      const opportunities = detectSavingsOpportunities({
        transactions: microTxs,
        budgets: [],
        categories: [],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      const leakage = opportunities.find((o) => o.id.startsWith("savings_micro_leakage"))
      assert.ok(leakage)
      assert.equal(leakage?.category, "savings")
      assert.equal(leakage?.severity, "opportunity")
      // Total spend = 15 * 600 = 9,000 cents. 30% savings = 2,700 cents.
      assert.equal(leakage?.metricImpact, 2700)
    })
  })

  describe("8. detectCashFlowVelocity", () => {
    it("flags elevated burn rate when 7-day spend * 4.3 > income * 1.15", () => {
      // Income in 30d: $3,000 (300,000 cents)
      // 7-day spend: $900 (90,000 cents) -> projected month: 90,000 * 4.3 = 387,000 cents
      // 387,000 > 300,000 * 1.15 (345,000) -> deficit = 87,000 cents (> 25,000 -> critical)
      const txs: Transaction[] = [
        makeTx({ type: "income", amount: 300000, date: new Date("2026-09-01") }),
        makeTx({ type: "expense", amount: 90000, date: new Date("2026-09-08") }),
      ]

      const velocity = detectCashFlowVelocity({
        transactions: txs,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(velocity.length, 1)
      assert.equal(velocity[0].category, "cashflow")
      assert.equal(velocity[0].severity, "critical")
      assert.match(velocity[0].title, /Accelerated Burn Rate/i)
      assert.equal(velocity[0].metricImpact, -87000)
    })

    it("does not flag if burn rate is sustainable within income", () => {
      // Income $4,000, 7-day spend $500 -> projected 2,150 <= 4,600
      const txs: Transaction[] = [
        makeTx({ type: "income", amount: 400000, date: new Date("2026-09-01") }),
        makeTx({ type: "expense", amount: 50000, date: new Date("2026-09-08") }),
      ]

      const velocity = detectCashFlowVelocity({
        transactions: txs,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(velocity.length, 0)
    })
  })

  describe("9. calculateSpendingInsights (orchestrator)", () => {
    it("filters dismissed insights, attaches bookmark status, sorts by score, and calculates metrics", () => {
      const catObjectId = new ObjectId("650000000000000000000050")
      const catId = catObjectId.toString()
      const category: Category = {
        _id: catObjectId,
        userId: "user_1",
        name: "Dining Out",
        type: ["expense"],
        icon: "Utensils",
        color: "#f59e0b",
        isDefault: false,
        createdAt: MOCK_DATE,
      }

      // Generate a category spike
      const txs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-08-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-07-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-06-01") }),
        makeTx({ categoryId: catId, amount: 18000, date: new Date("2026-09-05") }),
      ]

      const spikeId = `spike_${catId}_2026_9`

      const userStates: UserInsightState[] = [
        {
          _id: new ObjectId(),
          userId: "user_1",
          insightKey: spikeId,
          status: "bookmarked",
          updatedAt: MOCK_DATE,
        },
      ]

      const result = calculateSpendingInsights({
        transactions: txs,
        categories: [category],
        budgets: [],
        recurringRules: [],
        userStates,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(result.currency, "USD")
      assert.equal(result.insights.length, 1)
      assert.equal(result.insights[0].id, spikeId)
      assert.equal(result.insights[0].isBookmarked, true)
      assert.equal(result.bookmarkedInsights.length, 1)
      assert.equal(result.bookmarkedInsights[0].id, spikeId)
      assert.equal(result.metrics.activeCount, 1)
      assert.equal(result.metrics.anomalyCount, 1)
      assert.equal(result.metrics.discretionarySurgeCents, 8000)
      assert.equal(result.executiveBriefing.isAiGenerated, false)
      assert.match(result.executiveBriefing.summary, /Dining Out/i)
    })

    it("excludes dismissed insights from main feed and counts in dismissedCount", () => {
      const catObjectId = new ObjectId("650000000000000000000050")
      const catId = catObjectId.toString()
      const category: Category = {
        _id: catObjectId,
        userId: "user_1",
        name: "Dining Out",
        type: ["expense"],
        icon: "Utensils",
        color: "#f59e0b",
        isDefault: false,
        createdAt: MOCK_DATE,
      }

      const txs: Transaction[] = [
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-08-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-07-01") }),
        makeTx({ categoryId: catId, amount: 10000, date: new Date("2026-06-01") }),
        makeTx({ categoryId: catId, amount: 18000, date: new Date("2026-09-05") }),
      ]

      const spikeId = `spike_${catId}_2026_9`

      const userStates: UserInsightState[] = [
        {
          _id: new ObjectId(),
          userId: "user_1",
          insightKey: spikeId,
          status: "dismissed",
          updatedAt: MOCK_DATE,
        },
      ]

      const result = calculateSpendingInsights({
        transactions: txs,
        categories: [category],
        budgets: [],
        recurringRules: [],
        userStates,
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(result.insights.length, 0)
      assert.equal(result.dismissedCount, 1)
      assert.equal(result.metrics.activeCount, 0)
    })

    it("handles empty active insights with graceful default fallback briefing", () => {
      const result = calculateSpendingInsights({
        transactions: [],
        categories: [],
        budgets: [],
        recurringRules: [],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.equal(result.insights.length, 0)
      assert.equal(result.metrics.activeCount, 0)
      assert.equal(result.metrics.anomalyCount, 0)
      assert.equal(result.metrics.potentialSavingsMonthlyCents, 0)
      assert.equal(result.metrics.discretionarySurgeCents, 0)
      assert.equal(result.executiveBriefing.isAiGenerated, false)
      assert.match(result.executiveBriefing.summary, /No unusual spending spikes or billing anomalies/i)
      assert.match(result.executiveBriefing.focalAdvice, /Keep monitoring your weekly discretionary spending/i)
    })

    it("sorts multiple detected insights descending by deterministic score", () => {
      // Create conditions for:
      // 1. Income irregularity (score: 90)
      // 2. Duplicate subscription charge (score: 85)
      // 3. Cashflow velocity (score: 80)
      // 4. Micro spending savings (score: 60)
      const pastIncome: Transaction[] = [
        makeTx({ type: "income", amount: 400000, date: new Date("2026-08-01") }),
        makeTx({ type: "income", amount: 400000, date: new Date("2026-07-01") }),
        makeTx({ type: "income", amount: 400000, date: new Date("2026-06-01") }),
      ]
      // Current 30d income: $1,000 (100,000 cents) -> 75% drop -> triggers income irregularity (score 90)
      const currentIncome: Transaction[] = [
        makeTx({ type: "income", amount: 100000, date: new Date("2026-09-02") }),
      ]

      // Duplicate charges (score 85)
      const idA = new ObjectId("650000000000000000000011")
      const idB = new ObjectId("650000000000000000000012")
      const duplicates: Transaction[] = [
        makeTx({ _id: idA, description: "Adobe Creative", amount: 5499, date: new Date("2026-09-02") }),
        makeTx({ _id: idB, description: "Adobe Creative", amount: 5499, date: new Date("2026-09-04") }),
      ]

      // Cash flow velocity (7-day spend $800 -> projected 344,000 > income 100,000 * 1.15) -> score 80
      const recentExpenses: Transaction[] = [
        makeTx({ type: "expense", amount: 80000, date: new Date("2026-09-08") }),
      ]

      // Micro spend leakage (12 micro transactions of $5) -> score 60
      const microTxs: Transaction[] = Array.from({ length: 12 }).map((_, i) =>
        makeTx({ amount: 500, description: `Micro ${i}`, date: new Date("2026-09-05") })
      )

      const result = calculateSpendingInsights({
        transactions: [
          ...pastIncome,
          ...currentIncome,
          ...duplicates,
          ...recentExpenses,
          ...microTxs,
        ],
        categories: [],
        budgets: [],
        recurringRules: [],
        targetCurrency: "USD",
        exchangeRates: { USD: 1 },
        referenceDate: MOCK_DATE,
      })

      assert.ok(result.insights.length >= 3)
      // Verify descending sort by score
      for (let i = 0; i < result.insights.length - 1; i++) {
        assert.ok(
          result.insights[i].score >= result.insights[i + 1].score,
          `Insight at ${i} (score ${result.insights[i].score}) should be >= insight at ${i + 1} (score ${result.insights[i + 1].score})`
        )
      }
      assert.ok(result.insights[0].score >= 90)
    })
  })
})

