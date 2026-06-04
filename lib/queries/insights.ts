import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { Transaction, Budget, Category } from "@/types"
import { subDays, startOfDay, endOfDay } from "date-fns"

export interface FinancialInsight {
  id: string
  type: "warning" | "success" | "info" | "tip"
  title: string
  description: string
  categoryName?: string
  amount?: number
}

export const getFinancialInsights = cache(async (userId: string): Promise<FinancialInsight[]> => {
  const transactionsColl = await getCollection<Transaction>("transactions")
  const categoriesColl = await getCollection<Category>("categories")
  
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)
  const fourteenDaysAgo = subDays(now, 14)
  const thirtyDaysAgo = subDays(now, 30)

  // Fetch categories to resolve names
  const categories = await categoriesColl.find({
    $or: [{ userId }, { userId: null }]
  }).toArray()
  const catMap = new Map(categories.map(c => [c._id.toString(), c.name]))

  // Fetch transactions for the last 30 days
  const txs = await transactionsColl.find({
    userId,
    date: { $gte: thirtyDaysAgo }
  }).toArray()

  const insights: FinancialInsight[] = []

  // 1. Deficit / Surplus check
  let incomeTotal = 0
  let expenseTotal = 0
  txs.forEach(t => {
    if (t.type === "income") incomeTotal += t.amount
    if (t.type === "expense") expenseTotal += t.amount
  })

  if (expenseTotal > incomeTotal && incomeTotal > 0) {
    insights.push({
      id: "deficit-alert",
      type: "warning",
      title: "Deficit Alert",
      description: `You spent ${((expenseTotal - incomeTotal) / 100).toFixed(2)} more than your income over the last 30 days. Consider dialing back discretionary categories.`,
      amount: expenseTotal - incomeTotal
    })
  } else if (incomeTotal > expenseTotal && expenseTotal > 0) {
    const savingsRatio = Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100)
    insights.push({
      id: "surplus-positive",
      type: "success",
      title: "Healthy Savings Rate",
      description: `Brilliant! You saved ${savingsRatio}% of your income (${((incomeTotal - expenseTotal) / 100).toFixed(2)}) this month.`,
      amount: incomeTotal - expenseTotal
    })
  }

  // 2. Week-over-Week spending change
  let thisWeekExpenses = 0
  let lastWeekExpenses = 0

  txs.forEach(t => {
    if (t.type === "expense") {
      if (t.date >= sevenDaysAgo) {
        thisWeekExpenses += t.amount
      } else if (t.date >= fourteenDaysAgo && t.date < sevenDaysAgo) {
        lastWeekExpenses += t.amount
      }
    }
  })

  if (lastWeekExpenses > 0) {
    const increasePercent = Math.round(((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100)
    if (increasePercent >= 15) {
      insights.push({
        id: "wow-surge",
        type: "warning",
        title: "Weekly Spending Surge",
        description: `Your spending increased by ${increasePercent}% this week compared to last week. Try auditing your recent transaction lists.`,
        amount: thisWeekExpenses - lastWeekExpenses
      })
    } else if (increasePercent <= -15) {
      insights.push({
        id: "wow-drop",
        type: "success",
        title: "Reduced Weekly Expenses",
        description: `Great job! You spent ${Math.abs(increasePercent)}% less this week compared to last week. Your wallet is thanking you!`,
        amount: lastWeekExpenses - thisWeekExpenses
      })
    }
  }

  // 3. Category concentration check
  const catExpenses: Record<string, number> = {}
  let totalExpenses30Days = 0

  txs.forEach(t => {
    if (t.type === "expense") {
      catExpenses[t.categoryId] = (catExpenses[t.categoryId] || 0) + t.amount
      totalExpenses30Days += t.amount
    }
  })

  if (totalExpenses30Days > 0) {
    Object.entries(catExpenses).forEach(([catId, amount]) => {
      const pct = Math.round((amount / totalExpenses30Days) * 100)
      if (pct >= 40) {
        const catName = catMap.get(catId) || "Other"
        insights.push({
          id: `cat-concentration-${catId}`,
          type: "tip",
          title: "High Category Concentration",
          description: `You allocated ${pct}% of your total 30-day budget (${(amount / 100).toFixed(2)}) towards "${catName}".`,
          categoryName: catName,
          amount
        })
      }
    })
  }

  // 4. Subscription detection (simple heuristic)
  // Group 30-day transactions by clean description + amount
  const subscriptionGroups: Record<string, { count: number; amount: number; tx: Transaction }> = {}
  txs.forEach(t => {
    if (t.type === "expense" && t.description) {
      const cleanDesc = t.description.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)
      const key = `${cleanDesc}-${t.amount}`
      if (!subscriptionGroups[key]) {
        subscriptionGroups[key] = { count: 1, amount: t.amount, tx: t }
      } else {
        subscriptionGroups[key].count++
      }
    }
  })

  Object.entries(subscriptionGroups).forEach(([key, group]) => {
    if (group.count >= 2) {
      // Potentially a recurring charge
      insights.push({
        id: `subscription-${key}`,
        type: "info",
        title: "Recurring Charge Detected",
        description: `We noticed recurring payments of ${(group.amount / 100).toFixed(2)} to "${group.tx.description}". Mark it as subscription in settings to monitor.`,
        amount: group.amount
      })
    }
  })

  // Ensure we always have at least a couple of nice helpful insights (fallback info)
  if (insights.length === 0) {
    insights.push({
      id: "info-start",
      type: "info",
      title: "Smart Insights Queueing",
      description: "Log a few more transactions across different wallets and categories to begin receiving AI-driven financial metrics."
    })
    insights.push({
      id: "tip-budget",
      type: "tip",
      title: "Pro Budgeting Tip",
      description: "Users who set strict monthly alert thresholds on food and shopping categories save up to 18% more on average."
    })
  }

  return insights
})
