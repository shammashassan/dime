import {
  Wallet,
  Transaction,
  Loan,
  LoanRepayment,
  Asset,
  InvestmentHolding,
  Goal,
  RecurringRule,
  PlannerScenario,
  ForecastResult,
  ForecastPoint,
  GoalMilestone,
  LoanMilestone,
  PlannerInsight,
} from "@/types"
import { calculateCurrentNetWorth } from "@/lib/calculations/net-worth"
import { addMonths, format } from "date-fns"

export interface BaselineFinancialState {
  wallets: Wallet[]
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  loans: Loan[]
  repayments: LoanRepayment[]
  assets: Asset[]
  investmentHoldings: InvestmentHolding[]
  goals: Goal[]
  targetCurrency: string
  exchangeRates: Record<string, number>
}

export function createCurrencyConverter(targetCurrency: string, exchangeRates: Record<string, number>) {
  const targetUpper = targetCurrency.toUpperCase()
  return (amount: number, fromCurrency: string) => {
    const fromUpper = (fromCurrency || targetCurrency).toUpperCase()
    if (fromUpper === targetUpper) return amount
    const rate = exchangeRates[fromUpper]
    if (rate && rate > 0) {
      return Math.round(amount / rate)
    }
    return amount
  }
}

/**
 * Pure, deterministic forecasting engine.
 * Takes current baseline financial state and a scenario override, returning dual-series
 * forecast trajectory points, milestones, and derived insights.
 */
export function generateFinancialForecast(
  baseline: BaselineFinancialState,
  scenario: Partial<PlannerScenario>
): ForecastResult {
  const {
    wallets,
    transactions,
    recurringRules,
    loans,
    repayments,
    assets,
    investmentHoldings,
    goals,
    targetCurrency,
    exchangeRates,
  } = baseline

  const convert = createCurrencyConverter(targetCurrency, exchangeRates || {})

  const horizonMonths = Math.min(Math.max(scenario.horizonMonths ?? 12, 1), 120)
  const incomeAdj = scenario.monthlyIncomeAdjustment ?? 0
  const expenseAdj = scenario.monthlyExpenseAdjustment ?? 0
  const extraLoanPayment = Math.max(scenario.extraLoanRepayment ?? 0, 0)
  const extraGoalContrib = Math.max(scenario.extraGoalContribution ?? 0, 0)
  const pausedIds = new Set(scenario.pausedRecurringIds || [])
  const investmentRoi = (scenario.investmentReturnRate ?? 7) / 100 // annual rate

  // 1. Initial Net Worth & Liquid Cash
  const initialNetWorthBreakdown = calculateCurrentNetWorth({
    wallets,
    loans,
    assets,
    investmentHoldings,
    convert,
  })

  const currentNetWorth = initialNetWorthBreakdown.netWorth
  
  // Calculate starting liquid cash across liquid wallets (cash, bank, savings)
  let currentLiquidCash = 0
  for (const w of wallets) {
    if (w.isArchived) continue
    if (w.type === "cash" || w.type === "bank" || w.type === "savings") {
      currentLiquidCash += convert(w.balance, w.currency)
    }
  }

  // 2. Baseline Monthly Income & Expenses (computed from recent 90-day history & active recurring rules)
  // Monthly recurring income & expenses from active rules
  let recurringMonthlyIncome = 0
  let recurringMonthlyExpense = 0

  for (const rule of recurringRules) {
    if (!rule.isActive) continue
    const amt = convert(rule.amount, rule.currency)
    // Scale frequency to monthly equivalent
    let multiplier = 1
    if (rule.frequency === "daily") multiplier = 30
    else if (rule.frequency === "weekly") multiplier = 4.33
    else if (rule.frequency === "biweekly") multiplier = 2.16
    else if (rule.frequency === "monthly") multiplier = 1
    else if (rule.frequency === "quarterly") multiplier = 1 / 3
    else if (rule.frequency === "yearly") multiplier = 1 / 12

    const monthlyVal = Math.round(amt * multiplier)

    if (rule.type === "income") {
      recurringMonthlyIncome += monthlyVal
    } else {
      recurringMonthlyExpense += monthlyVal
    }
  }

  // Calculate historical 3-month non-recurring average
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  let historicalIncomeTotal = 0
  let historicalExpenseTotal = 0

  for (const tx of transactions) {
    if (tx.date >= threeMonthsAgo && !tx.isRecurring) {
      const amt = convert(tx.amount, tx.currency)
      if (tx.type === "income") historicalIncomeTotal += amt
      else if (tx.type === "expense") historicalExpenseTotal += amt
    }
  }
  const histMonthlyIncomeAvg = Math.round(historicalIncomeTotal / 3)
  const histMonthlyExpenseAvg = Math.round(historicalExpenseTotal / 3)

  const baselineMonthlyIncome = Math.max(recurringMonthlyIncome, histMonthlyIncomeAvg)
  const baselineMonthlyExpense = Math.max(recurringMonthlyExpense, histMonthlyExpenseAvg)

  // Calculate simulated monthly income/expenses accounting for paused recurring rules & scenario adjustments
  let pausedExpenseReduction = 0
  let pausedIncomeReduction = 0
  for (const rule of recurringRules) {
    if (pausedIds.has(rule._id.toString())) {
      const amt = convert(rule.amount, rule.currency)
      let multiplier = 1
      if (rule.frequency === "daily") multiplier = 30
      else if (rule.frequency === "weekly") multiplier = 4.33
      else if (rule.frequency === "biweekly") multiplier = 2.16
      else if (rule.frequency === "monthly") multiplier = 1
      else if (rule.frequency === "quarterly") multiplier = 1 / 3
      else if (rule.frequency === "yearly") multiplier = 1 / 12

      const val = Math.round(amt * multiplier)
      if (rule.type === "expense") pausedExpenseReduction += val
      else pausedIncomeReduction += val
    }
  }

  const simulatedMonthlyIncome = Math.max(0, baselineMonthlyIncome - pausedIncomeReduction + incomeAdj)
  const simulatedMonthlyExpense = Math.max(0, baselineMonthlyExpense - pausedExpenseReduction + expenseAdj)

  // 3. Investment & Asset Initial Pool
  let initialInvestments = initialNetWorthBreakdown.assetsBreakdown.investments
  let initialFixedAssets = initialNetWorthBreakdown.assetsBreakdown.manualAssets

  // 4. Initial Loan Debts & Active Goals
  let baselineTotalDebt = initialNetWorthBreakdown.totalLiabilities
  let simulatedTotalDebt = initialNetWorthBreakdown.totalLiabilities

  // Clone active goals for milestone simulation
  const baselineGoalsState = goals.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    target: convert(g.targetAmount, g.currency),
    current: convert(g.currentAmount, g.currency),
    completedMonth: null as string | null,
  }))

  const simulatedGoalsState = goals.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    target: convert(g.targetAmount, g.currency),
    current: convert(g.currentAmount, g.currency),
    completedMonth: null as string | null,
  }))

  // Clone active loans for milestone simulation
  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "partially_repaid" || l.status === "overdue")
  
  const getLoanName = (l: Loan) => l.type === "lent" ? `Money lent to ${l.personName}` : `Debt from ${l.personName}`
  const getLoanTerm = (l: Loan) => {
    if (l.dueDate && l.date) {
      const diff = Math.round((new Date(l.dueDate).getTime() - new Date(l.date).getTime()) / (30 * 24 * 3600 * 1000))
      return Math.max(diff, 1)
    }
    return 12
  }

  const baselineLoansState = activeLoans.map((l) => ({
    id: l._id.toString(),
    name: getLoanName(l),
    original: convert(l.amount, l.currency),
    remaining: convert(l.remainingAmount, l.currency),
    monthlyPayment: Math.max(
      Math.round(convert(l.remainingAmount, l.currency) / Math.max(getLoanTerm(l), 1)),
      1000 // default minimum $10/mo if term unspecified
    ),
    payoffMonth: null as string | null,
  }))

  const simulatedLoansState = activeLoans.map((l) => ({
    id: l._id.toString(),
    name: getLoanName(l),
    original: convert(l.amount, l.currency),
    remaining: convert(l.remainingAmount, l.currency),
    monthlyPayment: Math.max(
      Math.round(convert(l.remainingAmount, l.currency) / Math.max(getLoanTerm(l), 1)),
      1000
    ),
    payoffMonth: null as string | null,
  }))

  // 5. Generate Month-by-Month Forecast Points
  const points: ForecastPoint[] = []

  let currBaselineCash = currentLiquidCash
  let currSimulatedCash = currentLiquidCash

  let currBaselineInvestments = initialInvestments
  let currSimulatedInvestments = initialInvestments

  const baselineMonthlyRoi = Math.pow(1 + 0.07, 1 / 12) - 1
  const simulatedMonthlyRoi = Math.pow(1 + Math.max(-0.5, (scenario.investmentReturnRate ?? 7) / 100), 1 / 12) - 1

  const baselineMonthlySavingsYield = Math.pow(1 + 0.02, 1 / 12) - 1
  const simulatedMonthlySavingsYield = Math.pow(1 + Math.max(0, (scenario.savingsApy ?? 4) / 100), 1 / 12) - 1

  let baselineDebtFreeDateStr: string | null = null
  let simulatedDebtFreeDateStr: string | null = null

  for (let m = 0; m <= horizonMonths; m++) {
    const pointDate = addMonths(now, m)
    const dateStr = format(pointDate, "MMM yy")

    if (m === 0) {
      // Starting Month (Point 0)
      points.push({
        monthIndex: 0,
        date: pointDate,
        dateStr,
        baselineLiquidCash: currentLiquidCash,
        simulatedLiquidCash: currentLiquidCash,
        baselineNetWorth: currentNetWorth,
        simulatedNetWorth: currentNetWorth,
        baselineMonthlyIncome,
        simulatedMonthlyIncome,
        baselineMonthlyExpense,
        simulatedMonthlyExpense,
        baselineTotalDebt,
        simulatedTotalDebt,
        baselineGoalSavings: baselineGoalsState.reduce((sum, g) => sum + g.current, 0),
        simulatedGoalSavings: simulatedGoalsState.reduce((sum, g) => sum + g.current, 0),
      })
      continue
    }

    // --- BASELINE SIMULATION FOR MONTH m ---
    const baselineNetCashFlow = baselineMonthlyIncome - baselineMonthlyExpense
    currBaselineCash += baselineNetCashFlow

    // Baseline Cash Interest Compounding
    if (currBaselineCash > 0) {
      currBaselineCash += Math.round(currBaselineCash * baselineMonthlySavingsYield)
    }

    // Baseline Loan Payoffs
    let bTotalDebt = 0
    for (const loan of baselineLoansState) {
      if (loan.remaining > 0) {
        const payment = Math.min(loan.remaining, loan.monthlyPayment)
        loan.remaining -= payment
        currBaselineCash -= payment
        if (loan.remaining <= 0 && !loan.payoffMonth) {
          loan.payoffMonth = dateStr
        }
      }
      bTotalDebt += loan.remaining
    }
    if (bTotalDebt === 0 && !baselineDebtFreeDateStr) {
      baselineDebtFreeDateStr = dateStr
    }

    // Baseline Goal Contributions
    let bGoalSavings = 0
    for (const goal of baselineGoalsState) {
      if (goal.current < goal.target) {
        // Allocate 5% of net cash flow if positive
        const contrib = Math.max(0, Math.round(Math.max(0, baselineNetCashFlow) * 0.05))
        goal.current = Math.min(goal.target, goal.current + contrib)
        if (goal.current >= goal.target && !goal.completedMonth) {
          goal.completedMonth = dateStr
        }
      }
      bGoalSavings += goal.current
    }

    // Baseline Investment Growth (Compounded at 7% p.a. market benchmark)
    if (currBaselineInvestments === 0 && baselineNetCashFlow > 0) {
      const bInvestAlloc = Math.max(5000, Math.round(baselineNetCashFlow * 0.10))
      currBaselineCash -= bInvestAlloc
      currBaselineInvestments += bInvestAlloc
    }
    currBaselineInvestments = Math.round(currBaselineInvestments * (1 + baselineMonthlyRoi))
    const baselineNetWorth = currBaselineCash + currBaselineInvestments + initialFixedAssets - bTotalDebt

    // --- SCENARIO SIMULATION FOR MONTH m ---
    const simulatedNetCashFlow = simulatedMonthlyIncome - simulatedMonthlyExpense
    currSimulatedCash += simulatedNetCashFlow

    // Simulated Cash Interest Compounding (High-Yield Savings APY)
    if (currSimulatedCash > 0) {
      currSimulatedCash += Math.round(currSimulatedCash * simulatedMonthlySavingsYield)
    }

    // Simulated Loan Payoffs (with extra loan payment applied)
    let sTotalDebt = 0
    const perLoanExtra = extraLoanPayment > 0 && simulatedLoansState.filter(l => l.remaining > 0).length > 0
      ? Math.round(extraLoanPayment / simulatedLoansState.filter(l => l.remaining > 0).length)
      : 0

    for (const loan of simulatedLoansState) {
      if (loan.remaining > 0) {
        const payment = Math.min(loan.remaining, loan.monthlyPayment + perLoanExtra)
        loan.remaining -= payment
        currSimulatedCash -= payment
        if (loan.remaining <= 0 && !loan.payoffMonth) {
          loan.payoffMonth = dateStr
        }
      }
      sTotalDebt += loan.remaining
    }
    if (sTotalDebt === 0 && !simulatedDebtFreeDateStr) {
      simulatedDebtFreeDateStr = dateStr
    }

    // Simulated Goal Contributions (with extra goal contribution applied)
    let sGoalSavings = 0
    const activeGoalsCount = simulatedGoalsState.filter(g => g.current < g.target).length
    const perGoalExtra = extraGoalContrib > 0 && activeGoalsCount > 0
      ? Math.round(extraGoalContrib / activeGoalsCount)
      : 0

    for (const goal of simulatedGoalsState) {
      if (goal.current < goal.target) {
        const baseContrib = Math.max(0, Math.round(Math.max(0, simulatedNetCashFlow) * 0.05))
        const totalContrib = baseContrib + perGoalExtra
        goal.current = Math.min(goal.target, goal.current + totalContrib)
        currSimulatedCash -= perGoalExtra // Extra goal savings comes out of liquid cash
        if (goal.current >= goal.target && !goal.completedMonth) {
          goal.completedMonth = dateStr
        }
      }
      sGoalSavings += goal.current
    }

    // Simulated Investment Growth (Compounded at scenario ROI)
    if (currSimulatedInvestments === 0 && simulatedNetCashFlow > 0) {
      const sInvestAlloc = Math.max(5000, Math.round(simulatedNetCashFlow * 0.10))
      currSimulatedCash -= sInvestAlloc
      currSimulatedInvestments += sInvestAlloc
    }
    currSimulatedInvestments = Math.round(currSimulatedInvestments * (1 + simulatedMonthlyRoi))
    const simulatedNetWorth = currSimulatedCash + currSimulatedInvestments + initialFixedAssets - sTotalDebt

    points.push({
      monthIndex: m,
      date: pointDate,
      dateStr,
      baselineLiquidCash: currBaselineCash,
      simulatedLiquidCash: currSimulatedCash,
      baselineNetWorth,
      simulatedNetWorth,
      baselineMonthlyIncome,
      simulatedMonthlyIncome,
      baselineMonthlyExpense,
      simulatedMonthlyExpense,
      baselineTotalDebt: bTotalDebt,
      simulatedTotalDebt: sTotalDebt,
      baselineGoalSavings: bGoalSavings,
      simulatedGoalSavings: sGoalSavings,
    })
  }

  // 6. Goal & Loan Milestones
  const goalMilestones: GoalMilestone[] = goals.map((g, idx) => {
    const bState = baselineGoalsState[idx]
    const sState = simulatedGoalsState[idx]
    
    let monthsSaved = 0
    if (bState && sState) {
      const bIdx = points.findIndex((p) => p.dateStr === bState.completedMonth)
      const sIdx = points.findIndex((p) => p.dateStr === sState.completedMonth)
      if (bIdx !== -1 && sIdx !== -1) {
        monthsSaved = Math.max(0, bIdx - sIdx)
      } else if (bIdx === -1 && sIdx !== -1) {
        monthsSaved = horizonMonths - sIdx
      }
    }

    return {
      goalId: g._id.toString(),
      goalName: g.name,
      targetAmount: convert(g.targetAmount, g.currency),
      currentAmount: convert(g.currentAmount, g.currency),
      baselineCompletionDateStr: bState?.completedMonth || null,
      simulatedCompletionDateStr: sState?.completedMonth || null,
      monthsSaved,
    }
  })

  const loanMilestones: LoanMilestone[] = activeLoans.map((l, idx) => {
    const bState = baselineLoansState[idx]
    const sState = simulatedLoansState[idx]
    let monthsSaved = 0
    if (bState && sState) {
      const bIdx = points.findIndex((p) => p.dateStr === bState.payoffMonth)
      const sIdx = points.findIndex((p) => p.dateStr === sState.payoffMonth)
      if (bIdx !== -1 && sIdx !== -1) {
        monthsSaved = Math.max(0, bIdx - sIdx)
      } else if (bIdx === -1 && sIdx !== -1) {
        monthsSaved = horizonMonths - sIdx
      }
    }

    return {
      loanId: l._id.toString(),
      loanName: getLoanName(l),
      originalBalance: convert(l.amount, l.currency),
      currentBalance: convert(l.remainingAmount, l.currency),
      baselinePayoffDateStr: bState?.payoffMonth || null,
      simulatedPayoffDateStr: sState?.payoffMonth || null,
      monthsSaved,
    }
  })

  // 7. Derived Insights & Recommendations
  const insights: PlannerInsight[] = []

  // Check 12M Net Worth Delta
  const p12 = points.find((p) => p.monthIndex === 12) || points[points.length - 1]
  const netWorthDelta12M = (p12?.simulatedNetWorth || 0) - (p12?.baselineNetWorth || 0)

  if (netWorthDelta12M > 0) {
    insights.push({
      id: "nw-boost",
      type: "positive",
      title: "Scenario Accelerates Net Worth",
      description: `Your custom scenario projects a net worth gain of ${formatCurrencyAmount(netWorthDelta12M, targetCurrency)} higher over 12 months compared to baseline.`,
      metricImpact: `+${formatCurrencyAmount(netWorthDelta12M, targetCurrency)}`,
    })
  }

  // Check Emergency Reserve Buffer
  const emergencyReserveMonths = baselineMonthlyExpense > 0
    ? Number((currentLiquidCash / baselineMonthlyExpense).toFixed(1))
    : 12

  if (emergencyReserveMonths < 3) {
    insights.push({
      id: "emergency-buffer-low",
      type: "warning",
      title: "Emergency Reserve Under Target",
      description: `Your current liquid cash covers ${emergencyReserveMonths} months of baseline expenses. Financial planners recommend keeping at least 3-6 months.`,
      metricImpact: `${emergencyReserveMonths} mo coverage`,
    })
  } else {
    insights.push({
      id: "emergency-buffer-healthy",
      type: "positive",
      title: "Solid Liquidity Reserve",
      description: `You have ${emergencyReserveMonths} months of liquid expense coverage in your cash & bank accounts.`,
    })
  }

  // Check Paused Subscriptions Impact
  if (pausedIds.size > 0) {
    insights.push({
      id: "paused-subscriptions",
      type: "info",
      title: "Subscription & Bill Savings",
      description: `Pausing ${pausedIds.size} recurring items frees up ${formatCurrencyAmount(pausedExpenseReduction, targetCurrency)} monthly back into your liquid cash flow.`,
      metricImpact: `+${formatCurrencyAmount(pausedExpenseReduction * 12, targetCurrency)} / yr`,
    })
  }

  // Check Debt Payoff Acceleration
  if (extraLoanPayment > 0 && simulatedDebtFreeDateStr) {
    insights.push({
      id: "debt-payoff-accelerated",
      type: "positive",
      title: "Faster Debt Freedom",
      description: `Adding ${formatCurrencyAmount(extraLoanPayment, targetCurrency)} monthly accelerates your debt payoff timeline to ${simulatedDebtFreeDateStr}.`,
    })
  }

  return {
    targetCurrency,
    horizonMonths,
    currentNetWorth,
    currentLiquidCash,
    projectedBaseline12MNetWorth: p12?.baselineNetWorth || currentNetWorth,
    projectedSimulated12MNetWorth: p12?.simulatedNetWorth || currentNetWorth,
    baselineDebtFreeDateStr,
    simulatedDebtFreeDateStr,
    emergencyReserveMonths,
    points,
    goalMilestones,
    loanMilestones,
    insights,
  }
}

function formatCurrencyAmount(cents: number, currency: string): string {
  const units = cents / 100
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(units)
  } catch {
    return `${currency} ${units.toLocaleString()}`
  }
}
