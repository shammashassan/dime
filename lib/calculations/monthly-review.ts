import type {
  Transaction,
  Category,
  Budget,
  Goal,
  Loan,
  LoanRepayment,
  MonthlyReviewCategorySpend,
  MonthlyReviewBudgetStatus,
  MonthlyReviewGoalContribution,
  MonthlyReviewLoanPaydown,
  MonthlyReviewTransactionItem,
  MonthlyReviewSummaryBrief,
} from "@/types"

export function formatCurrency(amountInCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amountInCents / 100)
}

export function convertAmount(
  cents: number,
  fromCurrency: string,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  if (!fromCurrency || fromCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
    return cents
  }
  const fromRate = rates[fromCurrency.toUpperCase()] || 1
  const toRate = rates[targetCurrency.toUpperCase()] || 1
  return Math.round((cents / fromRate) * toRate)
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-")
  const year = parseInt(yearStr, 10)
  const monthIndex = parseInt(monthStr, 10) - 1
  const d = new Date(Date.UTC(year, monthIndex, 1))
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
}

// ── 1. Monthly Metrics Calculation ──
export function calculateMonthlyMetrics(inputs: {
  targetTransactions: Transaction[]
  baselineTransactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  openingNetWorthCents: number
  closingNetWorthCents: number
}) {
  const {
    targetTransactions,
    baselineTransactions,
    targetCurrency,
    exchangeRates,
    openingNetWorthCents,
    closingNetWorthCents,
  } = inputs

  let totalIncomeCents = 0
  let totalExpenseCents = 0

  for (const tx of targetTransactions) {
    const converted = convertAmount(tx.amount, tx.currency, targetCurrency, exchangeRates)
    if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
      totalIncomeCents += converted
    } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      totalExpenseCents += converted
    }
  }

  const netSavingsCents = totalIncomeCents - totalExpenseCents
  const savingsRatePercentage =
    totalIncomeCents > 0 ? Math.round((netSavingsCents / totalIncomeCents) * 100) : 0

  let previousMonthIncomeCents = 0
  let previousMonthExpenseCents = 0

  for (const tx of baselineTransactions) {
    const converted = convertAmount(tx.amount, tx.currency, targetCurrency, exchangeRates)
    if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
      previousMonthIncomeCents += converted
    } else if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      previousMonthExpenseCents += converted
    }
  }

  const previousMonthNetSavings = previousMonthIncomeCents - previousMonthExpenseCents
  const previousMonthSavingsRate =
    previousMonthIncomeCents > 0
      ? Math.round((previousMonthNetSavings / previousMonthIncomeCents) * 100)
      : 0

  const incomeDeltaPercentage =
    previousMonthIncomeCents > 0
      ? Math.round(
          ((totalIncomeCents - previousMonthIncomeCents) / previousMonthIncomeCents) * 100
        )
      : 0

  const expenseDeltaPercentage =
    previousMonthExpenseCents > 0
      ? Math.round(
          ((totalExpenseCents - previousMonthExpenseCents) / previousMonthExpenseCents) * 100
        )
      : 0

  const netWorthDeltaCents = closingNetWorthCents - openingNetWorthCents

  return {
    totalIncomeCents,
    totalExpenseCents,
    netSavingsCents,
    savingsRatePercentage,
    previousMonthIncomeCents,
    previousMonthExpenseCents,
    previousMonthSavingsRate,
    incomeDeltaPercentage,
    expenseDeltaPercentage,
    openingNetWorthCents,
    closingNetWorthCents,
    netWorthDeltaCents,
  }
}

// ── 2. Category Spend Breakdown & MoM Shift ──
export function calculateCategorySpendBreakdown(inputs: {
  targetTransactions: Transaction[]
  baselineTransactions: Transaction[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}): MonthlyReviewCategorySpend[] {
  const { targetTransactions, baselineTransactions, categories, targetCurrency, exchangeRates } =
    inputs

  const categoryMap = new Map<string, Category>()
  categories.forEach((c) => categoryMap.set(c._id.toString(), c))

  const targetSpendMap = new Map<string, number>()
  const baselineSpendMap = new Map<string, number>()
  let totalExpenseCents = 0

  for (const tx of targetTransactions) {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const converted = convertAmount(tx.amount, tx.currency, targetCurrency, exchangeRates)
      totalExpenseCents += converted
      const catId = tx.categoryId || "uncategorized"
      targetSpendMap.set(catId, (targetSpendMap.get(catId) || 0) + converted)
    }
  }

  for (const tx of baselineTransactions) {
    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      const converted = convertAmount(tx.amount, tx.currency, targetCurrency, exchangeRates)
      const catId = tx.categoryId || "uncategorized"
      baselineSpendMap.set(catId, (baselineSpendMap.get(catId) || 0) + converted)
    }
  }

  const result: MonthlyReviewCategorySpend[] = []

  targetSpendMap.forEach((amountCents, catId) => {
    const category = categoryMap.get(catId)
    const prevSpend = baselineSpendMap.get(catId) || 0
    const percentage = totalExpenseCents > 0 ? Math.round((amountCents / totalExpenseCents) * 100) : 0
    const deltaPercentage =
      prevSpend > 0 ? Math.round(((amountCents - prevSpend) / prevSpend) * 100) : 0

    result.push({
      categoryId: catId,
      categoryName: category?.name || (catId === "uncategorized" ? "Uncategorized" : "Other"),
      categoryIcon: category?.icon,
      categoryColor: category?.color,
      amountCents,
      percentage,
      previousMonthAmountCents: prevSpend,
      deltaPercentage,
    })
  })

  // Sort descending by amount
  return result.sort((a, b) => b.amountCents - a.amountCents)
}

// ── 3. Budget Adherence Scorecard ──
export function calculateBudgetPerformance(inputs: {
  budgets: Budget[]
  categorySpendList: MonthlyReviewCategorySpend[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}): MonthlyReviewBudgetStatus[] {
  const { budgets, categorySpendList, targetCurrency, exchangeRates } = inputs

  const spendByCatId = new Map<string, number>()
  categorySpendList.forEach((cs) => spendByCatId.set(cs.categoryId, cs.amountCents))

  const results: MonthlyReviewBudgetStatus[] = []

  for (const b of budgets) {
    const convertedBudget = convertAmount(b.amount, b.currency || "USD", targetCurrency, exchangeRates)
    const spentCents = spendByCatId.get(b.categoryId) || 0
    const isOverBudget = spentCents > convertedBudget
    const overrunCents = isOverBudget ? spentCents - convertedBudget : 0
    const percentageUsed = convertedBudget > 0 ? Math.round((spentCents / convertedBudget) * 100) : 0

    results.push({
      budgetId: b._id.toString(),
      categoryName: (b as { categoryName?: string }).categoryName || b.name || "Category",
      budgetAmountCents: convertedBudget,
      spentAmountCents: spentCents,
      isOverBudget,
      overrunCents,
      percentageUsed,
    })
  }

  return results.sort((a, b) => b.percentageUsed - a.percentageUsed)
}

// ── 4. Top Single Transactions ──
export function extractTopTransactions(inputs: {
  targetTransactions: Transaction[]
  categories: Category[]
  wallets: { _id: { toString(): string } | string; name: string }[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}): {
  topExpenses: MonthlyReviewTransactionItem[]
  topIncomes: MonthlyReviewTransactionItem[]
} {
  const { targetTransactions, categories, wallets, targetCurrency, exchangeRates } = inputs

  const catMap = new Map<string, Category>()
  categories.forEach((c) => catMap.set(c._id.toString(), c))

  const walletMap = new Map<string, string>()
  wallets.forEach((w) => walletMap.set(w._id.toString(), w.name))

  const expenses: MonthlyReviewTransactionItem[] = []
  const incomes: MonthlyReviewTransactionItem[] = []

  for (const tx of targetTransactions) {
    const converted = convertAmount(tx.amount, tx.currency, targetCurrency, exchangeRates)
    const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined
    const walletName = tx.walletId ? walletMap.get(tx.walletId) : undefined

    const item: MonthlyReviewTransactionItem = {
      id: tx._id.toString(),
      date: tx.date instanceof Date ? tx.date.toISOString().slice(0, 10) : String(tx.date).slice(0, 10),
      name: tx.description || (tx as { name?: string }).name || "Transaction",
      amountCents: converted,
      currency: targetCurrency,
      categoryName: cat?.name,
      categoryColor: cat?.color,
      walletName,
    }

    if (tx.type === "expense" || (tx.type === "transfer" && tx.transferType === "debit")) {
      expenses.push(item)
    } else if (tx.type === "income" || (tx.type === "transfer" && tx.transferType === "credit")) {
      incomes.push(item)
    }
  }

  return {
    topExpenses: expenses.sort((a, b) => b.amountCents - a.amountCents).slice(0, 5),
    topIncomes: incomes.sort((a, b) => b.amountCents - a.amountCents).slice(0, 5),
  }
}

// ── 5. Goal & Loan Progress ──
export function calculateGoalAndLoanProgress(inputs: {
  goals: Goal[]
  loans: Loan[]
  repayments: LoanRepayment[]
  targetMonthStart: Date
  targetMonthEnd: Date
  targetCurrency: string
  exchangeRates: Record<string, number>
}): {
  goalContributions: MonthlyReviewGoalContribution[]
  loanPaydowns: MonthlyReviewLoanPaydown[]
} {
  const {
    goals,
    loans,
    repayments,
    targetMonthStart,
    targetMonthEnd,
    targetCurrency,
    exchangeRates,
  } = inputs

  // Goal progress
  const goalContributions: MonthlyReviewGoalContribution[] = []
  for (const g of goals) {
    const targetCents = convertAmount(g.targetAmount, g.currency || "USD", targetCurrency, exchangeRates)
    const currentCents = convertAmount(g.currentAmount, g.currency || "USD", targetCurrency, exchangeRates)
    const progressPercentage = targetCents > 0 ? Math.min(100, Math.round((currentCents / targetCents) * 100)) : 0

    // Filter goal contributions that happened in this month if logs exist, otherwise track current state
    goalContributions.push({
      goalId: g._id.toString(),
      goalName: g.name,
      contributedThisMonthCents: 0, // baseline
      targetAmountCents: targetCents,
      currentAmountCents: currentCents,
      progressPercentage,
    })
  }

  // Loan paydowns in this month
  const loanMap = new Map<string, Loan>()
  for (const l of loans) {
    loanMap.set(l._id.toString(), l)
  }

  const loanPaydownMap = new Map<string, number>()
  for (const rep of repayments) {
    const repDate = new Date(rep.date)
    if (repDate >= targetMonthStart && repDate <= targetMonthEnd) {
      const loan = loanMap.get(rep.loanId)
      const loanCurrency = loan?.currency || targetCurrency
      const converted = convertAmount(rep.amount, loanCurrency, targetCurrency, exchangeRates)
      loanPaydownMap.set(rep.loanId, (loanPaydownMap.get(rep.loanId) || 0) + converted)
    }
  }

  const loanPaydowns: MonthlyReviewLoanPaydown[] = []
  for (const l of loans) {
    const paidCents = loanPaydownMap.get(l._id.toString()) || 0
    if (paidCents > 0 || l.status === "active") {
      const remainingCents = convertAmount(
        l.remainingAmount,
        l.currency || "USD",
        targetCurrency,
        exchangeRates
      )
      loanPaydowns.push({
        loanId: l._id.toString(),
        loanName: l.personName || (l as { name?: string }).name || "Loan",
        principalPaidCents: paidCents,
        remainingBalanceCents: remainingCents,
      })
    }
  }

  return { goalContributions, loanPaydowns }
}

// ── 6. Deterministic Executive Briefing ──
export function generateDeterministicReviewBrief(inputs: {
  monthLabel: string
  metrics: {
    totalIncomeCents: number
    totalExpenseCents: number
    netSavingsCents: number
    savingsRatePercentage: number
    netWorthDeltaCents: number
  }
  categoryBreakdown: MonthlyReviewCategorySpend[]
  budgetPerformance: MonthlyReviewBudgetStatus[]
  topExpenses: MonthlyReviewTransactionItem[]
  currency: string
}): MonthlyReviewSummaryBrief {
  const { monthLabel, metrics, categoryBreakdown, budgetPerformance, topExpenses, currency } =
    inputs

  const { totalIncomeCents, totalExpenseCents, netSavingsCents, savingsRatePercentage, netWorthDeltaCents } =
    metrics

  // Dynamic Headline
  let headline = ""
  if (savingsRatePercentage >= 35) {
    headline = `Exceptional savings velocity! You retained ${savingsRatePercentage}% of total income in ${monthLabel}.`
  } else if (savingsRatePercentage >= 20) {
    headline = `Strong financial performance with a healthy ${savingsRatePercentage}% savings rate in ${monthLabel}.`
  } else if (savingsRatePercentage > 0) {
    headline = `Positive cash flow achieved with ${formatCurrency(netSavingsCents, currency)} saved in ${monthLabel}.`
  } else if (totalIncomeCents === 0 && totalExpenseCents === 0) {
    headline = `Zero financial transactions logged for ${monthLabel}.`
  } else {
    headline = `Outflows exceeded inflows by ${formatCurrency(Math.abs(netSavingsCents), currency)} in ${monthLabel}.`
  }

  // Summary narrative
  const summary =
    totalIncomeCents > 0
      ? `During ${monthLabel}, total inflows stood at ${formatCurrency(totalIncomeCents, currency)} against ${formatCurrency(totalExpenseCents, currency)} in living expenses. Your net capital position shifted by ${netWorthDeltaCents >= 0 ? "+" : ""}${formatCurrency(netWorthDeltaCents, currency)}.`
      : `No incoming salary or deposits were recorded for ${monthLabel}, with ${formatCurrency(totalExpenseCents, currency)} recorded in expenses.`

  // Highlights
  const highlights: string[] = []
  if (netSavingsCents > 0) {
    highlights.push(
      `Retained ${formatCurrency(netSavingsCents, currency)} (${savingsRatePercentage}% net savings rate).`
    )
  }
  const onTrackBudgets = budgetPerformance.filter((b) => !b.isOverBudget).length
  if (budgetPerformance.length > 0) {
    highlights.push(
      `${onTrackBudgets} of ${budgetPerformance.length} budget categories remained strictly within spending limits.`
    )
  }
  if (netWorthDeltaCents > 0) {
    highlights.push(
      `Net worth expanded by ${formatCurrency(netWorthDeltaCents, currency)} through the course of the month.`
    )
  } else if (categoryBreakdown.length > 0) {
    const topCat = categoryBreakdown[0]
    highlights.push(
      `Top spending area was ${topCat.categoryName} representing ${topCat.percentage}% of all expenses.`
    )
  }

  // Concerns / Leakages
  const concerns: string[] = []
  const overBudgetItems = budgetPerformance.filter((b) => b.isOverBudget)
  if (overBudgetItems.length > 0) {
    const worst = overBudgetItems[0]
    concerns.push(
      `${worst.categoryName} exceeded allocated budget by ${formatCurrency(worst.overrunCents, currency)} (${worst.percentageUsed}% of budget).`
    )
  }
  const bigSpikes = categoryBreakdown.filter((c) => c.deltaPercentage > 25 && c.amountCents > 5000)
  if (bigSpikes.length > 0) {
    concerns.push(
      `${bigSpikes[0].categoryName} spend surged by ${bigSpikes[0].deltaPercentage}% compared to the prior month.`
    )
  }
  if (topExpenses.length > 0 && topExpenses[0].amountCents > totalExpenseCents * 0.3) {
    concerns.push(
      `Single largest purchase ("${topExpenses[0].name}") accounted for over 30% of entire month's spend.`
    )
  }

  // Recommendations
  const recommendations: string[] = []
  if (overBudgetItems.length > 0) {
    recommendations.push(
      `Calibrate your ${overBudgetItems[0].categoryName} budget ceiling or trim discretionary purchases in this category.`
    )
  }
  if (savingsRatePercentage < 20 && totalIncomeCents > 0) {
    recommendations.push(
      `Automate a 10% transfer to a dedicated savings or investment wallet immediately upon salary deposit next month.`
    )
  } else {
    recommendations.push(
      `Maintain current spending discipline and deploy month surpluses toward high-priority financial goals.`
    )
  }

  // Next Month Outlook
  const nextMonthOutlook =
    savingsRatePercentage >= 20
      ? `Carrying forward this savings momentum will significantly accelerate your debt payoff timelines and wealth milestones.`
      : `Tightening discretionary leakages identified in this review will help restore your target 20%+ net savings rate.`

  return {
    headline,
    summary,
    highlights: highlights.slice(0, 3),
    concerns: concerns.slice(0, 3),
    recommendations: recommendations.slice(0, 2),
    nextMonthOutlook,
    isAiGenerated: false,
  }
}

// ── 7. On-Demand AI Review Briefing (Gemini 1.5 Flash with fallback) ──
export async function generateAiReviewBrief(inputs: {
  monthLabel: string
  metrics: {
    totalIncomeCents: number
    totalExpenseCents: number
    netSavingsCents: number
    savingsRatePercentage: number
    netWorthDeltaCents: number
  }
  categoryBreakdown: MonthlyReviewCategorySpend[]
  budgetPerformance: MonthlyReviewBudgetStatus[]
  topExpenses: MonthlyReviewTransactionItem[]
  currency: string
}): Promise<MonthlyReviewSummaryBrief> {
  const fallback = generateDeterministicReviewBrief(inputs)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallback

  const { monthLabel, metrics, categoryBreakdown, budgetPerformance, topExpenses, currency } =
    inputs

  try {
    const prompt = `You are Dime's Chief Financial Analyst. Generate a concise, highly personalized monthly financial review retrospective for ${monthLabel}.
Financial Facts:
- Inflow (Income): ${(metrics.totalIncomeCents / 100).toFixed(0)} ${currency}
- Outflow (Expenses): ${(metrics.totalExpenseCents / 100).toFixed(0)} ${currency}
- Net Saved: ${(metrics.netSavingsCents / 100).toFixed(0)} ${currency} (${metrics.savingsRatePercentage}% savings rate)
- Net Worth Change: ${(metrics.netWorthDeltaCents / 100).toFixed(0)} ${currency}
- Top Categories: ${categoryBreakdown.slice(0, 4).map((c) => `${c.categoryName}: ${(c.amountCents / 100).toFixed(0)} ${currency} (${c.deltaPercentage >= 0 ? "+" : ""}${c.deltaPercentage}% MoM)`).join(", ")}
- Budget Overruns: ${budgetPerformance.filter((b) => b.isOverBudget).map((b) => `${b.categoryName} (+${(b.overrunCents / 100).toFixed(0)} ${currency})`).join(", ") || "None"}
- Top Single Expense: ${topExpenses[0] ? `${topExpenses[0].name} (${(topExpenses[0].amountCents / 100).toFixed(0)} ${currency})` : "None"}

Return ONLY valid JSON matching this schema:
{
  "headline": "1 clear, impactful executive takeaway statement (max 15 words)",
  "summary": "2 sentences synthesizing the month's financial trajectory",
  "highlights": ["1 to 3 fact-based positive wins with numbers"],
  "concerns": ["1 to 2 honest callouts regarding spending spikes or budget overruns"],
  "recommendations": ["1 to 2 specific, actionable targets for next month"],
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
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 3) : fallback.concerns,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 2) : fallback.recommendations,
      nextMonthOutlook: parsed.nextMonthOutlook || fallback.nextMonthOutlook,
      isAiGenerated: true,
    }
  } catch {
    return fallback
  }
}
