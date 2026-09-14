import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getBudgetsWithSpending } from "./budgets"
import { getActiveRecurringRules } from "./recurring"
import { getLoans } from "./loans"
import { getGoals } from "./goals"
import { getAssetsAndValuationsForScope } from "./assets"
import {
  Transaction,
  LoanRepayment,
  InvestmentHolding,
  FinancialHealthData,
} from "@/types"
import { calculateFinancialHealth } from "@/lib/calculations/financial-health"

export const getFinancialHealthData = cache(
  async (userId: string): Promise<FinancialHealthData> => {
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
      { assets },
      exchangeRates,
    ] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getBudgetsWithSpending(userId),
      getActiveRecurringRules(userId),
      getLoans(),
      getGoals(userId),
      getAssetsAndValuationsForScope(),
      getExchangeRates(targetCurrency),
    ])

    // Fetch transactions from the past 180 days (6 months)
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

    // Fetch active investment holdings
    const holdingsColl = await getCollection<InvestmentHolding>("investment_holdings")
    const investmentHoldings = await holdingsColl.find({ ...filter, status: "active" }).toArray()

    return calculateFinancialHealth({
      wallets,
      transactions,
      budgets,
      goals,
      loans,
      repayments,
      recurringRules,
      assets,
      investmentHoldings,
      targetCurrency,
      exchangeRates,
    })
  }
)

export const getFinancialHealthScore = getFinancialHealthData
