import type {
  Transaction,
  Category,
  Budget,
  RecurringRule,
  UserInsightState,
  SpendingInsight,
  SpendingInsightsData,
} from "@/types"

export interface InsightEngineInputs {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  recurringRules: RecurringRule[]
  userStates?: UserInsightState[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}

export function formatCurrency(amountInCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100)
}

/**
 * Normalizes vendor or transaction description for robust grouping and duplicate matching.
 * Lowercases, strips punctuation and non-alphanumeric characters, and trims.
 */
export function normalizeDescription(desc: string): string {
  return (desc || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
}

/**
 * Converts amount in smallest unit (cents/paise) to target currency using exchange rates.
 */
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

// ── 1. Category Spikes Detector ──
export function detectCategorySpikes(inputs: {
  transactions: Transaction[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): SpendingInsight[] {
  const { transactions, categories, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]))
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const d60 = d0 - 60 * 86400000
  const d90 = d0 - 90 * 86400000
  const d120 = d0 - 120 * 86400000

  const currentSpend: Record<string, number> = {}
  const p1Spend: Record<string, number> = {}
  const p2Spend: Record<string, number> = {}
  const p3Spend: Record<string, number> = {}
  const baselineCount: Record<string, number> = {}

  for (const t of transactions) {
    if (t.type !== "expense") continue
    const catId = t.categoryId || "uncategorized"
    const amount = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    const time = new Date(t.date).getTime()

    if (time >= d30 && time <= d0) {
      currentSpend[catId] = (currentSpend[catId] || 0) + amount
    } else if (time >= d60 && time < d30) {
      p1Spend[catId] = (p1Spend[catId] || 0) + amount
      baselineCount[catId] = (baselineCount[catId] || 0) + 1
    } else if (time >= d90 && time < d60) {
      p2Spend[catId] = (p2Spend[catId] || 0) + amount
      baselineCount[catId] = (baselineCount[catId] || 0) + 1
    } else if (time >= d120 && time < d90) {
      p3Spend[catId] = (p3Spend[catId] || 0) + amount
      baselineCount[catId] = (baselineCount[catId] || 0) + 1
    }
  }

  for (const [catId, current] of Object.entries(currentSpend)) {
    const p1 = p1Spend[catId] || 0
    const p2 = p2Spend[catId] || 0
    const p3 = p3Spend[catId] || 0
    const baselineAverage = (p1 + p2 + p3) / 3
    const txCount = baselineCount[catId] || 0

    // Safeguards: minimum $30 baseline and at least 3 historical transactions in baseline
    if (baselineAverage < 3000 || txCount < 3) continue

    const delta = current - baselineAverage
    const ratio = current / baselineAverage

    if (ratio >= 1.25 && delta >= 2500) {
      const pctIncrease = Math.round((ratio - 1) * 100)
      const catName = catMap.get(catId) || "Other"
      const isExtreme = ratio >= 1.6
      const monthYear = `${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`

      insights.push({
        id: `spike_${catId}_${monthYear}`,
        category: "spikes",
        severity: isExtreme ? "critical" : "warning",
        title: `${catName} Spending Surge`,
        description: `Your spending in ${catName} reached ${formatCurrency(current, targetCurrency)}, which is ${pctIncrease}% higher than your 3-month baseline average of ${formatCurrency(Math.round(baselineAverage), targetCurrency)}.`,
        metricImpact: Math.round(delta),
        metricLabel: `+${pctIncrease}% vs baseline`,
        actionLabel: "Review Category Transactions",
        actionUrl: `/transactions?categories=${catId}`,
        tags: [catName, "surge"],
        score: Math.min(100, Math.round(50 + (ratio - 1) * 25)),
        detectedAt: referenceDate,
      })
    }
  }

  return insights
}

// ── 2. Transaction Outlier Detector ──
export function detectTransactionOutliers(inputs: {
  transactions: Transaction[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): SpendingInsight[] {
  const { transactions, categories, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]))
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const d120 = d0 - 120 * 86400000

  // Group past 120-day transactions by category
  const catTxs: Record<string, { amount: number; tx: Transaction }[]> = {}
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const time = new Date(t.date).getTime()
    if (time < d120 || time > d0) continue
    const catId = t.categoryId || "uncategorized"
    const amount = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    if (!catTxs[catId]) catTxs[catId] = []
    catTxs[catId].push({ amount, tx: t })
  }

  for (const [catId, list] of Object.entries(catTxs)) {
    // Require >= 5 historical transactions
    if (list.length < 5) continue

    const amounts = list.map((i) => i.amount)
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    const threshold = mean + 2.5 * stdDev

    // Check only current 30-day transactions
    for (const item of list) {
      const time = new Date(item.tx.date).getTime()
      if (time >= d30 && time <= d0 && item.amount > threshold && item.amount >= 5000) {
        const catName = catMap.get(catId) || "Expenses"
        const deviationMultiplier = (item.amount / Math.max(mean, 1)).toFixed(1)
        insights.push({
          id: `outlier_${item.tx._id.toString()}`,
          category: "outliers",
          severity: "warning",
          title: `Unusual Expense: ${item.tx.description || catName}`,
          description: `A charge of ${formatCurrency(item.amount, targetCurrency)} is ${deviationMultiplier}x larger than your typical ${catName} transaction average (${formatCurrency(Math.round(mean), targetCurrency)}).`,
          metricImpact: item.amount - Math.round(mean),
          metricLabel: `${deviationMultiplier}x normal size`,
          actionLabel: "View Transaction",
          actionUrl: `/transactions/${item.tx._id.toString()}`,
          tags: ["outlier", catName],
          score: Math.min(95, Math.round(60 + Number(deviationMultiplier) * 5)),
          detectedAt: referenceDate,
        })
      }
    }
  }

  return insights
}

// ── 3. Subscription Creep & Duplicate Detector ──
export function detectSubscriptionCreep(inputs: {
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): SpendingInsight[] {
  const { transactions, recurringRules, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000

  // 1. Detect duplicate charges within 5 days
  const recentExpenses = transactions
    .filter(
      (t) => t.type === "expense" && new Date(t.date).getTime() >= d30 && new Date(t.date).getTime() <= d0
    )
    .map((t) => ({
      tx: t,
      normDesc: normalizeDescription(t.description),
      timestamp: new Date(t.date).getTime(),
    }))
    .filter((item) => item.normDesc.length >= 4)

  // Group by normDesc and amount
  const expenseGroups = new Map<string, typeof recentExpenses>()
  for (const item of recentExpenses) {
    const key = `${item.normDesc}_${item.tx.amount}`
    const existing = expenseGroups.get(key)
    if (existing) {
      existing.push(item)
    } else {
      expenseGroups.set(key, [item])
    }
  }

  const seenDuplicatePairs = new Set<string>()
  for (const group of expenseGroups.values()) {
    if (group.length < 2) continue
    group.sort((a, b) => a.timestamp - b.timestamp)
    for (let i = 0; i < group.length - 1; i++) {
      const a = group[i]
      const b = group[i + 1]
      const dayDiff = (b.timestamp - a.timestamp) / 86400000
      if (dayDiff <= 5) {
        const pairKey = [a.tx._id.toString(), b.tx._id.toString()].sort().join("_")
        if (seenDuplicatePairs.has(pairKey)) continue
        seenDuplicatePairs.add(pairKey)

        const amt = convertAmount(a.tx.amount, a.tx.currency, targetCurrency, exchangeRates)
        insights.push({
          id: `duplicate_${pairKey}`,
          category: "subscriptions",
          severity: "critical",
          title: "Potential Duplicate Charge Detected",
          description: `We detected two identical charges of ${formatCurrency(amt, targetCurrency)} for "${a.tx.description}" within ${Math.max(1, Math.round(dayDiff))} days. Verify with your provider.`,
          metricImpact: amt,
          metricLabel: "Possible double billing",
          actionLabel: "Review Transactions",
          actionUrl: `/transactions`,
          tags: ["duplicate", "billing"],
          score: 85,
          detectedAt: referenceDate,
        })
      }
    }
  }

  // 2. Price hike on active recurring rules
  const yearMonth = `${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`
  for (const rule of recurringRules) {
    if (!rule.isActive || rule.type !== "expense") continue
    const baseRuleAmount = convertAmount(rule.amount, rule.currency, targetCurrency, exchangeRates)
    if (baseRuleAmount <= 0) continue

    const ruleName = rule.description || rule.providerName || "Subscription"

    const ruleTxs = transactions.filter((t) => {
      if (t.type !== "expense") return false
      const time = new Date(t.date).getTime()
      if (time < d30 || time > d0) return false
      return (
        t.recurringId === rule._id.toString() ||
        normalizeDescription(t.description) === normalizeDescription(ruleName)
      )
    })

    if (ruleTxs.length > 0) {
      const latestTx = [...ruleTxs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
      const latestAmt = convertAmount(
        latestTx.amount,
        latestTx.currency,
        targetCurrency,
        exchangeRates
      )

      if (latestAmt > baseRuleAmount * 1.05) {
        const hike = latestAmt - baseRuleAmount
        const pct = Math.round((hike / baseRuleAmount) * 100)
        insights.push({
          id: `price_hike_${rule._id.toString()}_${yearMonth}`,
          category: "subscriptions",
          severity: "warning",
          title: `Subscription Price Hike: ${ruleName}`,
          description: `Your recurring payment for "${ruleName}" increased by ${pct}% from ${formatCurrency(baseRuleAmount, targetCurrency)} to ${formatCurrency(latestAmt, targetCurrency)}.`,
          metricImpact: hike,
          metricLabel: `+${pct}% price hike`,
          actionLabel: "Manage Recurring Rule",
          actionUrl: `/recurring`,
          tags: ["subscription", "price_hike"],
          score: 75,
          detectedAt: referenceDate,
        })
      }
    }
  }

  return insights
}

// ── 4. Income Irregularity Detector ──
export function detectIncomeIrregularities(inputs: {
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): SpendingInsight[] {
  const { transactions, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const d60 = d0 - 60 * 86400000
  const d90 = d0 - 90 * 86400000
  const d120 = d0 - 120 * 86400000

  let currentIncome = 0
  let p1Income = 0
  let p2Income = 0
  let p3Income = 0

  for (const t of transactions) {
    if (t.type !== "income") continue
    const amt = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    const time = new Date(t.date).getTime()

    if (time >= d30 && time <= d0) currentIncome += amt
    else if (time >= d60 && time < d30) p1Income += amt
    else if (time >= d90 && time < d60) p2Income += amt
    else if (time >= d120 && time < d90) p3Income += amt
  }

  const baselineIncome = (p1Income + p2Income + p3Income) / 3

  // Trigger if baseline income >= $500 (50,000 cents) and current 30d dropped by >= 30%
  if (baselineIncome >= 50000 && currentIncome < baselineIncome * 0.7) {
    const dip = Math.round(baselineIncome - currentIncome)
    const pctDrop = Math.round((dip / baselineIncome) * 100)
    const monthYear = `${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`

    insights.push({
      id: `income_dip_${monthYear}`,
      category: "income",
      severity: currentIncome === 0 ? "critical" : "warning",
      title: "Delayed or Missing Income",
      description: `Your recorded income for the last 30 days (${formatCurrency(currentIncome, targetCurrency)}) is ${pctDrop}% below your average monthly baseline (${formatCurrency(Math.round(baselineIncome), targetCurrency)}).`,
      metricImpact: -dip,
      metricLabel: `-${pctDrop}% below baseline`,
      actionLabel: "Record Income",
      actionUrl: `/transactions?type=income`,
      tags: ["income", "cashflow"],
      score: 90,
      detectedAt: referenceDate,
    })
  }

  return insights
}

// ── 5. Savings Opportunities Detector ──
export function detectSavingsOpportunities(inputs: {
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): SpendingInsight[] {
  const { transactions, budgets, categories, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]))
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000
  const yearMonth = `${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`

  // Pre-aggregate 30d expenses by category and collect micro-expenses in a single pass
  const spentByCat = new Map<string, number>()
  const microTxs: Transaction[] = []
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const time = new Date(t.date).getTime()
    if (time < d30 || time > d0) continue
    const amt = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    if (t.categoryId) {
      spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) || 0) + amt)
    }
    if (amt <= 1500) {
      microTxs.push(t)
    }
  }

  // 1. Budget surplus reallocation
  for (const b of budgets) {
    if (!b.isActive) continue
    const budgetLimit = convertAmount(b.amount, b.currency, targetCurrency, exchangeRates)
    const spent = spentByCat.get(b.categoryId) || 0

    if (budgetLimit >= 10000 && spent < budgetLimit * 0.7) {
      const surplus = budgetLimit - spent
      const catName = catMap.get(b.categoryId) || b.name
      insights.push({
        id: `savings_surplus_${b._id.toString()}_${yearMonth}`,
        category: "savings",
        severity: "opportunity",
        title: `Unspent Budget Surplus: ${catName}`,
        description: `You have an unallocated surplus of ${formatCurrency(surplus, targetCurrency)} in your ${catName} budget this month. Consider transferring it to your savings goals.`,
        metricImpact: surplus,
        metricLabel: `${formatCurrency(surplus, targetCurrency)} available`,
        actionLabel: "Transfer to Goal",
        actionUrl: `/goals`,
        tags: ["savings", "surplus"],
        score: 65,
        detectedAt: referenceDate,
      })
    }
  }

  // 2. High-frequency micro-spending leakage (<= $15, >= 12 times in 30d)
  if (microTxs.length >= 12) {
    const totalMicroSpend = microTxs.reduce(
      (sum, t) => sum + convertAmount(t.amount, t.currency, targetCurrency, exchangeRates),
      0
    )
    const potentialMonthlySavings = Math.round(totalMicroSpend * 0.3)
    insights.push({
      id: `savings_micro_leakage_${yearMonth}`,
      category: "savings",
      severity: "opportunity",
      title: "Micro-Purchase Frequency Leakage",
      description: `You logged ${microTxs.length} small purchases (under ${formatCurrency(1500, targetCurrency)}) totaling ${formatCurrency(totalMicroSpend, targetCurrency)} this month. Trimming discretionary frequency could save ~${formatCurrency(potentialMonthlySavings, targetCurrency)}/mo.`,
      metricImpact: potentialMonthlySavings,
      metricLabel: `~${formatCurrency(potentialMonthlySavings, targetCurrency)}/mo savings`,
      actionLabel: "Review Micro-expenses",
      actionUrl: `/transactions?maxAmount=15`,
      tags: ["savings", "habits"],
      score: 60,
      detectedAt: referenceDate,
    })
  }

  return insights
}

// ── 6. Cash Flow Velocity & Burn Rate ──
export function detectCashFlowVelocity(inputs: {
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): SpendingInsight[] {
  const { transactions, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const insights: SpendingInsight[] = []

  const d0 = referenceDate.getTime()
  const d7 = d0 - 7 * 86400000
  const d30 = d0 - 30 * 86400000

  let last7dExpenses = 0
  let last30dIncome = 0

  for (const t of transactions) {
    const amt = convertAmount(t.amount, t.currency, targetCurrency, exchangeRates)
    const time = new Date(t.date).getTime()

    if (t.type === "expense") {
      if (time >= d7 && time <= d0) last7dExpenses += amt
    } else if (t.type === "income") {
      if (time >= d30 && time <= d0) last30dIncome += amt
    }
  }

  const projectedMonthExpenses = Math.round(last7dExpenses * 4.3)
  if (last30dIncome > 0 && projectedMonthExpenses > last30dIncome * 1.15) {
    const deficit = projectedMonthExpenses - last30dIncome
    insights.push({
      id: `cashflow_velocity_${referenceDate.getFullYear()}_${referenceDate.getMonth() + 1}`,
      category: "cashflow",
      severity: deficit > 25000 ? "critical" : "warning",
      title: "Accelerated Burn Rate",
      description: `At your 7-day spending pace (${formatCurrency(last7dExpenses, targetCurrency)}/wk), projected monthly expenses will exceed income by ${formatCurrency(deficit, targetCurrency)}.`,
      metricImpact: -deficit,
      metricLabel: `${formatCurrency(deficit, targetCurrency)} deficit risk`,
      actionLabel: "View Cash Flow Trend",
      actionUrl: `/reports`,
      tags: ["burn_rate", "deficit"],
      score: 80,
      detectedAt: referenceDate,
    })
  }

  return insights
}

// ── Orchestrator ──
export function calculateSpendingInsights(inputs: InsightEngineInputs): SpendingInsightsData {
  const referenceDate = inputs.referenceDate || new Date()
  const userStates = inputs.userStates || []
  const dismissedKeys = new Set(
    userStates.filter((s) => s.status === "dismissed").map((s) => s.insightKey)
  )
  const bookmarkedKeys = new Set(
    userStates.filter((s) => s.status === "bookmarked").map((s) => s.insightKey)
  )

  const rawInsights: SpendingInsight[] = [
    ...detectCategorySpikes({ ...inputs, referenceDate }),
    ...detectTransactionOutliers({ ...inputs, referenceDate }),
    ...detectSubscriptionCreep({ ...inputs, referenceDate }),
    ...detectIncomeIrregularities({ ...inputs, referenceDate }),
    ...detectSavingsOpportunities({ ...inputs, referenceDate }),
    ...detectCashFlowVelocity({ ...inputs, referenceDate }),
  ]

  // Deduplicate insights by ID
  const uniqueInsights: SpendingInsight[] = []
  const seenIds = new Set<string>()
  for (const ins of rawInsights) {
    if (!seenIds.has(ins.id)) {
      seenIds.add(ins.id)
      uniqueInsights.push(ins)
    }
  }

  // Attach bookmark flag and sort descending by score
  const allRanked = uniqueInsights
    .map((i) => ({
      ...i,
      isBookmarked: bookmarkedKeys.has(i.id),
    }))
    .sort((a, b) => b.score - a.score)

  const activeInsights = allRanked.filter((i) => !dismissedKeys.has(i.id))
  const bookmarkedInsights = allRanked.filter((i) => i.isBookmarked)

  // Metrics calculation
  const anomalyCount = activeInsights.filter(
    (i) => i.category === "spikes" || i.category === "outliers" || i.category === "income"
  ).length

  const potentialSavingsMonthlyCents = activeInsights
    .filter((i) => i.category === "savings" && (i.metricImpact || 0) > 0)
    .reduce((sum, i) => sum + (i.metricImpact || 0), 0)

  const discretionarySurgeCents = activeInsights
    .filter((i) => i.category === "spikes" && (i.metricImpact || 0) > 0)
    .reduce((sum, i) => sum + (i.metricImpact || 0), 0)

  // Deterministic summary fallback
  const topSpike = activeInsights.find((i) => i.category === "spikes")
  const topSavings = activeInsights.find((i) => i.category === "savings")

  let summary = `Your financial pulse is stable with ${activeInsights.length} active spending signals detected.`
  if (topSpike) {
    summary = `${topSpike.title}: ${topSpike.description}`
  } else if (activeInsights.length === 0) {
    summary = "No unusual spending spikes or billing anomalies detected. Your budget is running smoothly."
  }

  let focalAdvice = "Keep monitoring your weekly discretionary spending to stay ahead of upcoming renewals."
  if (topSavings) {
    focalAdvice = `Actionable win: ${topSavings.description}`
  }

  return {
    executiveBriefing: {
      summary,
      focalAdvice,
      isAiGenerated: false,
    },
    insights: activeInsights,
    bookmarkedInsights,
    dismissedCount: dismissedKeys.size,
    metrics: {
      activeCount: activeInsights.length,
      anomalyCount,
      potentialSavingsMonthlyCents,
      discretionarySurgeCents,
    },
    currency: inputs.targetCurrency,
  }
}
