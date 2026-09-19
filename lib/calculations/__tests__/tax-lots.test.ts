import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  buildTaxLots,
  calculateCapitalGainsSchedule,
  generateTaxScheduleCsv,
} from "../tax-lots"
import type { InvestmentTransaction } from "@/types"
import { ObjectId } from "mongodb"

describe("Tax Lot Accounting & Capital Gains Engine", () => {
  const makeTx = (
    overrides: Partial<InvestmentTransaction>
  ): InvestmentTransaction =>
    ({
      _id: new ObjectId(),
      userId: "u1",
      organizationId: null,
      walletId: "w1",
      holdingId: "w1_AAPL",
      symbol: "AAPL",
      assetType: "stock",
      type: "buy",
      quantity: 10,
      price: 10000, // $100
      fees: 0,
      grossAmount: 100000,
      cashImpact: -100000,
      date: new Date("2024-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as InvestmentTransaction)

  describe("1. Cost Basis Methods: FIFO, LIFO, HIFO", () => {
    // 2 buys:
    // Buy 1: 10 shares @ $100 on 2024-01-01
    // Buy 2: 10 shares @ $150 on 2024-06-01
    // Sell:  5 shares  @ $200 on 2025-02-01
    const baseTxs: InvestmentTransaction[] = [
      makeTx({
        _id: new ObjectId("000000000000000000000001"),
        type: "buy",
        quantity: 10,
        price: 10000, // $100
        date: new Date("2024-01-01"),
      }),
      makeTx({
        _id: new ObjectId("000000000000000000000002"),
        type: "buy",
        quantity: 10,
        price: 15000, // $150
        date: new Date("2024-06-01"),
      }),
      makeTx({
        _id: new ObjectId("000000000000000000000003"),
        type: "sell",
        quantity: 5,
        price: 20000, // $200
        date: new Date("2025-02-01"),
      }),
    ]

    it("FIFO depletes earliest lot first (cost basis $100/share)", () => {
      const { realizedEvents, openLots } = buildTaxLots(baseTxs, "fifo")

      assert.strictEqual(realizedEvents.length, 1)
      assert.strictEqual(realizedEvents[0].quantity, 5)
      assert.strictEqual(realizedEvents[0].buyPrice, 10000)
      assert.strictEqual(realizedEvents[0].sellPrice, 20000)
      // Gain = 5 * ($200 - $100) = $500 (50,000 cents)
      assert.strictEqual(realizedEvents[0].realizedGainCents, 50000)
      assert.strictEqual(realizedEvents[0].costBasisMethod, "fifo")

      // Open lots should have 5 remaining from lot 1, and 10 from lot 2
      const lot1 = openLots.find((l) => l.price === 10000)
      const lot2 = openLots.find((l) => l.price === 15000)
      assert.ok(lot1)
      assert.ok(lot2)
      assert.strictEqual(lot1.remainingQuantity, 5)
      assert.strictEqual(lot2.remainingQuantity, 10)
    })

    it("LIFO depletes latest lot first (cost basis $150/share)", () => {
      const { realizedEvents, openLots } = buildTaxLots(baseTxs, "lifo")

      assert.strictEqual(realizedEvents.length, 1)
      assert.strictEqual(realizedEvents[0].quantity, 5)
      assert.strictEqual(realizedEvents[0].buyPrice, 15000)
      // Gain = 5 * ($200 - $150) = $250 (25,000 cents)
      assert.strictEqual(realizedEvents[0].realizedGainCents, 25000)
      assert.strictEqual(realizedEvents[0].costBasisMethod, "lifo")

      // Open lots: 10 remaining from lot 1, 5 from lot 2
      const lot1 = openLots.find((l) => l.price === 10000)
      const lot2 = openLots.find((l) => l.price === 15000)
      assert.strictEqual(lot1?.remainingQuantity, 10)
      assert.strictEqual(lot2?.remainingQuantity, 5)
    })

    it("HIFO depletes highest cost lot first to minimize capital gains", () => {
      const { realizedEvents } = buildTaxLots(baseTxs, "hifo")

      assert.strictEqual(realizedEvents.length, 1)
      assert.strictEqual(realizedEvents[0].buyPrice, 15000) // selected $150 lot over $100
      assert.strictEqual(realizedEvents[0].realizedGainCents, 25000)
    })

    it("Average Cost uses pool average cost basis", () => {
      // 10 shares @ 100 + 10 shares @ 150 = 20 shares @ 125 avg
      const { realizedEvents } = buildTaxLots(baseTxs, "average_cost")

      assert.strictEqual(realizedEvents.length, 1)
      assert.strictEqual(realizedEvents[0].buyPrice, 12500) // $125
      // Gain = 5 * ($200 - $125) = $375 (37,500 cents)
      assert.strictEqual(realizedEvents[0].realizedGainCents, 37500)
    })
  })

  describe("2. Holding Period Classification (STCG vs LTCG)", () => {
    it("classifies sales > 365 days as long_term, and <= 365 days as short_term", () => {
      const txs: InvestmentTransaction[] = [
        makeTx({
          date: new Date("2024-01-01"),
          type: "buy",
          quantity: 10,
          price: 10000,
        }),
        makeTx({
          date: new Date("2024-06-01"), // 152 days later
          type: "sell",
          quantity: 2,
          price: 12000,
        }),
        makeTx({
          date: new Date("2025-06-01"), // 517 days later
          type: "sell",
          quantity: 3,
          price: 14000,
        }),
      ]

      const { realizedEvents } = buildTaxLots(txs, "fifo")
      assert.strictEqual(realizedEvents.length, 2)

      const shortTermEvt = realizedEvents.find((e) => e.quantity === 2)
      const longTermEvt = realizedEvents.find((e) => e.quantity === 3)

      assert.ok(shortTermEvt)
      assert.ok(longTermEvt)
      assert.strictEqual(shortTermEvt.term, "short_term")
      assert.strictEqual(longTermEvt.term, "long_term")
    })
  })

  describe("3. Stock Splits and Reverse Splits Adjustments", () => {
    it("proportionally adjusts quantity and price on 2:1 stock split", () => {
      const txs: InvestmentTransaction[] = [
        makeTx({
          date: new Date("2024-01-01"),
          type: "buy",
          quantity: 10,
          price: 20000, // $200
        }),
        makeTx({
          date: new Date("2024-06-01"),
          type: "stock_split",
          quantity: 2, // 2:1 split
          price: 0,
        }),
        makeTx({
          date: new Date("2024-08-01"),
          type: "sell",
          quantity: 10,
          price: 12000, // $120
        }),
      ]

      const { realizedEvents, openLots } = buildTaxLots(txs, "fifo")

      // After 2:1 split, 10 shares @ $200 became 20 shares @ $100
      assert.strictEqual(realizedEvents.length, 1)
      assert.strictEqual(realizedEvents[0].buyPrice, 10000) // $100
      assert.strictEqual(realizedEvents[0].sellPrice, 12000) // $120
      assert.strictEqual(realizedEvents[0].realizedGainCents, 20000) // 10 * $20 = $200

      // 10 shares remain in the lot
      assert.strictEqual(openLots.length, 1)
      assert.strictEqual(openLots[0].remainingQuantity, 10)
    })
  })

  describe("4. calculateCapitalGainsSchedule & CSV Export", () => {
    it("aggregates capital gains schedule by tax year and exports to CSV", () => {
      const txs: InvestmentTransaction[] = [
        makeTx({
          symbol: "AAPL",
          date: new Date("2023-01-01"),
          type: "buy",
          quantity: 10,
          price: 10000,
        }),
        makeTx({
          symbol: "AAPL",
          date: new Date("2024-06-01"), // 2024 LTCG
          type: "sell",
          quantity: 5,
          price: 15000,
        }),
        makeTx({
          symbol: "MSFT",
          date: new Date("2025-01-01"),
          type: "buy",
          quantity: 5,
          price: 20000,
        }),
        makeTx({
          symbol: "MSFT",
          date: new Date("2025-03-01"), // 2025 STCG
          type: "sell",
          quantity: 5,
          price: 22000,
        }),
      ]

      const sched2024 = calculateCapitalGainsSchedule(txs, 2024, "fifo")
      assert.strictEqual(sched2024.taxYear, 2024)
      assert.strictEqual(sched2024.longTerm.gainCents, 25000) // 5 * $50 = $250
      assert.strictEqual(sched2024.shortTerm.gainCents, 0)
      assert.strictEqual(sched2024.events.length, 1)

      const sched2025 = calculateCapitalGainsSchedule(txs, 2025, "fifo")
      assert.strictEqual(sched2025.taxYear, 2025)
      assert.strictEqual(sched2025.shortTerm.gainCents, 10000) // 5 * $20 = $100
      assert.strictEqual(sched2025.longTerm.gainCents, 0)

      // CSV Generation
      const csv = generateTaxScheduleCsv(sched2024.events, 2024, "fifo")
      assert.ok(csv.includes("AAPL"))
      assert.ok(csv.includes("Long-Term"))
      assert.ok(csv.includes("FIFO"))
    })
  })
})
