import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getActiveRecurringRules } from "./recurring"
import { getLoans } from "./loans"
import { getGoals } from "./goals"
import { getAssetsAndValuationsForScope } from "./assets"
import {
  Transaction,
  LoanRepayment,
  InvestmentHolding,
  PlannerScenario,
  SerializedPlannerScenario,
} from "@/types"
import { BaselineFinancialState } from "@/lib/calculations/forecasting"
import { ObjectId } from "mongodb"

export const getPlannerBaselineData = cache(
  async (userId: string): Promise<BaselineFinancialState> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const [
      wallets,
      recurringRules,
      loans,
      goals,
      { assets },
      exchangeRates,
    ] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getActiveRecurringRules(userId),
      getLoans(),
      getGoals(userId),
      getAssetsAndValuationsForScope(),
      getExchangeRates(targetCurrency),
    ])

    // Fetch 90-day transactions for historical non-recurring average
    const transactionsColl = await getCollection<Transaction>("transactions")
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const transactions = await transactionsColl
      .find({
        ...filter,
        date: { $gte: ninetyDaysAgo },
      })
      .sort({ date: -1 })
      .toArray()

    // Fetch loan repayments
    const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
    const repayments = await repaymentsColl.find(filter).toArray()

    // Fetch investment holdings
    const holdingsColl = await getCollection<InvestmentHolding>("investment_holdings")
    const investmentHoldings = await holdingsColl.find({ ...filter, status: "active" }).toArray()

    return {
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
    }
  }
)

export const getPlannerScenarios = cache(
  async (userId: string): Promise<SerializedPlannerScenario[]> => {
    const scope = await getFinancialScope()
    const scenariosColl = await getCollection<PlannerScenario>("planner_scenarios")
    const scenarios = await scenariosColl
      .find(getScopeFilter(scope))
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray()

    return scenarios.map((s) => ({
      _id: s._id.toString(),
      userId: s.userId,
      name: s.name,
      description: s.description,
      isDefault: s.isDefault,
      monthlyIncomeAdjustment: s.monthlyIncomeAdjustment,
      monthlyExpenseAdjustment: s.monthlyExpenseAdjustment,
      extraLoanRepayment: s.extraLoanRepayment,
      extraGoalContribution: s.extraGoalContribution,
      pausedRecurringIds: s.pausedRecurringIds || [],
      investmentReturnRate: s.investmentReturnRate,
      horizonMonths: s.horizonMonths,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))
  }
)

export const getPlannerScenarioById = cache(
  async (userId: string, scenarioId: string): Promise<SerializedPlannerScenario | null> => {
    try {
      const scope = await getFinancialScope()
      const scenariosColl = await getCollection<PlannerScenario>("planner_scenarios")
      const s = await scenariosColl.findOne({
        _id: new ObjectId(scenarioId),
        ...getScopeFilter(scope),
      })
      if (!s) return null

      return {
        _id: s._id.toString(),
        userId: s.userId,
        name: s.name,
        description: s.description,
        isDefault: s.isDefault,
        monthlyIncomeAdjustment: s.monthlyIncomeAdjustment,
        monthlyExpenseAdjustment: s.monthlyExpenseAdjustment,
        extraLoanRepayment: s.extraLoanRepayment,
        extraGoalContribution: s.extraGoalContribution,
        pausedRecurringIds: s.pausedRecurringIds || [],
        investmentReturnRate: s.investmentReturnRate,
        horizonMonths: s.horizonMonths,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }
    } catch {
      return null
    }
  }
)
