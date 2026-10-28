import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  formatDenomination,
  formatDenominatedCurrency,
  getCurrencySymbol,
  isLakhCroreCurrency,
} from "../denomination"

describe("Currency Denomination Utility", () => {
  it("identifies Lakh & Crore currencies correctly", () => {
    assert.equal(isLakhCroreCurrency("INR"), true)
    assert.equal(isLakhCroreCurrency("inr"), true)
    assert.equal(isLakhCroreCurrency("USD"), false)
    assert.equal(isLakhCroreCurrency("EUR"), false)
  })

  it("returns correct symbols for currencies", () => {
    assert.equal(getCurrencySymbol("USD"), "$")
    assert.equal(getCurrencySymbol("INR"), "₹")
    assert.equal(getCurrencySymbol("EUR"), "€")
    assert.equal(getCurrencySymbol("GBP"), "£")
  })

  describe("Indian Rupee (INR) Denominations (k, l, cr)", () => {
    it("formats thousands as k", () => {
      // 2,000 INR -> ₹2k
      assert.equal(formatDenomination(2000, "INR"), "₹2k")
      // 50,000 INR -> ₹50k
      assert.equal(formatDenomination(50000, "INR"), "₹50k")
      // 75,500 INR -> ₹75.5k
      assert.equal(formatDenomination(75500, "INR"), "₹75.5k")
    })

    it("formats Lakhs as l / L", () => {
      // 100,000 INR = 1 Lakh -> ₹1l
      assert.equal(formatDenomination(100000, "INR"), "₹1l")
      // 200,000 INR = 2 Lakhs -> ₹2l
      assert.equal(formatDenomination(200000, "INR"), "₹2l")
      // 250,000 INR = 2.5 Lakhs -> ₹2.5l
      assert.equal(formatDenomination(250000, "INR"), "₹2.5l")
      // With uppercase suffix
      assert.equal(formatDenomination(200000, "INR", { lowercase: false }), "₹2L")
    })

    it("formats Crores as cr / Cr", () => {
      // 10,000,000 INR = 1 Crore -> ₹1cr
      assert.equal(formatDenomination(10000000, "INR"), "₹1cr")
      // 20,000,000 INR = 2 Crores -> ₹2cr
      assert.equal(formatDenomination(20000000, "INR"), "₹2cr")
      // 54,000,000 INR = 5.4 Crores -> ₹5.4cr
      assert.equal(formatDenomination(54000000, "INR"), "₹5.4cr")
      // With uppercase suffix
      assert.equal(formatDenomination(20000000, "INR", { lowercase: false }), "₹2Cr")
    })

    it("formats sub-thousand amounts normally without suffix", () => {
      assert.equal(formatDenomination(500, "INR"), "₹500")
      assert.equal(formatDenomination(75, "INR"), "₹75")
    })
  })

  describe("Western Currencies (USD, EUR, GBP) Denominations (k, m, b)", () => {
    it("formats thousands as k", () => {
      assert.equal(formatDenomination(2000, "USD"), "$2k")
      assert.equal(formatDenomination(15500, "USD"), "$15.5k")
      assert.equal(formatDenomination(500000, "EUR"), "€500k")
    })

    it("formats millions as m / M", () => {
      assert.equal(formatDenomination(2000000, "USD"), "$2m")
      assert.equal(formatDenomination(2500000, "USD"), "$2.5m")
      assert.equal(formatDenomination(2000000, "USD", { lowercase: false }), "$2M")
    })

    it("formats billions as b / B", () => {
      assert.equal(formatDenomination(2000000000, "USD"), "$2b")
      assert.equal(formatDenomination(2000000000, "USD", { lowercase: false }), "$2B")
    })
  })

  describe("Cents conversion (formatDenominatedCurrency)", () => {
    it("correctly handles cents input (Dime data model)", () => {
      // 200,000 cents = $2,000 -> $2k
      assert.equal(formatDenominatedCurrency(200000, "USD"), "$2k")
      // 20,000,000 cents = ₹200,000 = ₹2l
      assert.equal(formatDenominatedCurrency(20000000, "INR"), "₹2l")
      // 2,000,000,000 cents = ₹20,000,000 = ₹2cr
      assert.equal(formatDenominatedCurrency(2000000000, "INR"), "₹2cr")
      // 20,000,000,000 cents = ₹200,000,000 = ₹20cr
      assert.equal(formatDenominatedCurrency(20000000000, "INR"), "₹20cr")
    })

    it("handles negative amounts correctly", () => {
      assert.equal(formatDenominatedCurrency(-200000, "USD"), "-$2k")
      assert.equal(formatDenominatedCurrency(-20000000, "INR"), "-₹2l")
    })

    it("handles showPositiveSign correctly", () => {
      assert.equal(formatDenominatedCurrency(200000, "USD", { showPositiveSign: true }), "+$2k")
      assert.equal(formatDenominatedCurrency(20000000, "INR", { showPositiveSign: true }), "+₹2l")
      assert.equal(formatDenominatedCurrency(-200000, "USD", { showPositiveSign: true }), "-$2k")
    })

    it("handles includeSymbol = false", () => {
      assert.equal(formatDenominatedCurrency(200000, "USD", { includeSymbol: false }), "2k")
      assert.equal(formatDenominatedCurrency(20000000, "INR", { includeSymbol: false }), "2l")
    })
  })
})
