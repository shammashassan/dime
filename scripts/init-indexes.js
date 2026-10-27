#!/usr/bin/env node
/**
 * Standalone MongoDB index initialization and database setup script for Dime.
 * Connects to MONGODB_URI and ensures all compound, unique, and TTL indexes exist.
 */

const { MongoClient } = require("mongodb")
const fs = require("fs")
const path = require("path")

// Attempt loading environment variables from .env if MONGODB_URI is not set
if (!process.env.MONGODB_URI) {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(path.resolve(process.cwd(), ".env"))
    }
  } catch {
    // If process.loadEnvFile fails or is unavailable, parse manually
  }

  if (!process.env.MONGODB_URI) {
    const envPath = path.resolve(process.cwd(), ".env")
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Error: "MONGODB_URI" environment variable is required.')
  process.exit(1)
}

async function run() {
  console.log("Connecting to MongoDB to configure database indexes...")
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db()
    console.log(`Connected to database: "${db.databaseName}"`)

    // 1. Transactions
    console.log("Creating indexes for transactions...")
    const transactions = db.collection("transactions")
    await transactions.createIndex({ userId: 1, date: -1 })
    await transactions.createIndex({ userId: 1, walletId: 1, date: -1 })
    await transactions.createIndex({ userId: 1, categoryId: 1, date: -1 })
    await transactions.createIndex({ userId: 1, type: 1, date: -1 })
    await transactions.createIndex({ tags: 1 })
    await transactions.createIndex({ organizationId: 1, date: -1 })

    // 2. Budgets & budget templates
    console.log("Creating indexes for budgets & templates...")
    const budgets = db.collection("budgets")
    await budgets.createIndex({ userId: 1, isActive: 1 })
    await budgets.createIndex({ userId: 1, categoryId: 1 })
    await budgets.createIndex({ organizationId: 1, isActive: 1 })

    const budgetTemplates = db.collection("budget_templates")
    await budgetTemplates.createIndex({ userId: 1, isSystem: 1 })
    await budgetTemplates.createIndex({ organizationId: 1 })

    // 3. Recurring rules
    console.log("Creating indexes for recurring rules...")
    const recurringRules = db.collection("recurring_rules")
    await recurringRules.createIndex({ userId: 1, nextDueDate: 1, isActive: 1 })
    await recurringRules.createIndex({ organizationId: 1, nextDueDate: 1, isActive: 1 })

    // 4. Wallets, goals, and categories
    console.log("Creating indexes for wallets, goals, categories, assets...")
    const wallets = db.collection("wallets")
    await wallets.createIndex({ userId: 1 })
    await wallets.createIndex({ organizationId: 1 })

    const goals = db.collection("goals")
    await goals.createIndex({ userId: 1 })
    await goals.createIndex({ organizationId: 1 })

    const categories = db.collection("categories")
    await categories.createIndex({ userId: 1 })
    await categories.createIndex({ organizationId: 1 })

    const assets = db.collection("assets")
    await assets.createIndex({ userId: 1, organizationId: 1, status: 1 })
    await assets.createIndex({ kind: 1, category: 1 })

    const assetValuations = db.collection("asset_valuations")
    await assetValuations.createIndex({ assetId: 1, date: -1 })
    await assetValuations.createIndex({ userId: 1, date: -1 })

    // 5. Automation rules & jobs
    console.log("Creating indexes for automation rules & jobs...")
    const automationRules = db.collection("automation_rules")
    await automationRules.createIndex({ userId: 1, priority: -1 })
    await automationRules.createIndex({ organizationId: 1, priority: -1 })

    const automationJobs = db.collection("automation_jobs")
    await automationJobs.createIndex({ userId: 1 })
    await automationJobs.createIndex({ organizationId: 1 })

    // 6. Contacts, loans, repayments
    console.log("Creating indexes for contacts & loans...")
    const contacts = db.collection("contacts")
    await contacts.createIndex({ userId: 1, name: 1 })
    await contacts.createIndex({ organizationId: 1, name: 1 })

    const loans = db.collection("loans")
    await loans.createIndex({ userId: 1, date: -1 })
    await loans.createIndex({ organizationId: 1, date: -1 })

    const loanRepayments = db.collection("loan_repayments")
    await loanRepayments.createIndex({ loanId: 1 })

    // 7. Investment holdings & transactions
    console.log("Creating indexes for investments...")
    const investmentHoldings = db.collection("investment_holdings")
    await investmentHoldings.createIndex({ walletId: 1, symbol: 1 }, { unique: true }).catch(() => {})
    await investmentHoldings.createIndex({ userId: 1, walletId: 1 })
    await investmentHoldings.createIndex({ organizationId: 1 })

    const investmentTransactions = db.collection("investment_transactions")
    await investmentTransactions.createIndex({ holdingId: 1, date: -1 })
    await investmentTransactions.createIndex({ userId: 1, walletId: 1, date: -1 })
    await investmentTransactions.createIndex({ organizationId: 1, date: -1 })

    const investmentPrices = db.collection("investment_prices")
    await investmentPrices.createIndex({ holdingId: 1, date: -1 })

    // 8. Watchlists & items
    console.log("Creating indexes for watchlists...")
    const watchlists = db.collection("watchlists")
    await watchlists.createIndex({ userId: 1, sortOrder: 1 })
    await watchlists.createIndex({ organizationId: 1, name: 1 })

    const watchlistItems = db.collection("watchlist_items")
    await watchlistItems.createIndex({ watchlistId: 1, symbol: 1 }, { unique: true }).catch(() => {})
    await watchlistItems.createIndex({ watchlistId: 1, sortOrder: 1 })
    await watchlistItems.createIndex({ symbol: 1 })
    await watchlistItems.createIndex({ assetType: 1 })

    // 9. Shared expenses & settlements
    console.log("Creating indexes for shared expenses & settlements...")
    const sharedExpenses = db.collection("shared_expenses")
    await sharedExpenses.createIndex({ userId: 1, date: -1 })
    await sharedExpenses.createIndex({ organizationId: 1, date: -1 })
    await sharedExpenses.createIndex({ "participants.participantId": 1 })
    await sharedExpenses.createIndex({ transactionId: 1 })
    await sharedExpenses.createIndex({ status: 1 })

    const sharedSettlements = db.collection("shared_settlements")
    await sharedSettlements.createIndex({ userId: 1, settledAt: -1 })
    await sharedSettlements.createIndex({ organizationId: 1, settledAt: -1 })
    await sharedSettlements.createIndex({ fromParticipantId: 1 })
    await sharedSettlements.createIndex({ toParticipantId: 1 })
    await sharedSettlements.createIndex({ expenseId: 1 })

    // 10. Users & insights
    console.log("Creating indexes for users & insights...")
    const users = db.collection("user")
    await users.createIndex({ role: 1, banned: 1 })

    const userInsightStates = db.collection("user_insight_states")
    await userInsightStates.createIndex({ userId: 1, insightKey: 1 }, { unique: true }).catch(() => {})
    await userInsightStates.createIndex({ userId: 1, status: 1 })

    // 11. Notifications (including TTL)
    console.log("Creating indexes for notifications...")
    const notifications = db.collection("notifications")
    await notifications.createIndex({ userId: 1, createdAt: -1 })
    await notifications.createIndex({ userId: 1, readAt: 1 })
    await notifications.createIndex(
      { readAt: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60 }
    ).catch(() => {})

    // 12. Coach messages (including TTL)
    console.log("Creating indexes for coach messages...")
    const coachMessages = db.collection("coach_messages")
    await coachMessages.createIndex({ userId: 1, createdAt: -1 })
    await coachMessages.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60 }
    ).catch(() => {})

    // 13. System default categories seeding
    const categoryCount = await categories.countDocuments({ userId: null })
    if (categoryCount === 0) {
      console.log("Seeding system default categories...")
      const defaultCategories = [
        { name: "Food & Dining", type: ["expense"], icon: "Utensils", color: "#EF4444" },
        { name: "Transport", type: ["expense"], icon: "Car", color: "#F59E0B" },
        { name: "Housing", type: ["expense"], icon: "Home", color: "#10B981" },
        { name: "Utilities", type: ["expense"], icon: "Zap", color: "#3B82F6" },
        { name: "Healthcare", type: ["expense"], icon: "HeartPulse", color: "#EC4899" },
        { name: "Entertainment", type: ["expense"], icon: "Film", color: "#8B5CF6" },
        { name: "Shopping", type: ["expense"], icon: "ShoppingBag", color: "#6366F1" },
        { name: "Education", type: ["expense"], icon: "GraduationCap", color: "#14B8A6" },
        { name: "Travel", type: ["expense"], icon: "Plane", color: "#06B6D4" },
        { name: "Personal Care", type: ["expense"], icon: "Sparkles", color: "#84CC16" },
        { name: "Subscriptions", type: ["expense"], icon: "CreditCard", color: "#F43F5E" },
        { name: "Salary", type: ["income"], icon: "Briefcase", color: "#10B981" },
        { name: "Freelance", type: ["income"], icon: "Laptop", color: "#3B82F6" },
        { name: "Business", type: ["income"], icon: "TrendingUp", color: "#8B5CF6" },
        { name: "Investment", type: ["income"], icon: "PieChart", color: "#F59E0B" },
        { name: "Gift", type: ["income"], icon: "Gift", color: "#EC4899" },
        { name: "Rental", type: ["income"], icon: "Key", color: "#6366F1" },
        { name: "Other", type: ["income", "expense"], icon: "HelpCircle", color: "#6B7280" },
        { name: "Loan / Lending", type: ["transfer"], icon: "HandCoins", color: "#6366F1" },
        { name: "Savings", type: ["expense"], icon: "PiggyBank", color: "#10B981" },
        { name: "Goals", type: ["expense"], icon: "Target", color: "#8B5CF6" }
      ]

      const docs = defaultCategories.map(cat => ({
        ...cat,
        userId: null,
        isDefault: true,
        createdAt: new Date()
      }))
      await categories.insertMany(docs)
      console.log("Seeded system default categories successfully.")
    }

    console.log("✅ All database indexes verified and successfully initialized!")
  } catch (error) {
    console.error("❌ Failed to initialize database indexes:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

run()
