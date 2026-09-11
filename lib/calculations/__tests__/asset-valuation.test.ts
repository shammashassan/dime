import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import {
  calculateAssetValuationMetrics,
  generateAssetValuationBriefing,
  // @ts-expect-error -- Node 22 ESM test runner requires .ts extension
} from "../asset-valuation.ts"
import type { Asset, AssetValuation } from "@/types"

describe("Asset Valuation Calculation Engine", () => {
  const referenceDate = new Date("2026-09-10T12:00:00Z")

  it("calculates vehicle depreciation and outperforming benchmark", () => {
    // Purchased 2 years ago for $30,000 (3,000,000 cents), now valued at $24,000 (2,400,000 cents)
    const twoYearsAgo = new Date("2024-09-10T12:00:00Z")
    const asset: Pick<Asset, "category" | "currentValue" | "currency" | "acquiredAt" | "createdAt"> = {
      category: "vehicle",
      currentValue: 2400000,
      currency: "USD",
      acquiredAt: twoYearsAgo,
      createdAt: twoYearsAgo,
    }

    const valuations: Array<Pick<AssetValuation, "date" | "value">> = [
      { date: twoYearsAgo, value: 3000000 },
      { date: referenceDate, value: 2400000 },
    ]

    const metrics = calculateAssetValuationMetrics(asset, valuations, referenceDate)

    assert.equal(metrics.initialValue, 3000000)
    assert.equal(metrics.latestValue, 2400000)
    assert.equal(metrics.nominalChange, -600000)
    assert.equal(metrics.totalReturnPct, -20)
    assert.equal(metrics.isDepreciatingCategory, true)
    // CAGR for 24000/30000 over 2 yrs: (0.8)^0.5 - 1 ≈ -0.1056 (-10.56%/yr)
    assert.ok(metrics.annualizedRate < 0)
    assert.ok(metrics.annualizedRate > -0.12)
    // Category benchmark for vehicles is -15% (-0.15). Since -10.56% is less severe loss than -15%, it's outperforming
    assert.equal(metrics.performance, "outperforming")
    assert.equal(metrics.isStale, false)
  })

  it("calculates real estate appreciation and benchmark comparison", () => {
    // Purchased 3 years ago for $300,000 (30,000,000 cents), now valued at $390,000 (39,000,000 cents)
    const threeYearsAgo = new Date("2023-09-10T12:00:00Z")
    const asset: Pick<Asset, "category" | "currentValue" | "currency" | "acquiredAt" | "createdAt"> = {
      category: "real_estate",
      currentValue: 39000000,
      currency: "USD",
      acquiredAt: threeYearsAgo,
      createdAt: threeYearsAgo,
    }

    const valuations: Array<Pick<AssetValuation, "date" | "value">> = [
      { date: threeYearsAgo, value: 30000000 },
      { date: referenceDate, value: 39000000 },
    ]

    const metrics = calculateAssetValuationMetrics(asset, valuations, referenceDate)

    assert.equal(metrics.initialValue, 30000000)
    assert.equal(metrics.latestValue, 39000000)
    assert.equal(metrics.nominalChange, 9000000)
    assert.equal(metrics.totalReturnPct, 30)
    assert.equal(metrics.isDepreciatingCategory, false)
    // 390k / 300k over 3 years: (1.3)^(1/3) - 1 ≈ +9.14%/yr
    assert.ok(metrics.annualizedRate > 0.08)
    // Benchmark for real estate is +5.5%. +9.14% > 5.5% + 2% -> outperforming
    assert.equal(metrics.performance, "outperforming")
    assert.equal(metrics.isStale, false)
  })

  it("flags valuation as stale when last logged over 90 days ago", () => {
    const fourMonthsAgo = new Date("2026-05-10T12:00:00Z") // ~123 days before referenceDate
    const asset: Pick<Asset, "category" | "currentValue" | "currency" | "acquiredAt" | "createdAt"> = {
      category: "gold",
      currentValue: 500000,
      currency: "USD",
      acquiredAt: fourMonthsAgo,
      createdAt: fourMonthsAgo,
    }

    const valuations: Array<Pick<AssetValuation, "date" | "value">> = [
      { date: fourMonthsAgo, value: 500000 },
    ]

    const metrics = calculateAssetValuationMetrics(asset, valuations, referenceDate)

    assert.ok(metrics.daysSinceLastValuation > 90)
    assert.equal(metrics.isStale, true)
  })

  it("handles newly created asset with single valuation safely", () => {
    const asset: Pick<Asset, "category" | "currentValue" | "currency" | "acquiredAt" | "createdAt"> = {
      category: "other",
      currentValue: 100000,
      currency: "USD",
      acquiredAt: referenceDate,
      createdAt: referenceDate,
    }

    const metrics = calculateAssetValuationMetrics(asset, [], referenceDate)

    assert.equal(metrics.initialValue, 100000)
    assert.equal(metrics.latestValue, 100000)
    assert.equal(metrics.nominalChange, 0)
    assert.equal(metrics.totalReturnPct, 0)
    assert.equal(metrics.annualizedRate, 0)
    assert.equal(metrics.isStale, false)
  })
})

describe("Asset Valuation Narrative Synthesis (Gemini & Fallback)", () => {
  const originalApiKey = process.env.GEMINI_API_KEY
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalApiKey
    } else {
      delete process.env.GEMINI_API_KEY
    }
    globalThis.fetch = originalFetch
  })

  it("returns deterministic template fallback when GEMINI_API_KEY is not set", async () => {
    const metrics = {
      initialValue: 3000000,
      latestValue: 2400000,
      nominalChange: -600000,
      totalReturnPct: -20,
      holdingPeriodYears: 2,
      annualizedRate: -0.1056,
      isDepreciatingCategory: true,
      benchmarkRate: -0.15,
      benchmarkDelta: 0.0444,
      performance: "outperforming" as const,
      daysSinceLastValuation: 10,
      isStale: false,
      valuationsCount: 2,
    }

    const briefing = await generateAssetValuationBriefing(
      "Honda Civic",
      "vehicle",
      metrics,
      "USD"
    )

    assert.equal(briefing.isAiGenerated, false)
    assert.ok(briefing.summary.includes("Honda Civic"))
    assert.ok(briefing.summary.includes("-20.0%"))
    assert.ok(briefing.focalAdvice.length > 10)
  })

  it("handles Gemini API failure gracefully by falling back with isAiGenerated: false", async () => {
    process.env.GEMINI_API_KEY = "test-key"

    globalThis.fetch = async () => {
      return {
        ok: false,
        statusText: "Internal Server Error",
      } as Response
    }

    const metrics = {
      initialValue: 5000000,
      latestValue: 6000000,
      nominalChange: 1000000,
      totalReturnPct: 20,
      holdingPeriodYears: 1.5,
      annualizedRate: 0.12,
      isDepreciatingCategory: false,
      benchmarkRate: 0.055,
      benchmarkDelta: 0.065,
      performance: "outperforming" as const,
      daysSinceLastValuation: 20,
      isStale: false,
      valuationsCount: 3,
    }

    const briefing = await generateAssetValuationBriefing(
      "Downtown Apartment",
      "real_estate",
      metrics,
      "USD"
    )

    assert.equal(briefing.isAiGenerated, false)
    assert.ok(briefing.summary.includes("Downtown Apartment"))
  })

  it("successfully parses AI narrative briefing when Gemini API succeeds", async () => {
    process.env.GEMINI_API_KEY = "test-key"

    const mockAiResponse = {
      summary: "Downtown Apartment has appreciated strongly by +20% over 1.5 years.",
      focalAdvice: "Review your property tax assessment and consider updating insurance policy values.",
    }

    globalThis.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockAiResponse) }],
              },
            },
          ],
        }),
      } as Response
    }

    const metrics = {
      initialValue: 5000000,
      latestValue: 6000000,
      nominalChange: 1000000,
      totalReturnPct: 20,
      holdingPeriodYears: 1.5,
      annualizedRate: 0.12,
      isDepreciatingCategory: false,
      benchmarkRate: 0.055,
      benchmarkDelta: 0.065,
      performance: "outperforming" as const,
      daysSinceLastValuation: 20,
      isStale: false,
      valuationsCount: 3,
    }

    const briefing = await generateAssetValuationBriefing(
      "Downtown Apartment",
      "real_estate",
      metrics,
      "USD"
    )

    assert.equal(briefing.isAiGenerated, true)
    assert.equal(briefing.summary, mockAiResponse.summary)
    assert.equal(briefing.focalAdvice, mockAiResponse.focalAdvice)
  })
})
