import { getCollection } from "@/lib/db/collections"
import { getScopeFilter, getFinancialScope } from "@/lib/scope"
import { Transaction, Loan, Wallet } from "@/types"
import { SYSTEM_BUDGET_TEMPLATES } from "./system-templates"

export interface TemplateRecommendation {
  recommendedTemplateId: string
  templateName: string
  rationale: string
  suggestedMonthlyAmount: number // in smallest currency unit (cents / paise)
  currency: string
  averageMonthlyIncome: number
  hasSufficientData: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function computeTemplateRecommendation(userId: string): Promise<TemplateRecommendation> {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const [txColl, loansColl, walletsColl] = await Promise.all([
    getCollection<Transaction>("transactions"),
    getCollection<Loan>("loans"),
    getCollection<Wallet>("wallets"),
  ])

  // Get primary wallet currency
  const wallets = await walletsColl.find(filter).toArray()
  const primaryWallet = wallets.find((w) => !w.isArchived) || wallets[0]
  const currency = primaryWallet?.currency || "USD"

  // Check past 90 days of transactions
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const txs = await txColl
    .find({
      ...filter,
      date: { $gte: ninetyDaysAgo },
    })
    .toArray()

  // Incomes across past 90 days broken into three 30-day buckets
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000)

  let m1Income = 0
  let m2Income = 0
  let m3Income = 0

  let totalExpense = 0
  let totalIncome = 0

  for (const tx of txs) {
    if (tx.type === "income") {
      totalIncome += tx.amount
      if (tx.date >= thirtyDaysAgo) m1Income += tx.amount
      else if (tx.date >= sixtyDaysAgo) m2Income += tx.amount
      else m3Income += tx.amount
    } else if (tx.type === "expense") {
      totalExpense += tx.amount
    }
  }

  const avgMonthlyIncome = Math.round(totalIncome > 0 ? totalIncome / 3 : (totalExpense > 0 ? totalExpense / 3 : (currency === "INR" ? 5000000 : 300000)))
  const hasSufficientData = txs.length >= 10

  // Check active debts
  const activeLoans = await loansColl.find({ ...filter, status: "active", type: "borrowed" }).toArray()
  const totalBorrowedDebt = activeLoans.reduce((sum, l) => sum + (l.remainingAmount ?? l.amount), 0)
  const isHighDebt = totalBorrowedDebt > (avgMonthlyIncome * 2) // Total debt > 2 months income

  // Measure income volatility (standard deviation of 3 months / mean)
  const monthlyIncomes = [m1Income, m2Income, m3Income].filter((v) => v > 0)
  let isVolatileIncome = false
  if (monthlyIncomes.length >= 2) {
    const mean = totalIncome / 3
    const variance = monthlyIncomes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / monthlyIncomes.length
    const stdDev = Math.sqrt(variance)
    if (mean > 0 && stdDev / mean > 0.35) {
      isVolatileIncome = true
    }
  }

  // Decision Heuristic
  let recommendedId = "50-30-20"
  let rationale = "A balanced, battle-tested starting point dividing your monthly budget into 50% Needs, 30% Wants, and 20% Savings."

  if (isHighDebt) {
    recommendedId = "debt-payoff"
    rationale = `You have active debt obligations. The Aggressive Debt Payoff template directs up to 35% of monthly budget toward debt acceleration.`
  } else if (isVolatileIncome) {
    recommendedId = "freelancer"
    rationale = `Your income shows month-to-month variance. The Freelancer template builds a 20% cash buffer and protects tax obligations.`
  } else if (totalExpense > 0 && totalIncome > 0 && totalExpense >= totalIncome * 0.9) {
    recommendedId = "zero-based"
    rationale = `Your expenses closely track your incoming cash flow. A Zero-Based Budget gives every currency unit an intentional purpose.`
  }

  const matchedTemplate = SYSTEM_BUDGET_TEMPLATES.find((t) => t._id === recommendedId) || SYSTEM_BUDGET_TEMPLATES[0]

  return {
    recommendedTemplateId: matchedTemplate._id.toString(),
    templateName: matchedTemplate.name,
    rationale,
    suggestedMonthlyAmount: avgMonthlyIncome,
    currency,
    averageMonthlyIncome: avgMonthlyIncome,
    hasSufficientData,
  }
}
