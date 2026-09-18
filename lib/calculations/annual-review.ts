import type {
  Transaction,
  Category,
  PeriodReviewMetrics,
  PeriodReviewCategorySpend,
  PeriodReviewMonthlyBreakdown,
  MonthlyReviewSummaryBrief,
  AnnualReviewData,
} from "@/types"
import { convertAmount, formatCurrency } from "@/lib/calculations/monthly-review"

export function getQuarterMonths(year: number, quarter: 1 | 2 | 3 | 4): string[] {
  const startMonth = (quarter - 1) * 3 + 1
  return [
    `${year}-${String(startMonth).padStart(2, "0")}`,
    `${year}-${String(startMonth + 1).padStart(2, "0")}`,
    `${year}-${String(startMonth + 2).padStart(2, "0")}`,
  ]
}

export function getQuarterDateRange(year: number, quarter: 1 | 2 | 3 | 4): { start: Date; end: Date } {
  const startMonthIdx = (quarter - 1) * 3
  const start = new Date(Date.UTC(year, startMonthIdx, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, startMonthIdx + 3, 0, 23, 59, 59, 999))
  return { start, end }
}

export function getAnnualDateRange(year: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
  return { start, end }
}

export function getPreviousQuarter(year: number, quarter: 1 | 2 | 3 | 4): { year: number; quarter: 1 | 2 | 3 | 4 } {
  if (quarter === 1) {
    return { year: year - 1, quarter: 4 }
  }
  return { year, quarter: (quarter - 1) as 1 | 2 | 3 | 4 }
}

const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatShortMonthLabel(monthKey: string): string {
  const [, monthStr] = monthKey.split("-")
  const mIdx = parseInt(monthStr, 10) - 1
  return SHORT_MONTH_NAMES[mIdx] || monthKey
}

export function aggregatePeriodMetrics(params: {
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  openingNetWorthCents: number
  closingNetWorthCents: number
}): PeriodReviewMetrics {
  const { transactions, targetCurrency, exchangeRates, openingNetWorthCents, closingNetWorthCents } = params

  let totalIncomeCents = 0
  let totalExpenseCents = 0

  for (const tx of transactions) {
    const converted = convertAmount(tx.amount, tx.currency || "USD", targetCurrency, exchangeRates)
    if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
      totalIncomeCents += converted
    } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      totalExpenseCents += converted
    }
  }

  const netSavingsCents = totalIncomeCents - totalExpenseCents
  const savingsRatePercentage =
    totalIncomeCents > 0 ? Math.round((netSavingsCents / totalIncomeCents) * 100) : 0
  const netWorthDeltaCents = closingNetWorthCents - openingNetWorthCents

  return {
    totalIncomeCents,
    totalExpenseCents,
    netSavingsCents,
    savingsRatePercentage,
    netWorthOpeningCents: openingNetWorthCents,
    netWorthClosingCents: closingNetWorthCents,
    netWorthDeltaCents,
  }
}

export function aggregateCategoryBreakdown(params: {
  currentTransactions: Transaction[]
  previousTransactions: Transaction[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}): PeriodReviewCategorySpend[] {
  const { currentTransactions, previousTransactions, categories, targetCurrency, exchangeRates } = params

  const catMap = new Map<string, Category>()
  categories.forEach((c) => catMap.set(c._id.toString(), c))

  const currentSpendMap = new Map<string, number>()
  const previousSpendMap = new Map<string, number>()
  let totalExpenseCents = 0

  for (const tx of currentTransactions) {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const converted = convertAmount(tx.amount, tx.currency || "USD", targetCurrency, exchangeRates)
      totalExpenseCents += converted
      const catId = tx.categoryId || "uncategorized"
      currentSpendMap.set(catId, (currentSpendMap.get(catId) || 0) + converted)
    }
  }

  for (const tx of previousTransactions) {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const converted = convertAmount(tx.amount, tx.currency || "USD", targetCurrency, exchangeRates)
      const catId = tx.categoryId || "uncategorized"
      previousSpendMap.set(catId, (previousSpendMap.get(catId) || 0) + converted)
    }
  }

  const result: PeriodReviewCategorySpend[] = []

  currentSpendMap.forEach((amountCents, catId) => {
    const category = catMap.get(catId)
    const prevAmountCents = previousSpendMap.get(catId) || 0
    const percentage = totalExpenseCents > 0 ? Math.round((amountCents / totalExpenseCents) * 100) : 0
    const deltaPercentage =
      prevAmountCents > 0 ? Math.round(((amountCents - prevAmountCents) / prevAmountCents) * 100) : 0

    result.push({
      categoryId: catId,
      categoryName: category?.name || (catId === "uncategorized" ? "Uncategorized" : "Other"),
      categoryIcon: category?.icon,
      categoryColor: category?.color,
      amountCents,
      percentage,
      previousPeriodAmountCents: prevAmountCents,
      deltaPercentage,
    })
  })

  return result.sort((a, b) => b.amountCents - a.amountCents).slice(0, 8)
}

export function buildMonthlyBreakdown(params: {
  transactions: Transaction[]
  months: string[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}): PeriodReviewMonthlyBreakdown[] {
  const { transactions, months, targetCurrency, exchangeRates } = params

  const monthDataMap = new Map<string, { incomeCents: number; expenseCents: number }>()
  for (const m of months) {
    monthDataMap.set(m, { incomeCents: 0, expenseCents: 0 })
  }

  for (const tx of transactions) {
    const txDate = new Date(tx.date)
    const y = txDate.getUTCFullYear()
    const m = String(txDate.getUTCMonth() + 1).padStart(2, "0")
    const key = `${y}-${m}`

    const entry = monthDataMap.get(key)
    if (entry) {
      const converted = convertAmount(tx.amount, tx.currency || "USD", targetCurrency, exchangeRates)
      if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
        entry.incomeCents += converted
      } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
        entry.expenseCents += converted
      }
    }
  }

  return months.map((monthKey) => {
    const entry = monthDataMap.get(monthKey) || { incomeCents: 0, expenseCents: 0 }
    return {
      monthKey,
      monthLabel: formatShortMonthLabel(monthKey),
      incomeCents: entry.incomeCents,
      expenseCents: entry.expenseCents,
      netSavingsCents: entry.incomeCents - entry.expenseCents,
    }
  })
}

export function buildQuarterlyBreakdown(
  monthlyBreakdown: PeriodReviewMonthlyBreakdown[]
): AnnualReviewData["quarterlyBreakdown"] {
  const quarters: { [q: number]: { incomeCents: number; expenseCents: number; netSavingsCents: number } } = {
    1: { incomeCents: 0, expenseCents: 0, netSavingsCents: 0 },
    2: { incomeCents: 0, expenseCents: 0, netSavingsCents: 0 },
    3: { incomeCents: 0, expenseCents: 0, netSavingsCents: 0 },
    4: { incomeCents: 0, expenseCents: 0, netSavingsCents: 0 },
  }

  for (const mb of monthlyBreakdown) {
    const monthNum = parseInt(mb.monthKey.split("-")[1], 10)
    const quarter = Math.ceil(monthNum / 3) as 1 | 2 | 3 | 4
    quarters[quarter].incomeCents += mb.incomeCents
    quarters[quarter].expenseCents += mb.expenseCents
    quarters[quarter].netSavingsCents += mb.netSavingsCents
  }

  return (([1, 2, 3, 4] as const).map((q) => ({
    quarter: q,
    label: `Q${q}`,
    incomeCents: quarters[q].incomeCents,
    expenseCents: quarters[q].expenseCents,
    netSavingsCents: quarters[q].netSavingsCents,
  })))
}

export function generateDeterministicPeriodBrief(params: {
  metrics: PeriodReviewMetrics
  topCategories: PeriodReviewCategorySpend[]
  periodLabel: string
  previousMetrics: PeriodReviewMetrics | null
  targetCurrency: string
}): MonthlyReviewSummaryBrief {
  const { metrics, topCategories, periodLabel, previousMetrics, targetCurrency } = params
  const { totalIncomeCents, totalExpenseCents, netSavingsCents, savingsRatePercentage, netWorthDeltaCents } = metrics

  let headline = ""
  if (savingsRatePercentage >= 35) {
    headline = `Outstanding wealth accumulation! You saved ${savingsRatePercentage}% of income in ${periodLabel}.`
  } else if (savingsRatePercentage >= 20) {
    headline = `Solid financial health with a ${savingsRatePercentage}% savings rate in ${periodLabel}.`
  } else if (savingsRatePercentage > 0) {
    headline = `Positive cash flow achieved with ${formatCurrency(netSavingsCents, targetCurrency)} saved in ${periodLabel}.`
  } else if (totalIncomeCents === 0 && totalExpenseCents === 0) {
    headline = `No financial activity recorded for ${periodLabel}.`
  } else {
    headline = `Expenses exceeded inflows by ${formatCurrency(Math.abs(netSavingsCents), targetCurrency)} in ${periodLabel}.`
  }

  const summary =
    totalIncomeCents > 0
      ? `Across ${periodLabel}, total income reached ${formatCurrency(totalIncomeCents, targetCurrency)} against ${formatCurrency(totalExpenseCents, targetCurrency)} in living expenses. Net worth shifted by ${netWorthDeltaCents >= 0 ? "+" : ""}${formatCurrency(netWorthDeltaCents, targetCurrency)}.`
      : `No incoming income deposits were logged for ${periodLabel}, with ${formatCurrency(totalExpenseCents, targetCurrency)} recorded in total expenses.`

  const highlights: string[] = []
  if (netSavingsCents > 0) {
    highlights.push(
      `Retained ${formatCurrency(netSavingsCents, targetCurrency)} with a cumulative ${savingsRatePercentage}% savings rate.`
    )
  }
  if (previousMetrics && previousMetrics.totalExpenseCents > 0) {
    const expenseDeltaPct = Math.round(
      ((totalExpenseCents - previousMetrics.totalExpenseCents) / previousMetrics.totalExpenseCents) * 100
    )
    if (expenseDeltaPct < 0) {
      highlights.push(`Reduced overall spending by ${Math.abs(expenseDeltaPct)}% compared to the prior period.`)
    }
  }
  if (netWorthDeltaCents > 0) {
    highlights.push(`Net capital grew by ${formatCurrency(netWorthDeltaCents, targetCurrency)} over this period.`)
  } else if (topCategories.length > 0) {
    highlights.push(`Top expense area was ${topCategories[0].categoryName} (${topCategories[0].percentage}% of spend).`)
  }

  const concerns: string[] = []
  if (previousMetrics && previousMetrics.totalExpenseCents > 0) {
    const expenseDeltaPct = Math.round(
      ((totalExpenseCents - previousMetrics.totalExpenseCents) / previousMetrics.totalExpenseCents) * 100
    )
    if (expenseDeltaPct > 15) {
      concerns.push(`Overall expenses increased by ${expenseDeltaPct}% compared to the previous period.`)
    }
  }
  const topSpike = topCategories.find((c) => c.deltaPercentage > 30 && c.amountCents > 10000)
  if (topSpike) {
    concerns.push(`${topSpike.categoryName} spending grew ${topSpike.deltaPercentage}% vs the previous period.`)
  }
  if (netSavingsCents < 0) {
    concerns.push(`Net negative savings rate of ${savingsRatePercentage}% experienced across ${periodLabel}.`)
  }

  const recommendations: string[] = []
  if (topCategories.length > 0 && topCategories[0].percentage > 35) {
    recommendations.push(
      `Audit ${topCategories[0].categoryName} purchases to ensure concentration doesn't crowd out essential long-term investments.`
    )
  }
  if (savingsRatePercentage < 20 && totalIncomeCents > 0) {
    recommendations.push(
      `Target a baseline 20% savings rate by setting recurring transfers on paydays to ring-fence savings.`
    )
  } else {
    recommendations.push(
      `Deploy period surpluses toward accelerating debt payoffs and building multi-asset portfolio reserves.`
    )
  }

  const nextMonthOutlook =
    savingsRatePercentage >= 20
      ? `Strong fiscal discipline provides compounding momentum for your future net worth goals.`
      : `Refining spending in high-variance categories will help stabilize cash flow and elevate your savings rate.`

  return {
    headline,
    summary,
    highlights: highlights.slice(0, 3),
    concerns: concerns.slice(0, 2),
    recommendations: recommendations.slice(0, 2),
    nextMonthOutlook,
    isAiGenerated: false,
  }
}

export async function generateAiPeriodBrief(params: {
  metrics: PeriodReviewMetrics
  topCategories: PeriodReviewCategorySpend[]
  periodLabel: string
  previousMetrics: PeriodReviewMetrics | null
  targetCurrency: string
}): Promise<MonthlyReviewSummaryBrief> {
  const fallback = generateDeterministicPeriodBrief(params)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallback

  const { metrics, topCategories, periodLabel, targetCurrency } = params

  try {
    const prompt = `You are Dime's Chief Financial Officer. Generate an executive financial review retrospective for ${periodLabel}.
Financial Facts:
- Inflows: ${(metrics.totalIncomeCents / 100).toFixed(0)} ${targetCurrency}
- Outflows: ${(metrics.totalExpenseCents / 100).toFixed(0)} ${targetCurrency}
- Net Saved: ${(metrics.netSavingsCents / 100).toFixed(0)} ${targetCurrency} (${metrics.savingsRatePercentage}% savings rate)
- Net Worth Change: ${(metrics.netWorthDeltaCents / 100).toFixed(0)} ${targetCurrency}
- Top Categories: ${topCategories.slice(0, 5).map((c) => `${c.categoryName}: ${(c.amountCents / 100).toFixed(0)} ${targetCurrency} (${c.deltaPercentage >= 0 ? "+" : ""}${c.deltaPercentage}% vs prior)`).join(", ")}

Return ONLY valid JSON matching this schema:
{
  "headline": "1 clear, impactful executive takeaway statement (max 15 words)",
  "summary": "2 sentences synthesizing the period's financial trajectory",
  "highlights": ["1 to 3 fact-based positive wins with numbers"],
  "concerns": ["1 to 2 honest callouts regarding spending spikes or leakages"],
  "recommendations": ["1 to 2 specific, actionable targets for next period"],
  "nextMonthOutlook": "1 forward-looking motivational sentence"
}
Strict Rule: Professional and encouraging tone. Never provide legal or registered investment advice.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!response.ok) return fallback
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return fallback

    const parsed = JSON.parse(text)
    return {
      headline: parsed.headline || fallback.headline,
      summary: parsed.summary || fallback.summary,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : fallback.highlights,
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 2) : fallback.concerns,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 2) : fallback.recommendations,
      nextMonthOutlook: parsed.nextMonthOutlook || fallback.nextMonthOutlook,
      isAiGenerated: true,
    }
  } catch {
    return fallback
  }
}
