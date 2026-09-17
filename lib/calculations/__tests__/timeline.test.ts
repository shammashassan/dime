import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  synthesizeTimelineEvents,
  groupEventsByDateBracket,
  calculateTimelineStats,
  filterTimelineEvents,
  toSafeISOString,
} from "../timeline"

describe("Financial Timeline Calculation Engine", () => {
  const referenceDate = new Date("2026-09-17T12:00:00Z")

  it("1. toSafeISOString handles dates, valid strings, and invalid fallbacks", () => {
    const d = new Date("2026-05-10T10:00:00Z")
    assert.strictEqual(toSafeISOString(d), d.toISOString())
    assert.strictEqual(toSafeISOString("2026-05-10T10:00:00Z"), "2026-05-10T10:00:00.000Z")

    const fallback = new Date("2026-01-01T00:00:00Z")
    assert.strictEqual(toSafeISOString("invalid-date", fallback), fallback.toISOString())
    assert.strictEqual(toSafeISOString(undefined, fallback), fallback.toISOString())
  })

  it("2. synthesizeTimelineEvents transforms transactions and tags high-income & large purchases as milestones", () => {
    const rawBundle = {
      transactions: [
        {
          _id: "tx-1",
          date: "2026-09-17T09:00:00Z",
          amount: 250000, // $2500 -> Salary / High Income
          currency: "USD",
          type: "income" as const,
          description: "Monthly Salary Tech Corp",
          walletId: "w-1",
          categoryId: "c-1",
        },
        {
          _id: "tx-2",
          date: "2026-09-16T14:00:00Z",
          amount: 60000, // $600 -> Major purchase (>= $500)
          currency: "USD",
          type: "expense" as const,
          description: "New Laptop Monitor",
          walletId: "w-1",
        },
        {
          _id: "tx-3",
          date: "2026-09-15T18:00:00Z",
          amount: 1500, // $15 -> Standard expense
          currency: "USD",
          type: "expense" as const,
          description: "Coffee Shop",
        },
      ],
      walletMap: new Map([["w-1", { name: "Main Checking", currency: "USD" }]]),
      categoryMap: new Map([["c-1", { name: "Salary", color: "#10b981", icon: "Briefcase" }]]),
    }

    const events = synthesizeTimelineEvents(rawBundle, "USD")
    assert.strictEqual(events.length, 3)

    // Salary: Inflow + Milestone
    const salaryEvent = events.find((e) => e.id === "tx-tx-1")!
    assert.strictEqual(salaryEvent.impact, "inflow")
    assert.strictEqual(salaryEvent.isMilestone, true)
    assert.strictEqual(salaryEvent.amount, 250000)

    // Major Purchase: Outflow + Milestone
    const monitorEvent = events.find((e) => e.id === "tx-tx-2")!
    assert.strictEqual(monitorEvent.impact, "outflow")
    assert.strictEqual(monitorEvent.isMilestone, true)
    assert.strictEqual(monitorEvent.amount, 60000)

    // Normal expense: Not a milestone
    const coffeeEvent = events.find((e) => e.id === "tx-tx-3")!
    assert.strictEqual(coffeeEvent.isMilestone, false)
    assert.strictEqual(coffeeEvent.impact, "outflow")
  })

  it("3. synthesizeTimelineEvents flags completed goals and loan payoffs as celebratory milestones", () => {
    const rawBundle = {
      goals: [
        {
          _id: "g-1",
          name: "Emergency Reserve",
          targetAmount: 1000000,
          currentAmount: 1000000, // 100% achieved!
          currency: "USD",
          createdAt: "2026-09-10T00:00:00Z",
        },
        {
          _id: "g-2",
          name: "Tokyo Vacation",
          targetAmount: 500000,
          currentAmount: 300000, // 60% reached!
          currency: "USD",
          createdAt: "2026-09-12T00:00:00Z",
        },
      ],
      loans: [
        {
          _id: "l-1",
          personName: "Bob",
          type: "borrowed" as const,
          amount: 50000,
          currency: "USD",
          date: "2026-08-01T00:00:00Z",
          status: "fully_repaid",
          remainingAmount: 0,
        },
      ],
    }

    const events = synthesizeTimelineEvents(rawBundle, "USD")
    assert.strictEqual(events.length, 3)

    const goalCompleted = events.find((e) => e.id === "goal-achieved-g-1")!
    assert.strictEqual(goalCompleted.isMilestone, true)
    assert.strictEqual(goalCompleted.type, "goal_completed")
    assert.strictEqual(goalCompleted.category, "milestones")

    const goalProgress = events.find((e) => e.id === "goal-milestone-g-2")!
    assert.strictEqual(goalProgress.isMilestone, true)
    assert.strictEqual(goalProgress.type, "goal_milestone")

    const loanSettled = events.find((e) => e.id === "loan-settled-l-1")!
    assert.strictEqual(loanSettled.isMilestone, true)
    assert.strictEqual(loanSettled.type, "loan_settled")
  })

  it("4. groupEventsByDateBracket accurately organizes events and calculates net flow", () => {
    const events = [
      {
        id: "ev-today",
        type: "transaction" as const,
        category: "transactions" as const,
        title: "Today Inflow",
        description: "Checking",
        date: "2026-09-17T08:00:00Z",
        amount: 10000, // +$100
        impact: "inflow" as const,
        iconName: "ArrowDownLeft",
        isMilestone: false,
      },
      {
        id: "ev-today-2",
        type: "transaction" as const,
        category: "transactions" as const,
        title: "Today Outflow",
        description: "Lunch",
        date: "2026-09-17T12:00:00Z",
        amount: 2000, // -$20
        impact: "outflow" as const,
        iconName: "ArrowUpRight",
        isMilestone: false,
      },
      {
        id: "ev-yesterday",
        type: "transaction" as const,
        category: "transactions" as const,
        title: "Yesterday Grocery",
        description: "Store",
        date: "2026-09-16T15:00:00Z",
        amount: 5000, // -$50
        impact: "outflow" as const,
        iconName: "ArrowUpRight",
        isMilestone: false,
      },
    ]

    const groups = groupEventsByDateBracket(events, referenceDate)
    assert.strictEqual(groups.length, 2)

    const todayGroup = groups.find((g) => g.dateKey === "today")!
    assert.strictEqual(todayGroup.label, "Today")
    assert.strictEqual(todayGroup.events.length, 2)
    assert.strictEqual(todayGroup.netAmount, 8000) // 10000 - 2000

    const yesterdayGroup = groups.find((g) => g.dateKey === "yesterday")!
    assert.strictEqual(yesterdayGroup.label, "Yesterday")
    assert.strictEqual(yesterdayGroup.events.length, 1)
    assert.strictEqual(yesterdayGroup.netAmount, -5000)
  })

  it("5. calculateTimelineStats computes accurate aggregates", () => {
    const events = [
      {
        id: "e-1",
        type: "transaction" as const,
        category: "transactions" as const,
        title: "Income",
        description: "",
        date: "2026-09-17T00:00:00Z",
        amount: 50000,
        impact: "inflow" as const,
        iconName: "ArrowDownLeft",
        isMilestone: true,
      },
      {
        id: "e-2",
        type: "transaction" as const,
        category: "transactions" as const,
        title: "Expense",
        description: "",
        date: "2026-09-16T00:00:00Z",
        amount: 20000,
        impact: "outflow" as const,
        iconName: "ArrowUpRight",
        isMilestone: false,
      },
    ]

    const stats = calculateTimelineStats(events, "USD")
    assert.strictEqual(stats.totalEvents, 2)
    assert.strictEqual(stats.milestonesCount, 1)
    assert.strictEqual(stats.totalInflow, 50000)
    assert.strictEqual(stats.totalOutflow, 20000)
    assert.strictEqual(stats.netFlow, 30000)
    assert.strictEqual(stats.currency, "USD")
  })

  it("6. filterTimelineEvents filters by category, search text, and date bounds", () => {
    const events = [
      {
        id: "e-1",
        type: "transaction" as const,
        category: "milestones" as const,
        title: "Promotion Bonus",
        description: "Tech Corp Annual",
        date: "2026-09-17T00:00:00Z",
        amount: 50000,
        impact: "inflow" as const,
        iconName: "Sparkles",
        isMilestone: true,
      },
      {
        id: "e-2",
        type: "loan_originated" as const,
        category: "loans" as const,
        title: "Lent to Alice",
        description: "Emergency support",
        date: "2026-09-10T00:00:00Z",
        amount: 15000,
        impact: "outflow" as const,
        iconName: "HandCoins",
        isMilestone: false,
      },
    ]

    // Category filter: milestones
    const milestonesOnly = filterTimelineEvents(events, { category: "milestones" })
    assert.strictEqual(milestonesOnly.length, 1)
    assert.strictEqual(milestonesOnly[0].id, "e-1")

    // Category filter: loans
    const loansOnly = filterTimelineEvents(events, { category: "loans" })
    assert.strictEqual(loansOnly.length, 1)
    assert.strictEqual(loansOnly[0].id, "e-2")

    // Search query: "Alice"
    const aliceSearch = filterTimelineEvents(events, { search: "alice" })
    assert.strictEqual(aliceSearch.length, 1)
    assert.strictEqual(aliceSearch[0].id, "e-2")

    // Date range filter
    const dateFiltered = filterTimelineEvents(events, { from: "2026-09-15" })
    assert.strictEqual(dateFiltered.length, 1)
    assert.strictEqual(dateFiltered[0].id, "e-1")
  })
})
