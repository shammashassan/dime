import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { parseSearchQuery, parseAmountToCents, resolveDateRange } from "../parser"

describe("Search Query Parser Engine", () => {
  it("1. extracts pure free-text when no operators are present", () => {
    const result = parseSearchQuery("coffee with friends")
    assert.equal(result.textQuery, "coffee with friends")
    assert.deepEqual(result.operators, {})
    assert.equal(result.activeBadges.length, 0)
  })

  it("2. parses amount operators with inequalities and converts to cents", () => {
    // Greater than
    const r1 = parseSearchQuery("amount>50")
    assert.equal(r1.operators.minAmount, 5001) // > 50.00 is >= 50.01

    // Greater than or equal
    const r2 = parseSearchQuery("amount>=100")
    assert.equal(r2.operators.minAmount, 10000)

    // Less than
    const r3 = parseSearchQuery("amount<25.50")
    assert.equal(r3.operators.maxAmount, 2549)

    // Less than or equal
    const r4 = parseSearchQuery("amount<=100.50")
    assert.equal(r4.operators.maxAmount, 10050)

    // Exact amount
    const r5 = parseSearchQuery("amount=500")
    assert.equal(r5.operators.exactAmount, 50000)

    // Shorthand with k
    const r6 = parseSearchQuery("amount>=5k")
    assert.equal(r6.operators.minAmount, 500000)
  })

  it("3. parses relative dates correctly against reference date", () => {
    const refDate = new Date(2026, 7, 15, 12, 0, 0) // August 15, 2026

    // This month
    const rMonth = parseSearchQuery("date:this-month", refDate)
    assert.ok(rMonth.operators.startDate)
    assert.ok(rMonth.operators.endDate)
    assert.equal(rMonth.operators.startDate?.getMonth(), 7) // August
    assert.equal(rMonth.operators.startDate?.getDate(), 1)
    assert.equal(rMonth.operators.endDate?.getMonth(), 7)
    assert.equal(rMonth.operators.endDate?.getDate(), 31)

    // Last month
    const rLastMonth = parseSearchQuery("date:last-month", refDate)
    assert.equal(rLastMonth.operators.startDate?.getMonth(), 6) // July
    assert.equal(rLastMonth.operators.startDate?.getDate(), 1)
    assert.equal(rLastMonth.operators.endDate?.getMonth(), 6)
    assert.equal(rLastMonth.operators.endDate?.getDate(), 31)

    // Explicit date range
    const rRange = parseSearchQuery("date:2026-01-01..2026-06-30")
    assert.equal(rRange.operators.startDate?.toISOString().slice(0, 10), "2026-01-01")
    assert.equal(rRange.operators.endDate?.toISOString().slice(0, 10), "2026-06-30")
  })

  it("4. parses key:value operators including quotes with spaces", () => {
    const result = parseSearchQuery('category:"Food & Dining" wallet:Cash merchant:Amazon currency:USD tag:grocery person:John type:expense')
    assert.equal(result.operators.category, "Food & Dining")
    assert.equal(result.operators.wallet, "Cash")
    assert.equal(result.operators.merchant, "Amazon")
    assert.equal(result.operators.currency, "USD")
    assert.equal(result.operators.tag, "grocery")
    assert.equal(result.operators.person, "John")
    assert.equal(result.operators.type, "expense")
    assert.equal(result.textQuery, "")
  })

  it("5. resolves domain shortcuts to entityTypes and statuses", () => {
    // loan:active
    const rLoan = parseSearchQuery("loan:active")
    assert.deepEqual(rLoan.operators.entityTypes, ["loan"])
    assert.equal(rLoan.operators.status, "active")

    // bill:overdue
    const rBill = parseSearchQuery("bill:overdue")
    assert.deepEqual(rBill.operators.entityTypes, ["recurring"])
    assert.equal(rBill.operators.kind, "bill")
    assert.equal(rBill.operators.status, "overdue")

    // subscription:active
    const rSub = parseSearchQuery("subscription:active")
    assert.deepEqual(rSub.operators.entityTypes, ["recurring"])
    assert.equal(rSub.operators.kind, "subscription")
    assert.equal(rSub.operators.status, "active")

    // investment:stocks
    const rInv = parseSearchQuery("investment:stocks")
    assert.deepEqual(rInv.operators.entityTypes, ["investment"])
    assert.equal(rInv.operators.assetClass, "stock")

    // asset:real-estate
    const rAsset = parseSearchQuery("asset:real-estate")
    assert.deepEqual(rAsset.operators.entityTypes, ["asset"])
    assert.equal(rAsset.operators.assetClass, "real_estate")

    // transaction:split
    const rSplit = parseSearchQuery("transaction:split")
    assert.deepEqual(rSplit.operators.entityTypes, ["transaction"])
    assert.equal(rSplit.operators.isSplit, true)
  })

  it("6. extracts residual free text alongside multiple operators", () => {
    const refDate = new Date(2026, 7, 15)
    const result = parseSearchQuery("Starbucks category:Food amount>50 date:this-month", refDate)
    assert.equal(result.textQuery, "Starbucks")
    assert.equal(result.operators.category, "Food")
    assert.equal(result.operators.minAmount, 5001)
    assert.ok(result.operators.startDate)
    assert.ok(result.operators.endDate)
    assert.equal(result.activeBadges.length, 3)
  })

  it("7. handles empty and edge cases gracefully", () => {
    const empty = parseSearchQuery("")
    assert.equal(empty.textQuery, "")
    assert.deepEqual(empty.operators, {})

    const spaces = parseSearchQuery("     ")
    assert.equal(spaces.textQuery, "")

    const invalidAmount = parseSearchQuery("amount>abc")
    assert.equal(invalidAmount.textQuery, "amount>abc")
  })
})
