import type { Asset, AssetValuation, AssetCategory } from "@/types"

export interface AssetValuationMetrics {
  initialValue: number
  latestValue: number
  nominalChange: number
  totalReturnPct: number
  holdingPeriodYears: number
  annualizedRate: number // decimal, e.g. 0.085 for +8.5%, -0.12 for -12%
  isDepreciatingCategory: boolean
  benchmarkRate: number // decimal
  benchmarkDelta: number // decimal difference vs benchmark
  performance: "outperforming" | "in_line" | "underperforming"
  daysSinceLastValuation: number
  isStale: boolean
  valuationsCount: number
}

export interface AssetValuationBriefing {
  summary: string
  focalAdvice: string
  isAiGenerated: boolean
}

const CATEGORY_BENCHMARKS: Record<
  AssetCategory,
  { rate: number; isDepreciating: boolean; label: string }
> = {
  vehicle: { rate: -0.15, isDepreciating: true, label: "Vehicles (-15%/yr standard curve)" },
  auto_loan: { rate: 0, isDepreciating: false, label: "Auto Loan" },
  real_estate: { rate: 0.055, isDepreciating: false, label: "Real Estate (+5.5%/yr historical)" },
  mortgage: { rate: 0, isDepreciating: false, label: "Mortgage" },
  gold: { rate: 0.08, isDepreciating: false, label: "Precious Metals (+8.0%/yr CAGR)" },
  crypto: { rate: 0.15, isDepreciating: false, label: "Crypto Index Benchmark" },
  investment: { rate: 0.09, isDepreciating: false, label: "Market Benchmark (+9.0%/yr)" },
  cash: { rate: 0.0, isDepreciating: false, label: "Cash (Stable)" },
  other: { rate: 0.03, isDepreciating: false, label: "Consumer Inflation Baseline (+3.0%/yr)" },
  student_loan: { rate: 0, isDepreciating: false, label: "Student Loan" },
  personal_loan: { rate: 0, isDepreciating: false, label: "Personal Loan" },
  credit_card: { rate: 0, isDepreciating: false, label: "Credit Card" },
}

/**
 * Pure deterministic calculation engine for Net Worth asset performance metrics.
 */
export function calculateAssetValuationMetrics(
  asset: Pick<Asset, "category" | "currentValue" | "currency" | "acquiredAt" | "createdAt">,
  valuations: Array<Pick<AssetValuation, "date" | "value">>,
  referenceDate: Date = new Date()
): AssetValuationMetrics {
  const sorted = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const benchmarkConfig =
    CATEGORY_BENCHMARKS[asset.category] || CATEGORY_BENCHMARKS.other
  const isDepreciatingCategory = benchmarkConfig.isDepreciating
  const benchmarkRate = benchmarkConfig.rate

  // 1. Determine Initial and Latest Values
  let initialValue = asset.currentValue
  let initialDate = asset.acquiredAt
    ? new Date(asset.acquiredAt)
    : new Date(asset.createdAt || referenceDate)

  let latestValue = asset.currentValue
  let latestDate = initialDate

  if (sorted.length > 0) {
    initialValue = sorted[0].value
    initialDate = new Date(sorted[0].date)
    latestValue = sorted[sorted.length - 1].value
    latestDate = new Date(sorted[sorted.length - 1].date)
  }

  // 2. Holding period in years (safeguard minimum to ~1 month = 0.083 years to prevent zero/infinity)
  const msElapsed = Math.max(0, referenceDate.getTime() - initialDate.getTime())
  const holdingPeriodYears = Math.max(0.083, msElapsed / (365.25 * 24 * 3600 * 1000))

  // 3. Nominal change and total return
  const nominalChange = latestValue - initialValue
  const totalReturnPct =
    initialValue > 0 ? (nominalChange / initialValue) * 100 : 0

  // 4. Annualized Return or Depreciation Rate
  let annualizedRate = 0
  if (initialValue > 0 && latestValue > 0 && holdingPeriodYears > 0) {
    if (sorted.length <= 1 && msElapsed < 30 * 24 * 3600 * 1000) {
      // If newly logged with 1 valuation point, default to category benchmark
      annualizedRate = 0
    } else {
      annualizedRate = Math.pow(latestValue / initialValue, 1 / holdingPeriodYears) - 1
    }
  }

  // 5. Benchmark comparisons
  const benchmarkDelta = annualizedRate - benchmarkRate
  let performance: "outperforming" | "in_line" | "underperforming" = "in_line"

  if (isDepreciatingCategory) {
    // For depreciating assets: higher annualizedRate (e.g. -8% vs -15%) means depreciating slower (outperforming)
    if (annualizedRate > benchmarkRate + 0.03) {
      performance = "outperforming"
    } else if (annualizedRate < benchmarkRate - 0.03) {
      performance = "underperforming"
    }
  } else {
    // For appreciating assets: higher annualizedRate means outperforming
    if (annualizedRate > benchmarkRate + 0.02) {
      performance = "outperforming"
    } else if (annualizedRate < benchmarkRate - 0.02) {
      performance = "underperforming"
    }
  }

  // 6. Staleness evaluation
  const msSinceValuation = Math.max(0, referenceDate.getTime() - latestDate.getTime())
  const daysSinceLastValuation = Math.floor(
    msSinceValuation / (24 * 3600 * 1000)
  )
  const isStale = daysSinceLastValuation > 90

  return {
    initialValue,
    latestValue,
    nominalChange,
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    holdingPeriodYears: Number(holdingPeriodYears.toFixed(2)),
    annualizedRate: Number(annualizedRate.toFixed(4)),
    isDepreciatingCategory,
    benchmarkRate,
    benchmarkDelta: Number(benchmarkDelta.toFixed(4)),
    performance,
    daysSinceLastValuation,
    isStale,
    valuationsCount: sorted.length,
  }
}

/**
 * Synthesizes an executive valuation briefing and focal advice using Gemini 1.5 Flash
 * with a zero-latency deterministic fallback.
 */
export async function generateAssetValuationBriefing(
  assetName: string,
  category: AssetCategory,
  metrics: AssetValuationMetrics,
  currency: string
): Promise<AssetValuationBriefing> {
  const ratePct = (metrics.annualizedRate * 100).toFixed(1)
  const totalReturnStr = `${metrics.totalReturnPct >= 0 ? "+" : ""}${metrics.totalReturnPct.toFixed(1)}%`
  const initialFormatted = (metrics.initialValue / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const latestFormatted = (metrics.latestValue / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Deterministic Default Summary
  let defaultSummary = ""
  if (metrics.valuationsCount <= 1) {
    defaultSummary = `${assetName} is currently recorded at ${latestFormatted} ${currency}. Log periodic valuations to track its performance curve against ${category.replace("_", " ")} benchmarks.`
  } else if (metrics.isDepreciatingCategory) {
    defaultSummary = `${assetName} has changed by ${totalReturnStr} (${ratePct}%/yr) over ${metrics.holdingPeriodYears} years. Its depreciation profile is ${metrics.performance.replace("_", " ")} the standard category curve.`
  } else {
    defaultSummary = `${assetName} has achieved ${totalReturnStr} total return (${ratePct}%/yr annualized) from an initial ${initialFormatted} ${currency} baseline.`
  }

  // Deterministic Default Advice
  let defaultAdvice = ""
  if (metrics.isStale) {
    defaultAdvice = `Last valuation was logged ${metrics.daysSinceLastValuation} days ago. Consider recording an updated appraisal to keep your net worth accurate.`
  } else if (metrics.isDepreciatingCategory && metrics.performance === "underperforming") {
    defaultAdvice = `Depreciation is outpacing standard market curves. Review maintenance costs and reassess your asset replacement timeline.`
  } else if (!metrics.isDepreciatingCategory && metrics.performance === "outperforming") {
    defaultAdvice = `Strong appreciation outperforming baseline benchmarks. Consider re-evaluating insurance coverage and capital gains impact.`
  } else {
    defaultAdvice = `Valuation tracking is active and healthy. Keep updating valuations whenever significant market or condition changes occur.`
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      summary: defaultSummary,
      focalAdvice: defaultAdvice,
      isAiGenerated: false,
    }
  }

  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are Dime's Chief Valuation Analyst. Analyze this personal finance asset:
- Asset: "${assetName}" (${category})
- Initial value: ${initialFormatted} ${currency}
- Current value: ${latestFormatted} ${currency}
- Total return: ${totalReturnStr}
- Annualized rate: ${ratePct}%/yr
- Category benchmark: ${(metrics.benchmarkRate * 100).toFixed(1)}%/yr
- Performance: ${metrics.performance}
- Days since last valuation: ${metrics.daysSinceLastValuation} days (Stale: ${metrics.isStale})

Write a concise 2-sentence executive valuation summary, followed by 1 actionable focal advice sentence.
Do not invent numbers or facts. Output ONLY a valid JSON object with keys "summary" and "focalAdvice".`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000), // 4-second timeout
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) {
      throw new Error("Empty response from Gemini")
    }

    const parsed = JSON.parse(contentText)
    return {
      summary: parsed.summary || defaultSummary,
      focalAdvice: parsed.focalAdvice || defaultAdvice,
      isAiGenerated: true,
    }
  } catch {
    return {
      summary: defaultSummary,
      focalAdvice: defaultAdvice,
      isAiGenerated: false,
    }
  }
}
