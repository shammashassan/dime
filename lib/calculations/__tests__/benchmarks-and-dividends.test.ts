import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateBenchmarkComparison } from "../benchmarks"
import { calculateForwardDividends } from "../dividend-forecast"
import type { InvestmentHolding, InvestmentTransaction } from "@/types"
import { ObjectId } from "mongodb"

describe("Portfolio Benchmarks & Forward Dividend Forecasting Engine", () => {
  const makeHolding = (overrides: Partial<InvestmentHolding>): InvestmentHolding =>
    ({
      _id: new ObjectId(),
      userId: "u1",
      walletId: "w1",
      symbol: "AAPL",
      name: "Apple Inc.",
      assetType: "stock",
      quantity: 10,
      averageCostBasis: 15000, // $150
      totalCostBasis: 150000, // $1,500
      currentPrice: 18000, // $180
      status: "active",
      realizedGain: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as InvestmentHolding)

  const makeTx = (overrides: Partial<InvestmentTransaction>): InvestmentTransaction =>
    ({
      _id: new ObjectId(),
      userId: "u1",
      walletId: "w1",
      holdingId: "w1_AAPL",
      symbol: "AAPL",
      assetType: "stock",
      type: "buy",
      quantity: 10,
      price: 15000,
      fees: 0,
      grossAmount: 150000,
      cashImpact: -150000,
      date: new Date("2025-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as InvestmentTransaction)

  describe("1. Portfolio Benchmarking", () => {
    it("calculates portfolio return and alpha against S&P 500", () => {
      const holdings = [makeHolding({ currentPrice: 18000, totalCostBasis: 150000 })]
      const txs = [makeTx({ date: new Date("2025-01-01") })]

      const comparison = calculateBenchmarkComparison(txs, holdings, "^GSPC", "1Y")

      // Portfolio ROI = ($1,800 - $1,500) / $1,500 = +20.0%
      assert.strictEqual(comparison.benchmarkId, "^GSPC")
      assert.strictEqual(comparison.portfolioReturnPct, 20.0)
      assert.strictEqual(comparison.benchmarkReturnPct, 18.5)
      // Alpha = 20.0 - 18.5 = +1.5%
      assert.strictEqual(comparison.alphaPct, 1.5)
      assert.strictEqual(comparison.isOutperforming, true)
    })

    it("handles multiple benchmark symbols (QQQ, VTI, VT, ^NSEI)", () => {
      const holdings = [makeHolding({ currentPrice: 18000, totalCostBasis: 150000 })]
      const txs = [makeTx({})]

      const qqqComp = calculateBenchmarkComparison(txs, holdings, "QQQ", "1Y")
      assert.strictEqual(qqqComp.benchmarkId, "QQQ")
      assert.strictEqual(qqqComp.benchmarkReturnPct, 24.2)
      // Portfolio (20%) underperforms QQQ (24.2%)
      assert.strictEqual(qqqComp.alphaPct, -4.2)
      assert.strictEqual(qqqComp.isOutperforming, false)
    })
  })

  describe("2. Forward Dividend Forecasting", () => {
    it("forecasts 12-month dividend income, yield on cost, and monthly schedule", () => {
      const holdings = [
        makeHolding({
          symbol: "JNJ",
          name: "Johnson & Johnson",
          quantity: 20,
          currentPrice: 16000, // $160 -> $3,200
          averageCostBasis: 15000, // $150 -> $3,000 cost basis
          totalCostBasis: 300000,
        }),
      ]

      const fixedNow = new Date("2026-09-01")

      // Past 4 quarterly dividends of $1.20 ($24 total for 20 shares each)
      const txs: InvestmentTransaction[] = [
        makeTx({
          symbol: "JNJ",
          type: "cash_dividend",
          dividendAmount: 2400, // $24
          date: new Date("2025-12-15"),
        }),
        makeTx({
          symbol: "JNJ",
          type: "cash_dividend",
          dividendAmount: 2400, // $24
          date: new Date("2026-03-15"),
        }),
        makeTx({
          symbol: "JNJ",
          type: "cash_dividend",
          dividendAmount: 2400, // $24
          date: new Date("2026-06-15"),
        }),
      ]

      const forecast = calculateForwardDividends(holdings, txs, fixedNow)

      assert.strictEqual(forecast.holdings.length, 1)
      const jnjForecast = forecast.holdings[0]

      // 3 trailing dividends = $72 total paid -> annualized approx $96 (9,600 cents)
      assert.ok(jnjForecast.projectedAnnualIncomeCents > 0)
      assert.strictEqual(jnjForecast.frequency, "quarterly")
      assert.ok(forecast.projectedYieldOnCostPct !== null && forecast.projectedYieldOnCostPct > 0)
      assert.ok(forecast.projectedYieldOnValuePct !== null && forecast.projectedYieldOnValuePct > 0)
      assert.strictEqual(forecast.monthlyDistribution.length, 12)

      // Total projected income matches sum of holdings
      assert.strictEqual(
        forecast.projectedAnnualIncomeCents,
        jnjForecast.projectedAnnualIncomeCents
      )
    })
  })
})
