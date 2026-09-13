import { cache } from "react"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import {
  walletsCollection,
  transactionsCollection,
  recurringRulesCollection,
  categoriesCollection,
  loansCollection,
  loanRepaymentsCollection,
  calendarEventsCollection,
  getCollection,
} from "@/lib/db/collections"
import { getExchangeRates } from "@/lib/currency"
import { getPreferences } from "./preferences"
import { calculateCashFlowCalendar } from "@/lib/calculations/cash-flow-calendar"
import {
  BillInstance,
  CashFlowMonthOverview,
} from "@/types"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"

export interface GetCashFlowCalendarOptions {
  month?: string // YYYY-MM
  mode?: "liquid" | "all"
}

export const getCashFlowCalendarData = cache(
  async (userId: string, options: GetCashFlowCalendarOptions = {}): Promise<CashFlowMonthOverview> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)

    const targetMonth = options.month || format(new Date(), "yyyy-MM")
    const mode = options.mode || "liquid"

    const prefs = await getPreferences(userId)
    const targetCurrency = prefs.defaultCurrency || "USD"

    const [yearStr, monthStr] = targetMonth.split("-")
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    const monthDate = new Date(Date.UTC(year, month - 1, 1))
    const windowStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
    const windowEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })

    const billsColl = await getCollection<BillInstance>("bill_instances")

    const [
      wallets,
      transactions,
      recurringRules,
      bills,
      loans,
      repayments,
      plans,
      categories,
      exchangeRates,
    ] = await Promise.all([
      walletsCollection.find(filter).toArray(),
      transactionsCollection
        .find({
          ...filter,
          date: { $gte: windowStart },
        })
        .sort({ date: 1 })
        .toArray(),
      recurringRulesCollection.find({ ...filter, isActive: true }).toArray(),
      billsColl.find(filter).toArray(),
      loansCollection.find(filter).toArray(),
      loanRepaymentsCollection.find(filter as any).toArray(),
      calendarEventsCollection
        .find({
          ...filter,
          date: { $gte: windowStart, $lte: windowEnd },
        })
        .toArray(),
      categoriesCollection.find({}).toArray(),
      getExchangeRates(targetCurrency),
    ])

    return calculateCashFlowCalendar({
      targetMonth,
      wallets,
      transactions,
      recurringRules,
      bills,
      loans,
      repayments,
      plans,
      categories,
      targetCurrency,
      exchangeRates: exchangeRates || {},
      mode,
      safetyBufferCents: 50000, // $500 default buffer
    })
  }
)
