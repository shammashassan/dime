import { cache } from "react"
import { getCollection, coachMessagesCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getBudgetsWithSpending } from "./budgets"
import { getActiveRecurringRules } from "./recurring"
import { getLoans } from "./loans"
import { getGoals } from "./goals"
import { getFinancialHealthData } from "./financial-health"
import {
  Transaction,
  LoanRepayment,
  CoachOverviewData,
  SerializedCoachMessage,
} from "@/types"
import {
  analyzeEmergencyFund,
  analyzeDebtPayoff,
  analyzeGoalAcceleration,
  analyzeSubscriptionTrimming,
  analyzeBudgetTuning,
  synthesizeCoachStrategies,
  generateDeterministicBriefing,
} from "@/lib/calculations/coach"

export const getCoachOverviewData = cache(
  async (userId: string): Promise<CoachOverviewData> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const [
      wallets,
      budgets,
      recurringRules,
      loans,
      goals,
      exchangeRates,
      healthData,
    ] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getBudgetsWithSpending(userId),
      getActiveRecurringRules(userId),
      getLoans(),
      getGoals(userId),
      getExchangeRates(targetCurrency),
      getFinancialHealthData(userId),
    ])

    // Fetch transactions from the past 180 days
    const transactionsColl = await getCollection<Transaction>("transactions")
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    const transactions = await transactionsColl
      .find({
        ...filter,
        date: { $gte: sixMonthsAgo },
      })
      .sort({ date: -1 })
      .toArray()

    // Fetch loan repayments
    const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
    const repayments = await repaymentsColl.find(filter).toArray()

    // Fetch recent chat messages for this user/scope (within 30 days retention window)
    const messagesColl = await getCollection<any>("coach_messages")
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const rawMessages = await messagesColl
      .find({
        userId,
        ...(scope.isOrganization && scope.organizationId ? { organizationId: scope.organizationId } : {}),
        createdAt: { $gte: thirtyDaysAgo },
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    const recentChatMessages: SerializedCoachMessage[] = rawMessages.reverse().map((m: any) => ({
      _id: m._id.toString(),
      userId: m.userId,
      organizationId: m.organizationId || null,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date(m.createdAt).toISOString(),
    }))

    // Run deterministic calculation engines (0 external API calls)
    const emergencyFund = analyzeEmergencyFund({
      wallets,
      transactions,
      targetCurrency,
      exchangeRates,
    })

    const debtComparison = analyzeDebtPayoff({
      loans,
      repayments,
      extraMonthlyPaymentCents: 10000,
      targetCurrency,
      exchangeRates,
    })

    const goalAccelerations = analyzeGoalAcceleration({
      goals,
      targetCurrency,
      exchangeRates,
    })

    const subscriptionStats = analyzeSubscriptionTrimming({
      recurringRules,
      targetCurrency,
      exchangeRates,
    })

    const budgetStats = analyzeBudgetTuning({
      budgets,
      transactions,
      targetCurrency,
      exchangeRates,
    })

    const strategies = synthesizeCoachStrategies({
      emergencyFund,
      debtComparison,
      goalAccelerations,
      subscriptionStats,
      budgetStats,
      currency: targetCurrency,
    })

    const summaryBrief = generateDeterministicBriefing({
      strategies,
      emergencyFund,
      debtComparison,
      currency: targetCurrency,
    })

    // Compute active goals on track ratio
    const activeGoals = goalAccelerations
    const onTrackGoals = activeGoals.filter((g) => g.status !== "behind").length

    return {
      metrics: {
        emergencyRunwayMonths: emergencyFund.currentRunwayMonths,
        monthsToDebtFree: debtComparison ? debtComparison.currentPayoffMonths : null,
        potentialMonthlyOptimizationCents: strategies.reduce(
          (acc, s) => acc + (s.details?.monthlyBenefitCents || 0),
          0
        ),
        goalsOnTrackRatio: {
          onTrack: onTrackGoals,
          total: activeGoals.length,
        },
        healthScore: healthData.overallScore,
      },
      summaryBrief,
      strategies,
      emergencyFund,
      debtComparison,
      goalAccelerations,
      recentChatMessages,
      targetCurrency,
    }
  }
)
