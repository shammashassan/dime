import { db } from "./client"
import { categoriesCollection } from "./collections"

let isInitialized = false

export async function initDatabase() {
  if (isInitialized) return
  isInitialized = true

  try {
    console.log("Initializing database indexes...")

    // 1. Create indexes for transactions
    const transactions = db.collection("transactions")
    await transactions.createIndex({ userId: 1, date: -1 })
    await transactions.createIndex({ userId: 1, walletId: 1, date: -1 })
    await transactions.createIndex({ userId: 1, categoryId: 1, date: -1 })
    await transactions.createIndex({ userId: 1, type: 1, date: -1 })
    await transactions.createIndex({ tags: 1 })

    // 2. Create indexes for budgets
    const budgets = db.collection("budgets")
    await budgets.createIndex({ userId: 1, isActive: 1 })
    await budgets.createIndex({ userId: 1, categoryId: 1 })

    // 3. Create indexes for recurring rules
    const recurringRules = db.collection("recurring_rules")
    await recurringRules.createIndex({ userId: 1, nextDueDate: 1, isActive: 1 })

    // 4. Create indexes for user lookup
    const users = db.collection("user")
    await users.createIndex({ approved: 1, role: 1 })

    console.log("Database indexes verified/created.")

    // 5. Seed default categories if none exist
    const categoryCount = await categoriesCollection.countDocuments({ userId: null })
    if (categoryCount === 0) {
      console.log("Seeding system default categories...")
      const defaultCategories = [
        // Expenses
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
        // Income
        { name: "Salary", type: ["income"], icon: "Briefcase", color: "#10B981" },
        { name: "Freelance", type: ["income"], icon: "Laptop", color: "#3B82F6" },
        { name: "Business", type: ["income"], icon: "TrendingUp", color: "#8B5CF6" },
        { name: "Investment", type: ["income"], icon: "PieChart", color: "#F59E0B" },
        { name: "Gift", type: ["income"], icon: "Gift", color: "#EC4899" },
        { name: "Rental", type: ["income"], icon: "Key", color: "#6366F1" },
        // Unified Other
        { name: "Other", type: ["income", "expense"], icon: "HelpCircle", color: "#6B7280" },
        // Transfers
        { name: "Loan / Lending", type: ["transfer"], icon: "HandCoins", color: "#6366F1" },
        // Savings & Goals
        { name: "Savings", type: ["expense"], icon: "PiggyBank", color: "#10B981" },
        { name: "Goals", type: ["expense"], icon: "Target", color: "#8B5CF6" }
      ]

      const docs = defaultCategories.map(cat => ({
        ...cat,
        userId: null,
        isDefault: true,
        createdAt: new Date()
      }))

      await categoriesCollection.insertMany(docs as any)
      console.log("Seeded system default categories successfully.")
    } else {
      // Ensure "Loan / Lending" category exists even if database was already initialized
      const loanCat = await categoriesCollection.findOne({ userId: null, name: "Loan / Lending" })
      if (!loanCat) {
        await categoriesCollection.insertOne({
          name: "Loan / Lending",
          type: ["transfer"],
          icon: "HandCoins",
          color: "#6366F1",
          userId: null,
          isDefault: true,
          createdAt: new Date()
        } as any)
        console.log("Ensured default 'Loan / Lending' category exists.")
      }

      // Ensure "Savings" category exists even if database was already initialized
      const savingsCat = await categoriesCollection.findOne({ userId: null, name: "Savings" })
      if (!savingsCat) {
        await categoriesCollection.insertOne({
          name: "Savings",
          type: ["expense"],
          icon: "PiggyBank",
          color: "#10B981",
          userId: null,
          isDefault: true,
          createdAt: new Date()
        } as any)
        console.log("Ensured default 'Savings' category exists.")
      }

      // Ensure "Goals" category exists even if database was already initialized
      const goalsCat = await categoriesCollection.findOne({ userId: null, name: "Goals" })
      if (!goalsCat) {
        await categoriesCollection.insertOne({
          name: "Goals",
          type: ["expense"],
          icon: "Target",
          color: "#8B5CF6",
          userId: null,
          isDefault: true,
          createdAt: new Date()
        } as any)
        console.log("Ensured default 'Goals' category exists.")
      }
    }

    // Call migration to migrate any legacy category schema to array types
    await migrateCategoryTypes()
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

async function migrateCategoryTypes() {
  try {
    const categoriesColl = db.collection("categories")
    
    // 1. Merge duplicate default "Other" categories
    const defaultOthers = await categoriesColl.find({ userId: null, name: "Other" }).toArray()
    if (defaultOthers.length > 1) {
      console.log(`Found ${defaultOthers.length} default 'Other' categories. Merging...`)
      
      const primaryOther = defaultOthers[0]
      const duplicates = defaultOthers.slice(1)
      const primaryId = primaryOther._id
      
      // Update primary other to support both income and expense
      await categoriesColl.updateOne(
        { _id: primaryId },
        { $set: { type: ["income", "expense"], isDefault: true } }
      )
      
      const transactions = db.collection("transactions")
      const budgets = db.collection("budgets")
      const recurringRules = db.collection("recurring_rules")
      
      for (const dup of duplicates) {
        const dupIdStr = dup._id.toString()
        const primaryIdStr = primaryId.toString()
        
        // Update transactions referencing duplicate ID
        const txResult = await transactions.updateMany(
          { categoryId: dupIdStr },
          { $set: { categoryId: primaryIdStr, updatedAt: new Date() } }
        )
        console.log(`Moved ${txResult.modifiedCount} transactions from duplicate category ${dupIdStr} to primary ${primaryIdStr}`)
        
        // Update budgets referencing duplicate ID
        const budgetResult = await budgets.updateMany(
          { categoryId: dupIdStr },
          { $set: { categoryId: primaryIdStr, updatedAt: new Date() } }
        )
        console.log(`Moved ${budgetResult.modifiedCount} budgets`)
        
        // Update recurring rules referencing duplicate ID
        const ruleResult = await recurringRules.updateMany(
          { categoryId: dupIdStr },
          { $set: { categoryId: primaryIdStr, updatedAt: new Date() } }
        )
        console.log(`Moved ${ruleResult.modifiedCount} recurring rules`)
        
        // Delete duplicate category
        await categoriesColl.deleteOne({ _id: dup._id })
        console.log(`Deleted duplicate 'Other' category: ${dup._id}`)
      }
    }

    // 2. Migrate string type categories to arrays
    const allCategories = await categoriesColl.find({}).toArray()
    let migrateCount = 0
    for (const cat of allCategories) {
      if (typeof cat.type === "string") {
        let newType: string[] = []
        if (cat.type === "both") {
          newType = ["income", "expense"]
        } else if (cat.type === "income" || cat.type === "expense" || cat.type === "transfer") {
          newType = [cat.type]
        } else {
          newType = ["expense"]
        }
        
        // Ensure unified default Other has both
        if (cat.name === "Other" && cat.userId === null) {
          newType = ["income", "expense"]
        }
        
        await categoriesColl.updateOne(
          { _id: cat._id },
          { $set: { type: newType } }
        )
        migrateCount++
      }
    }
    if (migrateCount > 0) {
      console.log(`Migrated ${migrateCount} categories from string to array types.`)
    }
  } catch (err) {
    console.error("Failed to run category type migration:", err)
  }
}
