import test from "node:test"
import assert from "node:assert/strict"
import { buildPortfolioViewModel, buildAccountViewModel } from "../investments"
import { buildSharedExpensesOverviewViewModel } from "../shared-expenses"
import { InvestmentHolding, Wallet, SharedExpense } from "@/types"
import { ObjectId } from "mongodb"

test("Multi-Currency Integration: Investments Portfolio Aggregation", () => {
  const dummyWalletUSD: Wallet = {
    _id: new ObjectId(),
    userId: "user-1",
    name: "US Brokerage",
    type: "investment",
    balance: 0,
    currency: "USD",
    color: "#8b5cf6",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const dummyWalletEUR: Wallet = {
    _id: new ObjectId(),
    userId: "user-1",
    name: "EU Brokerage",
    type: "investment",
    balance: 0,
    currency: "EUR",
    color: "#3b82f6",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const holdingUSD: InvestmentHolding = {
    _id: new ObjectId(),
    userId: "user-1",
    organizationId: null,
    walletId: dummyWalletUSD._id.toString(),
    symbol: "AAPL",
    name: "Apple Inc.",
    assetType: "stock",
    quantity: 10,
    averageCostBasis: 15000, // $150.00
    totalCostBasis: 150000,  // $1,500.00
    currentPrice: 18000,    // $180.00 -> totalValue = $1,800.00 (gain = $300.00)
    status: "active",
    realizedGain: 5000,     // $50.00
    currency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const holdingEUR: InvestmentHolding = {
    _id: new ObjectId(),
    userId: "user-1",
    organizationId: null,
    walletId: dummyWalletEUR._id.toString(),
    symbol: "SAP",
    name: "SAP SE",
    assetType: "stock",
    quantity: 10,
    averageCostBasis: 10000, // €100.00
    totalCostBasis: 100000,  // €1,000.00
    currentPrice: 12000,    // €120.00 -> totalValue = €1,200.00 (gain = €200.00)
    status: "active",
    realizedGain: 2000,     // €20.00
    currency: "EUR",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Converter mock: EUR to USD is 1.1x
  const convert = (amount: number, from: string) => {
    if (from === "EUR") return Math.round(amount * 1.1)
    return amount
  }

  // Without converter: raw sum (180,000 + 120,000 = 300,000)
  const rawModel = buildPortfolioViewModel([holdingUSD, holdingEUR])
  assert.equal(rawModel.totalValue, 300000)
  assert.equal(rawModel.totalCostBasis, 250000)
  assert.equal(rawModel.unrealizedGain, 50000)
  assert.equal(rawModel.realizedGain, 7000)

  // With converter to USD:
  // AAPL: 180,000 USD
  // SAP: 120,000 EUR * 1.1 = 132,000 USD
  // Total Value = 312,000 USD
  // Total Cost Basis = 150,000 + (100,000 * 1.1 = 110,000) = 260,000 USD
  // Unrealized Gain = 312,000 - 260,000 = 52,000 USD
  // Realized Gain = 5,000 + (2,000 * 1.1 = 2,200) = 7,200 USD
  const convertedModel = buildPortfolioViewModel([holdingUSD, holdingEUR], convert)
  assert.equal(convertedModel.totalValue, 312000)
  assert.equal(convertedModel.totalCostBasis, 260000)
  assert.equal(convertedModel.unrealizedGain, 52000)
  assert.equal(convertedModel.realizedGain, 7200)

  // Test buildAccountViewModel with converter
  const accountEurModel = buildAccountViewModel([holdingUSD, holdingEUR], dummyWalletEUR, convert)
  assert.equal(accountEurModel.currency, "EUR")
  assert.equal(accountEurModel.totalValue, 120000) // Native EUR
  assert.equal(accountEurModel.convertedTotalValue, 132000) // Converted to USD
  assert.equal(accountEurModel.unrealizedGain, 20000) // Native EUR
  assert.equal(accountEurModel.convertedUnrealizedGain, 22000) // Converted to USD
})

test("Multi-Currency Integration: Shared Expenses Calculation", () => {
  const user1 = "user-1"
  const contact2 = "contact-2"

  // Expense 1 in EUR: €100 total, user1 paid €100, split 50/50 (€50 each)
  const expenseEUR: SharedExpense = {
    _id: new ObjectId(),
    userId: user1,
    organizationId: null,
    title: "Dinner in Paris",
    totalAmount: 10000, // €100.00
    currency: "EUR",
    paidByParticipantId: user1,
    paidByParticipantType: "user",
    splitMode: "equal",
    status: "unsettled",
    participants: [
      { participantId: user1, participantType: "user", name: "Alice", amountPaid: 10000, amountOwed: 5000 },
      { participantId: contact2, participantType: "contact", name: "Bob", amountPaid: 0, amountOwed: 5000 },
    ],
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }

  // Expense 2 in USD: $40 total, contact2 paid $40, split 50/50 ($20 each)
  const expenseUSD: SharedExpense = {
    _id: new ObjectId(),
    userId: user1,
    organizationId: null,
    title: "Uber in NY",
    totalAmount: 4000, // $40.00
    currency: "USD",
    paidByParticipantId: contact2,
    paidByParticipantType: "contact",
    splitMode: "equal",
    status: "unsettled",
    participants: [
      { participantId: user1, participantType: "user", name: "Alice", amountPaid: 0, amountOwed: 2000 },
      { participantId: contact2, participantType: "contact", name: "Bob", amountPaid: 4000, amountOwed: 2000 },
    ],
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }

  // Converter mock to USD (Base): EUR is 1.1x
  const convert = (amount: number, from: string) => {
    if (from === "EUR") return Math.round(amount * 1.1)
    return amount
  }

  const vm = buildSharedExpensesOverviewViewModel({
    currentUserId: user1,
    currentUserName: "Alice",
    expenses: [expenseEUR, expenseUSD],
    settlements: [],
    baseCurrency: "USD",
    convert,
  })

  // Total shared amount: €100 (* 1.1 = $110) + $40 = $150
  assert.equal(vm.totalSharedAmount, 15000)
  assert.equal(vm.currency, "USD")

  // Alice:
  // Paid: €100 (* 1.1 = $110) + $0 = $110
  // Share: €50 (* 1.1 = $55) + $20 = $75
  // Net Balance: 110 - 75 = +$35 (Bob owes Alice $35)
  assert.equal(vm.userNetBalance, 3500)
  assert.equal(vm.userTotalOwedFromOthers, 3500)
  assert.equal(vm.userTotalOwedToOthers, 0)
})
