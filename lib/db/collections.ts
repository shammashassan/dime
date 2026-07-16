import { db } from "./client"
import { Wallet, Transaction, Category, Budget, RecurringRule, ExchangeRate, OrganizationSettings, Notification, AutomationRule, AutomationJob } from "@/types"

export const walletsCollection = db.collection<Wallet>("wallets")
export const transactionsCollection = db.collection<Transaction>("transactions")
export const categoriesCollection = db.collection<Category>("categories")
export const budgetsCollection = db.collection<Budget>("budgets")
export const recurringRulesCollection = db.collection<RecurringRule>("recurring_rules")
export const exchangeRatesCollection = db.collection<ExchangeRate>("exchange_rates")
export const organizationSettingsCollection = db.collection<OrganizationSettings>("organization_settings")
export const notificationsCollection = db.collection<Notification>("notifications")
export const automationRulesCollection = db.collection<AutomationRule>("automation_rules")
export const automationJobsCollection = db.collection<AutomationJob>("automation_jobs")

export async function getCollection<T extends object>(name: string) {
  return db.collection<T>(name)
}
