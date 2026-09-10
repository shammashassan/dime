import { cache } from "react"
import {
  transactionsCollection,
  categoriesCollection,
  budgetsCollection,
  recurringRulesCollection,
  userInsightStatesCollection,
} from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import type { SpendingInsightsData } from "@/types"
import {
  calculateSpendingInsights,
  generateExecutiveBriefing,
} from "@/lib/calculations/insights"
import { subDays } from "date-fns"

export const getFinancialInsightsData = cache(
  async (userId: string): Promise<SpendingInsightsData> => {
    const [scope, prefs] = await Promise.all([
      getFinancialScope(),
      getPreferences(userId),
    ])
    const scopeFilter = getScopeFilter(scope)
    const targetCurrency = prefs?.defaultCurrency || "USD"

    const now = new Date()
    const past120Days = subDays(now, 120)

    const [
      transactions,
      categories,
      budgets,
      recurringRules,
      userStates,
      exchangeRates,
    ] = await Promise.all([
      transactionsCollection
        .find({
          ...scopeFilter,
          date: { $gte: past120Days },
        })
        .sort({ date: -1 })
        .toArray(),
      categoriesCollection
        .find({
          $or: [scopeFilter, { userId: null }],
        })
        .toArray(),
      budgetsCollection.find({ ...scopeFilter, isActive: true }).toArray(),
      recurringRulesCollection.find({ ...scopeFilter, isActive: true }).toArray(),
      userInsightStatesCollection.find({ userId }).toArray(),
      getExchangeRates(targetCurrency),
    ])

    const calculationResult = calculateSpendingInsights({
      transactions,
      categories,
      budgets,
      recurringRules,
      userStates,
      targetCurrency,
      exchangeRates,
      referenceDate: now,
    })

    // Synthesize narrative asynchronously
    const briefing = await generateExecutiveBriefing(
      calculationResult.insights,
      calculationResult.metrics,
      targetCurrency
    )

    return {
      ...calculationResult,
      executiveBriefing: briefing,
    }
  }
)

// Legacy adapter for backwards compatibility with existing consumers
export interface FinancialInsight {
  id: string
  type: "warning" | "success" | "info" | "tip"
  title: string
  description: string
  categoryName?: string
  amount?: number
}

export const getFinancialInsights = cache(
  async (userId: string): Promise<FinancialInsight[]> => {
    const data = await getFinancialInsightsData(userId)
    const mapped: FinancialInsight[] = data.insights.map((ins) => ({
      id: ins.id,
      type:
        ins.severity === "critical"
          ? "warning"
          : ins.severity === "opportunity"
            ? "tip"
            : ins.severity === "warning"
              ? "warning"
              : "info",
      title: ins.title,
      description: ins.description,
      amount: ins.metricImpact,
    }))

    if (mapped.length === 0) {
      return [
        {
          id: "info-start",
          type: "info",
          title: "Smart Insights Queueing",
          description:
            "Log a few more transactions across different wallets and categories to begin receiving AI-driven financial metrics.",
        },
        {
          id: "tip-budget",
          type: "tip",
          title: "Pro Budgeting Tip",
          description:
            "Users who set strict monthly alert thresholds on food and shopping categories save up to 18% more on average.",
        },
      ]
    }

    return mapped
  }
)

