import { db } from "./client"
import { Wallet, Transaction, Category, Budget, RecurringRule, ExchangeRate } from "@/types"

export const walletsCollection = db.collection<Wallet>("wallets")
export const transactionsCollection = db.collection<Transaction>("transactions")
export const categoriesCollection = db.collection<Category>("categories")
export const budgetsCollection = db.collection<Budget>("budgets")
export const recurringRulesCollection = db.collection<RecurringRule>("recurring_rules")
export const exchangeRatesCollection = db.collection<ExchangeRate>("exchange_rates")

export async function getCollection<T extends object>(name: string) {
  return db.collection<T>(name)
}
