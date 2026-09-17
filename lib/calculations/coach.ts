import type {
  Wallet,
  Transaction,
  Budget,
  Goal,
  Loan,
  LoanRepayment,
  RecurringRule,
  CoachStrategy,
  EmergencyFundAnalysis,
  DebtPayoffComparison,
  GoalAccelerationItem,
  CoachSummaryBrief,
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

// ── 1. Emergency Fund Analysis ──
export function analyzeEmergencyFund(inputs: {
  wallets: Wallet[]
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): EmergencyFundAnalysis {
  const { wallets, transactions, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const d0 = referenceDate.getTime()
  const d90 = d0 - 90 * 86400000

  // Liquid accounts: checking, savings, cash, digital wallet (exclude investment, credit liabilities, or archived)
  let liquidSavingsCents = 0
  for (const w of wallets) {
    if (w.isArchived) continue
    const wType = (w.type || "").toLowerCase()
    // Treat standard bank, savings, and cash wallets as liquid funds if balance > 0
    if (["bank", "cash", "savings"].includes(wType as any) || !wType) {
      const converted = convertAmount(w.balance || 0, w.currency || "USD", targetCurrency, exchangeRates)
      if (converted > 0) {
        liquidSavingsCents += converted
      }
    }
  }

  // Calculate 90-day trailing expenses to get average monthly burn rate
  let total90DayExpenseCents = 0
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const time = new Date(t.date).getTime()
    if (time >= d90 && time <= d0) {
      const converted = convertAmount(t.amount, t.currency || "USD", targetCurrency, exchangeRates)
      total90DayExpenseCents += converted
    }
  }

  const monthlyBurnRateCents = Math.round(total90DayExpenseCents / 3)
  const currentRunwayMonths =
    monthlyBurnRateCents > 0
      ? Number((liquidSavingsCents / monthlyBurnRateCents).toFixed(1))
      : liquidSavingsCents > 0
        ? 12
        : 0

  let healthTier: EmergencyFundAnalysis["healthTier"] = "critical"
  if (currentRunwayMonths >= 6) {
    healthTier = currentRunwayMonths >= 12 ? "exceptional" : "healthy"
  } else if (currentRunwayMonths >= 3) {
    healthTier = "adequate"
  } else if (currentRunwayMonths >= 1) {
    healthTier = "warning"
  }

  const targetRunwayMonths = 6
  const targetCents = monthlyBurnRateCents * targetRunwayMonths
  const shortfallCents = Math.max(0, targetCents - liquidSavingsCents)

  return {
    liquidSavingsCents,
    monthlyBurnRateCents,
    currentRunwayMonths,
    targetRunwayMonths,
    shortfallCents,
    healthTier,
  }
}

// ── 2. Debt Payoff Analysis (Snowball vs. Avalanche) ──
export function analyzeDebtPayoff(inputs: {
  loans: Loan[]
  repayments: LoanRepayment[]
  extraMonthlyPaymentCents?: number
  targetCurrency: string
  exchangeRates: Record<string, number>
}): DebtPayoffComparison | null {
  const { loans, repayments, targetCurrency, exchangeRates } = inputs
  const extraMonthlyPaymentCents = inputs.extraMonthlyPaymentCents ?? 10000 // default $100 / 10,000 cents

  // We consider active borrowed loans (liabilities where user owes money)
  const borrowedLoans = loans.filter(
    (l) => l.type === "borrowed" && l.status !== "fully_repaid" && l.status !== "cancelled"
  )

  if (borrowedLoans.length === 0) {
    return null
  }

  // Calculate remaining balance per loan
  const repaymentTotals: Record<string, number> = {}
  for (const r of repayments) {
    repaymentTotals[r.loanId] = (repaymentTotals[r.loanId] || 0) + r.amount
  }

  const loanProfiles = borrowedLoans.map((l) => {
    const origCents = convertAmount(l.amount, l.currency || "USD", targetCurrency, exchangeRates)
    const paidCents = convertAmount(repaymentTotals[l._id.toString()] || 0, l.currency || "USD", targetCurrency, exchangeRates)
    const balanceCents = l.remainingAmount !== undefined
      ? convertAmount(l.remainingAmount, l.currency || "USD", targetCurrency, exchangeRates)
      : Math.max(0, origCents - paidCents)
    const interestRate = l.interestRate || 0
    return {
      loanId: l._id.toString(),
      name: l.personName || l.notes || "Personal Loan",
      balanceCents,
      interestRate,
    }
  }).filter((lp) => lp.balanceCents > 0)

  if (loanProfiles.length === 0) {
    return null
  }

  const totalDebtCents = loanProfiles.reduce((sum, lp) => sum + lp.balanceCents, 0)

  // Snowball: lowest remaining balance first
  const snowballSorted = [...loanProfiles].sort((a, b) => a.balanceCents - b.balanceCents)
  // Avalanche: highest interest rate first, then highest balance
  const avalancheSorted = [...loanProfiles].sort((a, b) => (b.interestRate - a.interestRate) || (b.balanceCents - a.balanceCents))

  // Estimate baseline monthly payment capacity (assume ~5% of debt or min $150)
  const baselineMonthlyPayment = Math.max(15000, Math.round(totalDebtCents * 0.05))
  const currentPayoffMonths = Math.max(1, Math.ceil(totalDebtCents / baselineMonthlyPayment))

  const acceleratedMonthlyPayment = baselineMonthlyPayment + extraMonthlyPaymentCents
  const acceleratedPayoffMonths = Math.max(1, Math.ceil(totalDebtCents / acceleratedMonthlyPayment))

  const monthsSaved = Math.max(0, currentPayoffMonths - acceleratedPayoffMonths)
  // Approximate average annual interest rate ~9%
  const avgRate = loanProfiles.reduce((acc, l) => acc + (l.interestRate || 9), 0) / loanProfiles.length
  const interestSavedCents = Math.round(
    (totalDebtCents * (avgRate / 100) * (monthsSaved / 12)) * 0.75
  )

  return {
    totalDebtCents,
    activeLoanCount: loanProfiles.length,
    currentPayoffMonths,
    acceleratedPayoffMonths,
    monthsSaved,
    interestSavedCents,
    snowballPriorityLoan: snowballSorted[0] ? {
      loanId: snowballSorted[0].loanId,
      name: snowballSorted[0].name,
      balanceCents: snowballSorted[0].balanceCents,
    } : undefined,
    avalanchePriorityLoan: avalancheSorted[0] ? {
      loanId: avalancheSorted[0].loanId,
      name: avalancheSorted[0].name,
      balanceCents: avalancheSorted[0].balanceCents,
    } : undefined,
  }
}

// ── 3. Goal Acceleration Analysis ──
export function analyzeGoalAcceleration(inputs: {
  goals: Goal[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): GoalAccelerationItem[] {
  const { goals, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const now = referenceDate.getTime()

  const items: GoalAccelerationItem[] = []

  for (const g of goals) {
    if (g.currentAmount >= g.targetAmount) continue

    const targetCents = convertAmount(g.targetAmount, g.currency || "USD", targetCurrency, exchangeRates)
    const currentCents = convertAmount(g.currentAmount || 0, g.currency || "USD", targetCurrency, exchangeRates)
    const remainingCents = Math.max(0, targetCents - currentCents)

    if (remainingCents === 0) continue

    let monthsRemaining = 12
    if (g.targetDate) {
      const targetTime = new Date(g.targetDate).getTime()
      const diffMs = targetTime - now
      monthsRemaining = Math.max(1, Math.ceil(diffMs / (30 * 86400000)))
    }

    const requiredMonthlyCents = Math.round(remainingCents / monthsRemaining)
    // Run-rate approximation
    const currentMonthlyRunRateCents = Math.round(currentCents / Math.max(1, 12 - monthsRemaining + 3))

    let status: GoalAccelerationItem["status"] = "on_track"
    if (currentMonthlyRunRateCents < requiredMonthlyCents * 0.8) {
      status = "behind"
    } else if (currentMonthlyRunRateCents > requiredMonthlyCents * 1.2) {
      status = "ahead"
    }

    const suggestedMonthlyBoostCents =
      status === "behind"
        ? requiredMonthlyCents - currentMonthlyRunRateCents
        : Math.round(requiredMonthlyCents * 0.25)

    items.push({
      goalId: g._id.toString(),
      name: g.name,
      targetCents,
      currentCents,
      status,
      requiredMonthlyCents,
      currentMonthlyRunRateCents,
      suggestedMonthlyBoostCents,
    })
  }

  return items
}

// ── 4. Subscription & Recurring Trimming ──
export function analyzeSubscriptionTrimming(inputs: {
  recurringRules: RecurringRule[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}): { totalMonthlyCents: number; totalAnnualCents: number; activeRulesCount: number; highBurdenCount: number } {
  const { recurringRules, targetCurrency, exchangeRates } = inputs
  let totalMonthlyCents = 0
  let highBurdenCount = 0

  const activeRules = recurringRules.filter((r) => r.isActive)

  for (const r of activeRules) {
    const amount = convertAmount(r.amount, r.currency || "USD", targetCurrency, exchangeRates)
    let monthlyAmount = amount
    if (r.frequency === "yearly") {
      monthlyAmount = Math.round(amount / 12)
    } else if (r.frequency === "weekly") {
      monthlyAmount = Math.round(amount * 4.33)
    } else if (r.frequency === "daily") {
      monthlyAmount = Math.round(amount * 30)
    }
    totalMonthlyCents += monthlyAmount
    if (monthlyAmount >= 5000) {
      // >= $50/mo
      highBurdenCount++
    }
  }

  return {
    totalMonthlyCents,
    totalAnnualCents: totalMonthlyCents * 12,
    activeRulesCount: activeRules.length,
    highBurdenCount,
  }
}

// ── 5. Budget Tuning ──
export function analyzeBudgetTuning(inputs: {
  budgets: Budget[]
  transactions: Transaction[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  referenceDate?: Date
}): { overspentCategoriesCount: number; totalSurplusCents: number; totalDeficitCents: number } {
  const { budgets, transactions, targetCurrency, exchangeRates } = inputs
  const referenceDate = inputs.referenceDate || new Date()
  const d0 = referenceDate.getTime()
  const d30 = d0 - 30 * 86400000

  const spendByCat: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const time = new Date(t.date).getTime()
    if (time >= d30 && time <= d0) {
      const catId = t.categoryId || "uncategorized"
      const amount = convertAmount(t.amount, t.currency || "USD", targetCurrency, exchangeRates)
      spendByCat[catId] = (spendByCat[catId] || 0) + amount
    }
  }

  let overspentCategoriesCount = 0
  let totalSurplusCents = 0
  let totalDeficitCents = 0

  for (const b of budgets) {
    if (!b.isActive) continue
    const budgetCents = convertAmount(b.amount, b.currency || "USD", targetCurrency, exchangeRates)
    const spentCents = spendByCat[b.categoryId] || 0
    if (spentCents > budgetCents) {
      overspentCategoriesCount++
      totalDeficitCents += (spentCents - budgetCents)
    } else {
      totalSurplusCents += (budgetCents - spentCents)
    }
  }

  return {
    overspentCategoriesCount,
    totalSurplusCents,
    totalDeficitCents,
  }
}

// ── 6. Synthesize Prioritized Strategies ──
export function synthesizeCoachStrategies(inputs: {
  emergencyFund: EmergencyFundAnalysis
  debtComparison: DebtPayoffComparison | null
  goalAccelerations: GoalAccelerationItem[]
  subscriptionStats: { totalMonthlyCents: number; totalAnnualCents: number; activeRulesCount: number; highBurdenCount: number }
  budgetStats: { overspentCategoriesCount: number; totalSurplusCents: number; totalDeficitCents: number }
  currency: string
}): CoachStrategy[] {
  const { emergencyFund, debtComparison, goalAccelerations, subscriptionStats, budgetStats, currency } = inputs
  const strategies: CoachStrategy[] = []

  // Strategy A: Emergency Fund Runway
  if (emergencyFund.healthTier === "critical" || emergencyFund.healthTier === "warning") {
    const monthlyTopUp = Math.round(emergencyFund.shortfallCents / 6)
    strategies.push({
      id: "emergency_reserve_boost",
      category: "emergency_fund",
      impact: "high",
      title: "Build Your Emergency Runway",
      subtitle: `Current buffer: ${emergencyFund.currentRunwayMonths} months (Target: 6 months)`,
      primaryMetric: {
        label: "Safety Shortfall",
        value: formatCurrency(emergencyFund.shortfallCents, currency),
        delta: `Target: 6 mo (${formatCurrency(emergencyFund.monthlyBurnRateCents * 6, currency)})`,
      },
      description: `Your liquid cash covers ${emergencyFund.currentRunwayMonths} months of typical living expenses. Automating ${formatCurrency(monthlyTopUp, currency)}/mo into a dedicated savings wallet creates a resilient 6-month safety net in 6 months.`,
      actionLabel: "View Wallets & Reserves",
      actionUrl: "/wallets",
      score: 95,
      details: {
        currentValue: emergencyFund.liquidSavingsCents,
        projectedValue: emergencyFund.monthlyBurnRateCents * 6,
        monthlyBenefitCents: monthlyTopUp,
        timelineImpactMonths: 6,
      },
    })
  } else if (emergencyFund.healthTier === "adequate") {
    strategies.push({
      id: "emergency_reserve_topup",
      category: "emergency_fund",
      impact: "medium",
      title: "Solidify 6-Month Emergency Buffer",
      subtitle: `Current buffer: ${emergencyFund.currentRunwayMonths} months`,
      primaryMetric: {
        label: "Buffer Gap",
        value: formatCurrency(emergencyFund.shortfallCents, currency),
        delta: `+${(6 - emergencyFund.currentRunwayMonths).toFixed(1)} mo needed`,
      },
      description: `You have a healthy 3+ month liquidity foundation. Directing an additional ${formatCurrency(Math.round(emergencyFund.shortfallCents / 12), currency)}/mo will comfortably hit full 6-month resilience within a year.`,
      actionLabel: "Adjust Savings",
      actionUrl: "/wallets",
      score: 75,
      details: {
        currentValue: emergencyFund.liquidSavingsCents,
        projectedValue: emergencyFund.monthlyBurnRateCents * 6,
        monthlyBenefitCents: Math.round(emergencyFund.shortfallCents / 12),
        timelineImpactMonths: 12,
      },
    })
  }

  // Strategy B: Debt Payoff (Snowball vs. Avalanche)
  if (debtComparison && debtComparison.totalDebtCents > 0) {
    const prioLoan = debtComparison.snowballPriorityLoan
    strategies.push({
      id: "debt_snowball_accelerate",
      category: "debt_payoff",
      impact: "high",
      title: "Accelerate Debt Freedom via Snowball",
      subtitle: `Target: ${prioLoan?.name || "Smallest Loan"} (${formatCurrency(prioLoan?.balanceCents || 0, currency)})`,
      primaryMetric: {
        label: "Time to Freedom",
        value: `${debtComparison.acceleratedPayoffMonths} mo`,
        delta: `-${debtComparison.monthsSaved} mo faster`,
      },
      description: `Paying an extra ${formatCurrency(10000, currency)} monthly eliminates your smallest balance first, giving immediate psychological momentum and accelerating debt freedom by ${debtComparison.monthsSaved} months with estimated ${formatCurrency(debtComparison.interestSavedCents, currency)} saved.`,
      actionLabel: "View Loans & Settle Up",
      actionUrl: "/loans",
      score: 90,
      details: {
        currentValue: debtComparison.totalDebtCents,
        projectedValue: 0,
        monthlyBenefitCents: debtComparison.interestSavedCents / Math.max(1, debtComparison.acceleratedPayoffMonths),
        timelineImpactMonths: debtComparison.monthsSaved,
      },
    })
  }

  // Strategy C: Behind-schedule Goals
  const behindGoals = goalAccelerations.filter((g) => g.status === "behind")
  if (behindGoals.length > 0) {
    const topGoal = behindGoals[0]
    strategies.push({
      id: `goal_boost_${topGoal.goalId}`,
      category: "goal_acceleration",
      impact: "medium",
      title: `Keep '${topGoal.name}' On Schedule`,
      subtitle: `Required: ${formatCurrency(topGoal.requiredMonthlyCents, currency)}/mo`,
      primaryMetric: {
        label: "Monthly Boost",
        value: `+${formatCurrency(topGoal.suggestedMonthlyBoostCents, currency)}/mo`,
        delta: "Behind schedule",
      },
      description: `Current contribution velocity is lagging behind the target completion date. Adding ${formatCurrency(topGoal.suggestedMonthlyBoostCents, currency)} per month brings this milestone back on track without extending the target deadline.`,
      actionLabel: "Inspect Goal",
      actionUrl: "/goals",
      score: 82,
      details: {
        currentValue: topGoal.currentCents,
        projectedValue: topGoal.targetCents,
        monthlyBenefitCents: topGoal.suggestedMonthlyBoostCents,
      },
    })
  }

  // Strategy D: Subscription Optimization
  if (subscriptionStats.activeRulesCount >= 3) {
    const estimatedSavings = Math.round(subscriptionStats.totalMonthlyCents * 0.15)
    strategies.push({
      id: "subscription_trim_audit",
      category: "subscription_trim",
      impact: "easy_win",
      title: "Audit Recurring Commitments",
      subtitle: `${subscriptionStats.activeRulesCount} active subscriptions & recurring bills`,
      primaryMetric: {
        label: "Annual Spend",
        value: formatCurrency(subscriptionStats.totalAnnualCents, currency),
        delta: `~${formatCurrency(estimatedSavings, currency)}/mo trim potential`,
      },
      description: `Your recurring subscriptions total ${formatCurrency(subscriptionStats.totalMonthlyCents, currency)} every month. Trimming 1 or 2 unused services or switching to annual plans could free up ${formatCurrency(estimatedSavings * 12, currency)} annually for your savings goals.`,
      actionLabel: "Review Subscriptions",
      actionUrl: "/recurring",
      score: 70,
      details: {
        currentValue: subscriptionStats.totalMonthlyCents,
        projectedValue: subscriptionStats.totalMonthlyCents - estimatedSavings,
        monthlyBenefitCents: estimatedSavings,
      },
    })
  }

  // Strategy E: Budget Tuning
  if (budgetStats.overspentCategoriesCount > 0) {
    strategies.push({
      id: "budget_rebalance_tuning",
      category: "budget_tuning",
      impact: "medium",
      title: "Zero-Sum Budget Rebalancing",
      subtitle: `${budgetStats.overspentCategoriesCount} categories exceeded their monthly limits`,
      primaryMetric: {
        label: "Net Deficit",
        value: formatCurrency(budgetStats.totalDeficitCents, currency),
        delta: `${formatCurrency(budgetStats.totalSurplusCents, currency)} surplus available`,
      },
      description: `Rather than cutting lifestyle cold-turkey, reallocate funds from your surplus budgets (${formatCurrency(budgetStats.totalSurplusCents, currency)} available) into deficit categories to reflect realistic spending and eliminate false alerts.`,
      actionLabel: "Tune Budgets",
      actionUrl: "/budgets",
      score: 65,
      details: {
        currentValue: budgetStats.totalDeficitCents,
        projectedValue: 0,
        monthlyBenefitCents: budgetStats.totalDeficitCents,
      },
    })
  }

  return strategies.sort((a, b) => b.score - a.score)
}

// ── 7. Instant Deterministic Briefing (Zero-API Page Load) ──
export function generateDeterministicBriefing(inputs: {
  strategies: CoachStrategy[]
  emergencyFund: EmergencyFundAnalysis
  debtComparison: DebtPayoffComparison | null
  currency: string
}): CoachSummaryBrief {
  const { strategies, emergencyFund, debtComparison, currency } = inputs

  let headline = "Your financial trajectory is balanced and stable."
  let focalAdvice = "Focus on steady monthly savings contributions to keep your emergency runway compounding."

  if (emergencyFund.healthTier === "critical" || emergencyFund.healthTier === "warning") {
    headline = `Priority Focus: Reinforce your ${emergencyFund.currentRunwayMonths}-month emergency buffer.`
    focalAdvice = `Automate a regular transfer to liquid savings until reaching at least 3 to 6 months of living expenses (${formatCurrency(emergencyFund.monthlyBurnRateCents * 6, currency)}).`
  } else if (debtComparison && debtComparison.totalDebtCents > 0) {
    headline = `Opportunity: Knock ${debtComparison.monthsSaved} months off your debt payoff timeline.`
    focalAdvice = `Target ${debtComparison.snowballPriorityLoan?.name || "your smallest balance"} with an extra payment to build payoff momentum.`
  } else if (strategies.length > 0) {
    headline = `Identified ${strategies.length} optimization moves across savings, budgets, and goals.`
    focalAdvice = strategies[0].description
  }

  const highlights: string[] = [
    `Emergency runway covers ${emergencyFund.currentRunwayMonths} months (${formatCurrency(emergencyFund.liquidSavingsCents, currency)} liquid).`,
    debtComparison && debtComparison.totalDebtCents > 0
      ? `Total debt balance of ${formatCurrency(debtComparison.totalDebtCents, currency)} across ${debtComparison.activeLoanCount} active loans.`
      : "Zero outstanding high-interest debt logged.",
    `Monthly baseline living expense burn rate is ${formatCurrency(emergencyFund.monthlyBurnRateCents, currency)}.`,
  ]

  return {
    headline,
    focalAdvice,
    keyHighlights: highlights,
    isAiGenerated: false,
  }
}

// ── 8. On-Demand AI Briefing (Invoked ONLY when user clicks Refresh) ──
export async function generateOnDemandAiBriefing(inputs: {
  strategies: CoachStrategy[]
  emergencyFund: EmergencyFundAnalysis
  debtComparison: DebtPayoffComparison | null
  currency: string
}): Promise<CoachSummaryBrief> {
  const fallback = generateDeterministicBriefing(inputs)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallback

  const { strategies, emergencyFund, debtComparison, currency } = inputs

  try {
    const prompt = `You are Dime's AI Financial Coach. Provide a concise, professional financial coaching assessment.
Context:
- Liquid savings: ${(emergencyFund.liquidSavingsCents / 100).toFixed(0)} ${currency} (${emergencyFund.currentRunwayMonths} months runway)
- Monthly living expenses: ${(emergencyFund.monthlyBurnRateCents / 100).toFixed(0)} ${currency}
- Total debt: ${debtComparison ? (debtComparison.totalDebtCents / 100).toFixed(0) : 0} ${currency} (${debtComparison ? debtComparison.activeLoanCount : 0} loans)
- Strategies identified: ${strategies.map((s) => `[${s.title}]: ${s.subtitle}`).join("; ")}

Return ONLY valid JSON matching this schema:
{
  "headline": "1 clear, motivating executive statement (max 15 words)",
  "focalAdvice": "1 actionable focal recommendation for this month (max 25 words)",
  "keyHighlights": ["bullet 1 (fact-based)", "bullet 2 (fact-based)", "bullet 3 (fact-based)"]
}
Strict Rule: Provide recommendations for informational/budgeting purposes only, never legal or financial advice.`

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
      focalAdvice: parsed.focalAdvice || fallback.focalAdvice,
      keyHighlights: Array.isArray(parsed.keyHighlights) ? parsed.keyHighlights.slice(0, 3) : fallback.keyHighlights,
      isAiGenerated: true,
    }
  } catch {
    return fallback
  }
}

// ── 9. On-Demand Conversational Q&A (Invoked ONLY when user sends a chat message) ──
export async function generateCoachChatAnswer(inputs: {
  question: string
  context: {
    liquidSavingsCents: number
    monthlyBurnRateCents: number
    runwayMonths: number
    totalDebtCents: number
    activeLoansCount: number
    activeGoalsCount: number
    currency: string
    topStrategies: string[]
  }
  history?: { role: "user" | "coach"; content: string }[]
}): Promise<string> {
  const { question, context, history = [] } = inputs
  const apiKey = process.env.GEMINI_API_KEY

  // Deterministic fallback response when offline or API key unconfigured
  const qLower = question.toLowerCase()
  const fallbackAnswer = (): string => {
    if (qLower.includes("debt") || qLower.includes("loan")) {
      return context.totalDebtCents > 0
        ? `You currently have ${formatCurrency(context.totalDebtCents, context.currency)} across ${context.activeLoansCount} active loan(s). The Snowball method (focusing on your smallest loan balance first) is mathematically proven to build the strongest psychological momentum. Would you like to review an extra monthly allocation in the What-If Simulator?`
        : "You currently have zero active debt logged in Dime! This frees up your cash flow to accelerate emergency reserves or wealth goals."
    }
    if (qLower.includes("emergency") || qLower.includes("runway") || qLower.includes("reserve")) {
      return `Your current emergency buffer stands at ${context.runwayMonths} months of living expenses (${formatCurrency(context.liquidSavingsCents, context.currency)} liquid vs. ${formatCurrency(context.monthlyBurnRateCents, context.currency)}/mo burn). We generally recommend maintaining 3 to 6 months of living expenses in an accessible, low-risk account.`
    }
    if (qLower.includes("save") || qLower.includes("goal") || qLower.includes("invest")) {
      return `You have ${context.activeGoalsCount} active goal(s) on your radar. Setting up automatic transfers on payday directly into dedicated savings wallets helps lock in progress before discretionary expenses occur.`
    }
    return `Based on your telemetry, your monthly living expense burn rate is ${formatCurrency(context.monthlyBurnRateCents, context.currency)} with ${context.runwayMonths} months of liquid emergency coverage. Top priorities: ${context.topStrategies.slice(0, 2).join(", ") || "maintain positive monthly cash flow"}. (Educational recommendation only, not financial advice).`
  }

  if (!apiKey) {
    return fallbackAnswer()
  }

  try {
    const recentHistoryText = history
      .slice(-4)
      .map((h) => `${h.role === "user" ? "User" : "Coach"}: ${h.content}`)
      .join("\n")

    const prompt = `You are Dime's AI Financial Coach. You provide supportive, clear, actionable personal budgeting guidance.
User's Real Financial Data:
- Base Currency: ${context.currency}
- Liquid Cash: ${(context.liquidSavingsCents / 100).toFixed(0)} ${context.currency}
- Monthly Expenses: ${(context.monthlyBurnRateCents / 100).toFixed(0)} ${context.currency}
- Emergency Runway: ${context.runwayMonths} months
- Total Debt: ${(context.totalDebtCents / 100).toFixed(0)} ${context.currency} (${context.activeLoansCount} loans)
- Active Goals: ${context.activeGoalsCount}
- Top Strategies: ${context.topStrategies.join("; ")}

Chat History:
${recentHistoryText}

User Question: "${question}"

Instructions:
1. Answer directly, concisely, and helpfully (2-3 paragraphs max).
2. Reference the user's specific figures where relevant.
3. Be encouraging and practical. Never make up numbers not present in the facts.
4. Conclude with a brief reminder that this is educational guidance, not formal financial advice.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
        signal: AbortSignal.timeout(6000),
      }
    )

    if (!response.ok) return fallbackAnswer()
    const data = await response.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return reply || fallbackAnswer()
  } catch {
    return fallbackAnswer()
  }
}
