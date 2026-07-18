import { Wallet, Transaction, Loan, LoanRepayment, Asset, AssetValuation } from "../types";
import { calculateCurrentNetWorth, calculateNetWorthHistory } from "../lib/calculations/net-worth";

const mockWallets: Wallet[] = [
  {
    _id: "w1" as any,
    userId: "u1",
    name: "Bank",
    type: "bank",
    currency: "USD",
    balance: 100000, // $1000.00
    color: "#000",
    icon: "Wallet",
    isArchived: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date(),
  },
  {
    _id: "w2" as any,
    userId: "u1",
    name: "Credit Card",
    type: "credit_card",
    currency: "USD",
    balance: -20000, // -$200.00
    color: "#000",
    icon: "CreditCard",
    isArchived: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date(),
  }
];

const mockLoans: Loan[] = [
  {
    _id: "l1" as any,
    userId: "u1",
    organizationId: null,
    type: "lent",
    contactId: "c1",
    personName: "Bob",
    amount: 50000, // $500.00
    currency: "USD",
    walletId: "w1",
    transactionId: "tx1",
    date: new Date("2026-02-15"),
    status: "active",
    remainingAmount: 30000, // $300.00 remaining
    reminderSchedule: [],
    sentReminders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }
];

const mockRepayments: LoanRepayment[] = [
  {
    _id: "rep1" as any,
    loanId: "l1",
    transactionId: "tx2",
    amount: 20000, // $200.00 paid on March 5
    date: new Date("2026-03-05"),
    createdAt: new Date()
  }
];

const mockTransactions: Transaction[] = [
  {
    _id: "tx2" as any,
    userId: "u1",
    walletId: "w1",
    type: "income",
    amount: 20000,
    currency: "USD",
    description: "Loan repayment from Bob",
    date: new Date("2026-03-05"),
    tags: [],
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockAssets: Asset[] = [
  {
    _id: "a1" as any,
    userId: "u1",
    organizationId: null,
    name: "Tesla Stock",
    kind: "asset",
    category: "investment",
    currency: "USD",
    currentValue: 50000, // $500.00
    valuationMethod: "manual",
    ownershipPercentage: 100,
    notes: "",
    status: "active",
    isArchived: false,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date(),
    version: 1
  }
];

const mockValuations: AssetValuation[] = [
  {
    _id: "v1" as any,
    assetId: "a1",
    userId: "u1",
    organizationId: null,
    date: new Date("2026-01-10"),
    value: 40000, // $400.00 initial
    source: "manual",
    createdAt: new Date()
  },
  {
    _id: "v2" as any,
    assetId: "a1",
    userId: "u1",
    organizationId: null,
    date: new Date("2026-03-10"),
    value: 50000, // $500.00 updated
    source: "manual",
    createdAt: new Date()
  }
];

const convertUSD = (amount: number, from: string) => amount; // Simple 1:1

// Run Current Net Worth Test
console.log("Testing current net worth...");
const current = calculateCurrentNetWorth({
  wallets: mockWallets,
  loans: mockLoans,
  assets: mockAssets,
  convert: convertUSD
});
console.log("Current Net Worth:", current.netWorth);
console.assert(current.netWorth === 160000, `Expected 160000, got ${current.netWorth}`);

// Run History Net Worth Test
console.log("Testing historical net worth...");
const dates = [
  new Date("2026-01-31"), // end of Jan
  new Date("2026-02-28"), // end of Feb
  new Date("2026-03-31")  // end of Mar
];

const history = calculateNetWorthHistory({
  wallets: mockWallets,
  transactions: mockTransactions,
  loans: mockLoans,
  repayments: mockRepayments,
  assets: mockAssets,
  valuations: mockValuations,
  convert: convertUSD,
  dates
});

console.log("Timeline points:");
history.forEach(pt => {
  console.log(`${pt.dateStr}: Net Worth = ${pt.netWorth}, Assets = ${pt.totalAssets}, Liabilities = ${pt.totalLiabilities}`);
});

console.log("All calculation tests pass!");
