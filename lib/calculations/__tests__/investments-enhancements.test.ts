import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  calculateXIRR,
  buildHoldingReturn,
  calculateDividendSummary,
  calculatePortfolioRisk,
  calculateSectorAllocation,
} from "../investments"
import type { InvestmentHolding, InvestmentTransaction } from "@/types"
import { ObjectId } from "mongodb"

describe("Investment Portfolio Enhancements Calculation Engine", () => {
  describe("1. calculateXIRR (Newton-Raphson)", () => {
    it("returns null when cash flows are empty or lack alternating signs", () => {
      assert.strictEqual(calculateXIRR([]), null)
      assert.strictEqual(
        calculateXIRR([
          { date: new Date("2025-01-01"), amount: -1000 },
          { date: new Date("2025-06-01"), amount: -500 },
        ]),
        null
      )
    })

    it("accurately calculates 1-year annualized XIRR for single investment and exit", () => {
      // Invest $1,000, retrieve $1,200 after exactly 1 year -> 20% p.a.
      const cashFlows = [
        { date: new Date("2025-01-01"), amount: -1000 },
        { date: new Date("2026-01-01"), amount: 1200 },
      ]
      const rate = calculateXIRR(cashFlows)
      assert.ok(rate !== null)
      // Allow minor variation due to 365 vs 365.25 day handling
      assert.ok(Math.abs(rate - 0.2) < 0.01)
    })

    it("handles multiple staggered cash flows (DCA)", () => {
      const cashFlows = [
        { date: new Date("2025-01-01"), amount: -1000 },
        { date: new Date("2025-07-01"), amount: -1000 },
        { date: new Date("2026-01-01"), amount: 2300 },
      ]
      const rate = calculateXIRR(cashFlows)
      assert.ok(rate !== null)
      assert.ok(rate > 0.15 && rate < 0.25)
    })
  })

  describe("2. buildHoldingReturn", () => {
    it("computes simple return and holding period correctly", () => {
      const txs: InvestmentTransaction[] = [
        {
          _id: new ObjectId(),
          userId: "u1",
          walletId: "w1",
          holdingId: "w1_AAPL",
          symbol: "AAPL",
          type: "buy",
          quantity: 10,
          price: 15000, // $150
          fees: 500, // $5
          date: new Date("2025-01-01"),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]

      // Current value: 10 shares * $180 = $1,800 (180,000 cents)
      const returns = buildHoldingReturn(txs, 180000)

      assert.strictEqual(returns.absoluteGainCents, 180000 - 150500)
      assert.ok(returns.simpleReturn > 0.19 && returns.simpleReturn < 0.21)
      assert.ok(returns.holdingPeriodDays > 0)
      assert.ok(returns.xirr !== null)
    })
  })

  describe("3. calculateDividendSummary", () => {
    it("aggregates cash and reinvested dividends and calculates yield", () => {
      const txs: InvestmentTransaction[] = [
        {
          _id: new ObjectId(),
          userId: "u1",
          walletId: "w1",
          holdingId: "w1_JNJ",
          symbol: "JNJ",
          type: "cash_dividend",
          quantity: 0,
          price: 0,
          fees: 0,
          dividendAmount: 5000, // $50
          date: new Date("2025-03-15"),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        {
          _id: new ObjectId(),
          userId: "u1",
          walletId: "w1",
          holdingId: "w1_JNJ",
          symbol: "JNJ",
          type: "cash_dividend",
          quantity: 0,
          price: 0,
          fees: 0,
          dividendAmount: 6000, // $60
          date: new Date("2025-09-15"),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]

      const costBasisCents = 200000 // $2,000
      const summary = calculateDividendSummary(txs, costBasisCents, "w1_JNJ", "JNJ")

      assert.strictEqual(summary.totalDividendCents, 11000)
      assert.strictEqual(summary.dividendCount, 2)
      assert.strictEqual(summary.annualYield, 0.055) // $110 / $2,000 = 5.5%
      assert.strictEqual(summary.byYear.length, 1)
      assert.strictEqual(summary.byYear[0].year, 2025)
      assert.strictEqual(summary.byYear[0].totalCents, 11000)
    })
  })

  describe("4. calculatePortfolioRisk & calculateSectorAllocation", () => {
    const holdings: InvestmentHolding[] = [
      {
        _id: new ObjectId(),
        userId: "u1",
        walletId: "w1",
        symbol: "AAPL",
        name: "Apple Inc.",
        assetType: "stock",
        quantity: 50,
        currentPrice: 200, // $10,000
        totalCostBasis: 800000,
        status: "active",
      } as any,
      {
        _id: new ObjectId(),
        userId: "u1",
        walletId: "w1",
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        assetType: "etf",
        quantity: 20,
        currentPrice: 450, // $9,000
        totalCostBasis: 850000,
        status: "active",
      } as any,
      {
        _id: new ObjectId(),
        userId: "u1",
        walletId: "w1",
        symbol: "BTC",
        name: "Bitcoin",
        assetType: "crypto",
        quantity: 0.1,
        currentPrice: 60000, // $6,000
        totalCostBasis: 500000,
        status: "active",
      } as any,
    ]

    it("evaluates sector allocations", () => {
      const allocations = calculateSectorAllocation(holdings)
      // Total value: 10000 + 9000 + 6000 = 25000
      assert.strictEqual(allocations.length, 3)
      assert.strictEqual(allocations[0].sector, "stock")
      assert.strictEqual(allocations[0].valuePercent, 40) // 10k / 25k = 40%
      assert.strictEqual(allocations[1].sector, "etf")
      assert.strictEqual(allocations[1].valuePercent, 36) // 9k / 25k = 36%
      assert.strictEqual(allocations[2].sector, "crypto")
      assert.strictEqual(allocations[2].valuePercent, 24) // 6k / 25k = 24%
    })

    it("evaluates concentration risk and diversification score", () => {
      const risk = calculatePortfolioRisk(holdings)
      // AAPL = 40% (> 25% -> generates warning)
      assert.strictEqual(risk.assetClassCount, 3)
      assert.strictEqual(risk.concentrationWarnings.length, 2) // AAPL (40%) and VOO (36%)
      assert.ok(risk.diversificationScore > 50)
      assert.ok(["low", "moderate", "high"].includes(risk.singleAssetRisk))
    })
  })
})
