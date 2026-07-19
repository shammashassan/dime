import { ObjectId } from "mongodb"
import { generateNetWorthOverviewViewModel } from "../lib/calculations/net-worth-viewmodel"
import { Wallet, Loan, Asset, AssetValuation, LoanRepayment, Transaction, HistoricalNetWorthPoint } from "../types"

// Helper function to assert values
function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Actual:   `, actual);
    console.error(`   Expected: `, expected);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("Starting unit test for generateNetWorthOverviewViewModel...");

// Create ObjectIds
const wallet1Id = new ObjectId("60d5ec49867c2937a01d6700")
const wallet2Id = new ObjectId("60d5ec49867c2937a01d6701")
const wallet3Id = new ObjectId("60d5ec49867c2937a01d6702")

const loan1Id = new ObjectId("60d5ec49867c2937a01d6703")
const loan2Id = new ObjectId("60d5ec49867c2937a01d6704")
const loan3Id = new ObjectId("60d5ec49867c2937a01d6705")

const asset1Id = new ObjectId("60d5ec49867c2937a01d6706")
const asset2Id = new ObjectId("60d5ec49867c2937a01d6707")
const asset3Id = new ObjectId("60d5ec49867c2937a01d6708")

const val1Id = new ObjectId("60d5ec49867c2937a01d6709")
const repay1Id = new ObjectId("60d5ec49867c2937a01d670a")

const tx1Id = new ObjectId("60d5ec49867c2937a01d670b")
const tx2Id = new ObjectId("60d5ec49867c2937a01d670c")

// 1. Wallets
const wallets: Wallet[] = [
  {
    _id: wallet1Id,
    userId: "user-1",
    name: "Checking",
    type: "bank",
    currency: "USD",
    balance: 500000, // $5000.00
    color: "#ffffff",
    icon: "Wallet",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: wallet2Id,
    userId: "user-1",
    name: "Credit Card",
    type: "credit_card",
    currency: "USD",
    balance: -100000, // -$1000.00
    color: "#000000",
    icon: "CreditCard",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: wallet3Id,
    userId: "user-1",
    name: "Archived Wallet",
    type: "cash",
    currency: "USD",
    balance: 30000,
    color: "#cccccc",
    icon: "Wallet",
    isArchived: true, // Should be ignored
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

// 2. Loans
const loans: Loan[] = [
  {
    _id: loan1Id,
    userId: "user-1",
    organizationId: null,
    type: "lent", // Asset
    contactId: "contact-1",
    personName: "Alice",
    amount: 150000,
    remainingAmount: 120000, // $1200.00
    currency: "USD",
    walletId: wallet1Id.toString(),
    transactionId: "tx-loan-1",
    date: new Date("2026-06-01"),
    status: "active",
    reminderSchedule: [],
    sentReminders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    _id: loan2Id,
    userId: "user-1",
    organizationId: null,
    type: "borrowed", // Liability
    contactId: "contact-2",
    personName: "Bob",
    amount: 200000,
    remainingAmount: 80000, // $800.00
    currency: "USD",
    walletId: wallet1Id.toString(),
    transactionId: "tx-loan-2",
    date: new Date("2026-06-10"),
    status: "active",
    reminderSchedule: [],
    sentReminders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    _id: loan3Id,
    userId: "user-1",
    organizationId: null,
    type: "lent",
    contactId: "contact-3",
    personName: "Charlie",
    amount: 50000,
    remainingAmount: 50000,
    currency: "USD",
    walletId: wallet1Id.toString(),
    transactionId: "tx-loan-3",
    date: new Date("2026-06-15"),
    status: "cancelled", // Should be ignored
    reminderSchedule: [],
    sentReminders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }
]

// 3. Manual Assets
const assets: Asset[] = [
  {
    _id: asset1Id,
    userId: "user-1",
    organizationId: null,
    name: "Real Estate",
    kind: "asset",
    category: "real_estate",
    currency: "USD",
    currentValue: 10000000, // $100,000.00
    valuationMethod: "manual",
    ownershipPercentage: 100,
    status: "active",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    _id: asset2Id,
    userId: "user-1",
    organizationId: null,
    name: "Joint Venture",
    kind: "asset",
    category: "investment",
    currency: "USD",
    currentValue: 4000000, // $40,000.00 original, owned = 50% => $20,000.00
    valuationMethod: "manual",
    ownershipPercentage: 50,
    status: "active",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    _id: asset3Id,
    userId: "user-1",
    organizationId: null,
    name: "Old Car",
    kind: "asset",
    category: "vehicle",
    currency: "USD",
    currentValue: 500000,
    valuationMethod: "manual",
    ownershipPercentage: 100,
    status: "archived", // Should be ignored
    isArchived: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }
]

// 4. Valuations
const valuations: AssetValuation[] = [
  {
    _id: val1Id,
    assetId: asset1Id.toString(),
    userId: "user-1",
    organizationId: null,
    date: new Date("2026-07-15"),
    value: 10000000,
    source: "manual",
    createdAt: new Date(),
  }
]

// 5. Repayments
const repayments: LoanRepayment[] = [
  {
    _id: repay1Id,
    loanId: loan1Id.toString(),
    transactionId: "tx-repay-1",
    amount: 30000,
    date: new Date("2026-07-16"),
    createdAt: new Date(),
  }
]

// 6. Transactions
const transactions: Transaction[] = [
  {
    _id: tx1Id,
    userId: "user-1",
    walletId: wallet1Id.toString(),
    type: "income",
    amount: 2000000, // $20,000.00 (>= 10000 cents, so it should be shown)
    currency: "USD",
    description: "Bonus pay",
    date: new Date("2026-07-17"),
    tags: [],
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: tx2Id,
    userId: "user-1",
    walletId: wallet1Id.toString(),
    type: "expense",
    amount: 500, // $5.00 (< 10000 cents, so it should be ignored)
    currency: "USD",
    description: "Coffee",
    date: new Date("2026-07-18"),
    tags: [],
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

// 7. History
const history: HistoricalNetWorthPoint[] = [
  {
    date: "2026-06-01",
    netWorth: 10000000, // $100,000.00
    assets: 10500000,
    liabilities: 500000,
  },
  {
    date: "2026-07-01",
    netWorth: 11000000, // $110,000.00
    assets: 11600000,
    liabilities: 600000,
  }
]

// 8. Conversion helper
const convert = (amount: number, from: string) => {
  return amount // Mock converter where all currencies are USD
}

// Run calculation
const result = generateNetWorthOverviewViewModel({
  wallets,
  loans,
  assets,
  valuations,
  repayments,
  transactions,
  convert,
  baseCurrency: "USD",
  history
})

// Assertions on result breakdown
assertEqual(result.currency, "USD", "Base currency matches USD")
assertEqual(result.totalAssets, 12620000, "Total assets matches 12,620,000 cents")
assertEqual(result.totalLiabilities, 180000, "Total liabilities matches 180,000 cents")
assertEqual(result.netWorth, 12440000, "Net worth matches 12,440,000 cents")

// Assertions on ratios
assertEqual(result.liquidityRatio, 4, "Liquidity ratio is 4%")
assertEqual(result.debtRatio, 1, "Debt ratio is 1%")

// Assertions on history / trends
assertEqual(result.netWorthTrend, "up", "Net worth trend is up")
assertEqual(parseFloat(result.moMChangePct.toFixed(1)), 24.4, "MoM change percentage is +24.4%")

// Assertions on top assets & liabilities sorting
assertEqual(result.topAssets.length, 4, "topAssets contains exactly 4 assets")
assertEqual(result.topAssets[0].name, "Real Estate", "Real Estate is the largest asset")
assertEqual(result.topAssets[0].currentValue, 10000000, "Real Estate current value is correct")
assertEqual(result.topAssets[0].percentage, 79, "Real Estate percentage is 79%")

assertEqual(result.topAssets[1].name, "Joint Venture", "Joint Venture is the second largest asset")
assertEqual(result.topAssets[1].currentValue, 2000000, "Joint Venture current value is correct")
assertEqual(result.topAssets[1].percentage, 16, "Joint Venture percentage is 16%")

assertEqual(result.topAssets[2].name, "Checking", "Checking is the third asset")
assertEqual(result.topAssets[2].currentValue, 500000, "Checking current value is correct")
assertEqual(result.topAssets[2].percentage, 4, "Checking percentage is 4%")

assertEqual(result.topAssets[3].name, "Loan to Alice", "Loan to Alice is the fourth asset")
assertEqual(result.topAssets[3].currentValue, 120000, "Loan to Alice current value is correct")
assertEqual(result.topAssets[3].percentage, 1, "Loan to Alice percentage is 1%")

assertEqual(result.topLiabilities.length, 2, "topLiabilities contains exactly 2 liabilities")
assertEqual(result.topLiabilities[0].name, "Credit Card", "Credit Card is the largest liability")
assertEqual(result.topLiabilities[0].currentValue, 100000, "Credit Card current value is correct")
assertEqual(result.topLiabilities[0].percentage, 56, "Credit Card percentage is 56%")

assertEqual(result.topLiabilities[1].name, "Loan to Bob", "Loan to Bob is the second liability")
assertEqual(result.topLiabilities[1].currentValue, 80000, "Loan to Bob current value is correct")
assertEqual(result.topLiabilities[1].percentage, 44, "Loan to Bob percentage is 44%")

// Assertions on recent activity
assertEqual(result.recentActivity.length, 3, "recentActivity contains exactly 3 events")

// Activity event 1: high income transaction
const act1 = result.recentActivity[0]
assertEqual(act1.type, "transaction", "Activity 1 type is transaction")
assertEqual(act1.title, "High Income", "Activity 1 title is High Income")
assertEqual(act1.amount, 2000000, "Activity 1 amount is correct")
assertEqual(act1.description, "Bonus pay", "Activity 1 description is correct")

// Activity event 2: loan repayment
const act2 = result.recentActivity[1]
assertEqual(act2.type, "repayment", "Activity 2 type is repayment")
assertEqual(act2.title, "Loan Repayment", "Activity 2 title is Loan Repayment")
assertEqual(act2.amount, 30000, "Activity 2 amount is correct")
assertEqual(act2.description, "Repayment received on loan to Alice", "Activity 2 description is correct")

// Activity event 3: valuation update
const act3 = result.recentActivity[2]
assertEqual(act3.type, "valuation", "Activity 3 type is valuation")
assertEqual(act3.title, "Valuation Updated", "Activity 3 title is Valuation Updated")
assertEqual(act3.amount, 10000000, "Activity 3 amount is correct")
assertEqual(act3.description, "Real Estate updated to USD 100000.00", "Activity 3 description is correct")

// Assertions on insights
assertEqual(result.insights.length, 4, "insights contains exactly 4 insights")

const insightMoM = result.insights.find(i => i.id === "mom")!
assertEqual(insightMoM.type, "success", "MoM insight type is success")
assertEqual(insightMoM.metric, "+24.4%", "MoM insight metric is correct")

const insightLargest = result.insights.find(i => i.id === "largest-asset")!
assertEqual(insightLargest.type, "info", "Largest asset insight type is info")
assertEqual(insightLargest.metric, "79%", "Largest asset insight metric is correct")

const insightLiquidity = result.insights.find(i => i.id === "liquidity")!
assertEqual(insightLiquidity.type, "info", "Liquidity insight type is info")
assertEqual(insightLiquidity.metric, "4%", "Liquidity insight metric is correct")

const insightDebt = result.insights.find(i => i.id === "debt")!
assertEqual(insightDebt.type, "success", "Debt insight type is success")
assertEqual(insightDebt.metric, "1%", "Debt insight metric is correct")

console.log("\nALL TESTS PASSED SUCCESSFULLY! 🎉");
