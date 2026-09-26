import { Collection, Document } from "mongodb"
import { getRawDb, invalidateClient } from "./client"
import {
  Wallet,
  Transaction,
  Category,
  Budget,
  RecurringRule,
  ExchangeRate,
  OrganizationSettings,
  Notification,
  AutomationRule,
  AutomationJob,
  Contact,
  Loan,
  LoanRepayment,
  Asset,
  AssetValuation,
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentPrice,
  Watchlist,
  WatchlistItem,
  SharedExpense,
  SharedSettlement,
  PlannerScenario,
  UserInsightState,
  CalendarPlanEvent,
  Goal,
  SavedSearch,
  BudgetTemplate,
  CoachMessage,
} from "@/types"

function createDynamicCollection<T extends Document = Document>(name: string): Collection<T> {
  return new Proxy({} as Collection<T>, {
    get(target, prop, receiver) {
      const activeDb = getRawDb()
      const coll = activeDb.collection<T>(name)
      const val = Reflect.get(coll, prop, receiver)
      if (typeof val === "function") {
        return function (this: unknown, ...args: unknown[]) {
          try {
            const result = val.apply(coll, args)
            // If the method returns a Promise, catch MongoTopologyClosedError, invalidate client, and auto-retry once
            if (result && typeof result === "object" && typeof (result as Promise<unknown>).then === "function") {
              return (result as Promise<unknown>).catch(async (err: unknown) => {
                if (err && typeof err === "object" && ("name" in err || "message" in err)) {
                  const errorName = (err as { name?: string }).name
                  const errorMsg = (err as { message?: string }).message || ""
                  if (errorName === "MongoTopologyClosedError" || errorMsg.includes("Topology is closed")) {
                    invalidateClient()
                    const freshColl = getRawDb().collection<T>(name)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return await (freshColl[prop as keyof Collection<T>] as (...a: unknown[]) => any)(...args)
                  }
                }
                throw err
              })
            }
            // If the method returns a Cursor (find, aggregate, etc.), wrap toArray with auto-retry
            if (result && typeof result === "object" && typeof (result as { toArray?: unknown }).toArray === "function") {
              const cursorObj = result as { toArray: () => Promise<unknown[]> }
              const origToArray = cursorObj.toArray.bind(cursorObj)
              cursorObj.toArray = async function () {
                try {
                  return await origToArray()
                } catch (err: unknown) {
                  if (err && typeof err === "object" && ("name" in err || "message" in err)) {
                    const errorName = (err as { name?: string }).name
                    const errorMsg = (err as { message?: string }).message || ""
                    if (errorName === "MongoTopologyClosedError" || errorMsg.includes("Topology is closed")) {
                      invalidateClient()
                      // Auto-retry once with a fresh, reconnected client
                      const freshColl = getRawDb().collection<T>(name)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const freshCursor = (freshColl[prop as keyof Collection<T>] as (...a: unknown[]) => any)(...args)
                      return await freshCursor.toArray()
                    }
                  }
                  throw err
                }
              }
            }
            return result
          } catch (err: unknown) {
            if (err && typeof err === "object" && ("name" in err || "message" in err)) {
              const errorName = (err as { name?: string }).name
              const errorMsg = (err as { message?: string }).message || ""
              if (errorName === "MongoTopologyClosedError" || errorMsg.includes("Topology is closed")) {
                invalidateClient()
              }
            }
            throw err
          }
        }
      }
      return val
    },
  })
}

export const walletsCollection = createDynamicCollection<Wallet>("wallets")
export const transactionsCollection = createDynamicCollection<Transaction>("transactions")
export const categoriesCollection = createDynamicCollection<Category>("categories")
export const budgetsCollection = createDynamicCollection<Budget>("budgets")
export const budgetTemplatesCollection = createDynamicCollection<BudgetTemplate>("budget_templates")
export const recurringRulesCollection = createDynamicCollection<RecurringRule>("recurring_rules")
export const exchangeRatesCollection = createDynamicCollection<ExchangeRate>("exchange_rates")
export const organizationSettingsCollection = createDynamicCollection<OrganizationSettings>("organization_settings")
export const notificationsCollection = createDynamicCollection<Notification>("notifications")
export const automationRulesCollection = createDynamicCollection<AutomationRule>("automation_rules")
export const automationJobsCollection = createDynamicCollection<AutomationJob>("automation_jobs")
export const contactsCollection = createDynamicCollection<Contact>("contacts")
export const loansCollection = createDynamicCollection<Loan>("loans")
export const loanRepaymentsCollection = createDynamicCollection<LoanRepayment>("loan_repayments")
export const assetsCollection = createDynamicCollection<Asset>("assets")
export const assetValuationsCollection = createDynamicCollection<AssetValuation>("asset_valuations")
export const investmentHoldingsCollection = createDynamicCollection<InvestmentHolding>("investment_holdings")
export const investmentTransactionsCollection = createDynamicCollection<InvestmentTransaction>("investment_transactions")
export const investmentPricesCollection = createDynamicCollection<InvestmentPrice>("investment_prices")
export const watchlistsCollection = createDynamicCollection<Watchlist>("watchlists")
export const watchlistItemsCollection = createDynamicCollection<WatchlistItem>("watchlist_items")
export const sharedExpensesCollection = createDynamicCollection<SharedExpense>("shared_expenses")
export const sharedSettlementsCollection = createDynamicCollection<SharedSettlement>("shared_settlements")
export const plannerScenariosCollection = createDynamicCollection<PlannerScenario>("planner_scenarios")
export const userInsightStatesCollection = createDynamicCollection<UserInsightState>("user_insight_states")
export const calendarEventsCollection = createDynamicCollection<CalendarPlanEvent>("calendar_events")
export const goalsCollection = createDynamicCollection<Goal>("goals")
export const savedSearchesCollection = createDynamicCollection<SavedSearch>("saved_searches")
export const coachMessagesCollection = createDynamicCollection<CoachMessage>("coach_messages")

export async function getCollection<T extends Document = Document>(name: string) {
  return createDynamicCollection<T>(name)
}
