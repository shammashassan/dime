import { db } from "./client"
import { Wallet, Transaction, Category, Budget, RecurringRule, ExchangeRate, OrganizationSettings, Notification, AutomationRule, AutomationJob, Contact, Loan, LoanRepayment, Asset, AssetValuation } from "@/types"

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
export const contactsCollection = db.collection<Contact>("contacts")
export const loansCollection = db.collection<Loan>("loans")
export const loanRepaymentsCollection = db.collection<LoanRepayment>("loan_repayments")
export const assetsCollection = db.collection<Asset>("assets")
export const assetValuationsCollection = db.collection<AssetValuation>("asset_valuations")

export async function getCollection<T extends object>(name: string) {
  return db.collection<T>(name)
}
