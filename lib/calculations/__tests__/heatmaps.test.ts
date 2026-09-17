import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  calculateQuantileLevels,
  assignQuantileLevelsToDays,
  calculateHeatmapHabits,
  groupDaysIntoWeeks,
  getHeatmapMonthLabels,
  type HeatmapDaySummary,
} from "../heatmaps"

describe("Spending Heatmap Calculation Engine", () => {
  it("1. calculateQuantileLevels handles empty and zero arrays", () => {
    const emptyMap = calculateQuantileLevels([])
    assert.strictEqual(emptyMap.get(0), 0)

    const zeroMap = calculateQuantileLevels([0, 0, 0])
    assert.strictEqual(zeroMap.get(0), 0)
  })

  it("2. calculateQuantileLevels correctly assigns levels 1 to 4 across quartiles", () => {
    // 8 values: 10, 20, 30, 40, 50, 60, 70, 80
    // Q1 = 20, Q2 = 40, Q3 = 60
    const values = [0, 10, 20, 30, 40, 50, 60, 70, 80]
    const levelMap = calculateQuantileLevels(values, "expense")

    assert.strictEqual(levelMap.get(0), 0)
    assert.strictEqual(levelMap.get(10), 1)
    assert.strictEqual(levelMap.get(20), 1)
    assert.strictEqual(levelMap.get(30), 2)
    assert.strictEqual(levelMap.get(40), 2)
    assert.strictEqual(levelMap.get(50), 3)
    assert.strictEqual(levelMap.get(60), 3)
    assert.strictEqual(levelMap.get(70), 4)
    assert.strictEqual(levelMap.get(80), 4)
  })

  it("3. assignQuantileLevelsToDays sets level property on each day", () => {
    const days: HeatmapDaySummary[] = [
      { date: "2026-01-01", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-02", expense: 1500, income: 0, net: -1500, count: 1, level: 0, transactions: [] },
      { date: "2026-01-03", expense: 5000, income: 0, net: -5000, count: 2, level: 0, transactions: [] },
      { date: "2026-01-04", expense: 12000, income: 0, net: -12000, count: 3, level: 0, transactions: [] },
    ]

    const result = assignQuantileLevelsToDays(days, "expense")
    assert.strictEqual(result[0].level, 0)
    assert.strictEqual(result[1].level > 0, true)
    assert.strictEqual(result[3].level, 4)
  })

  it("4. calculateHeatmapHabits computes current and longest zero-spend streaks accurately", () => {
    // 7 days: day 1 (spend), day 2 (0), day 3 (0), day 4 (0), day 5 (spend), day 6 (0), day 7 (0)
    const days: HeatmapDaySummary[] = [
      { date: "2026-01-01", expense: 2000, income: 0, net: -2000, count: 1, level: 1, transactions: [] },
      { date: "2026-01-02", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-03", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-04", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-05", expense: 5000, income: 0, net: -5000, count: 2, level: 2, transactions: [] },
      { date: "2026-01-06", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-07", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
    ]

    const habits = calculateHeatmapHabits(days, "2026-01-07")
    assert.strictEqual(habits.currentNoSpendStreak, 2)
    assert.strictEqual(habits.longestNoSpendStreak, 3)
    assert.strictEqual(habits.noSpendDaysCount, 5)
    assert.strictEqual(habits.activeDaysCount, 2)
    assert.strictEqual(habits.totalExpense, 7000)
    assert.strictEqual(habits.dailyAverageSpend, Math.round(7000 / 7))
    assert.deepStrictEqual(habits.peakSpendDay, {
      date: "2026-01-05",
      amount: 5000,
      count: 2,
    })
  })

  it("5. groupDaysIntoWeeks creates 7-day week chunks with correct calendar offset", () => {
    // Jan 1, 2026 is a Thursday (day 4).
    // With weekStart = 0 (Sunday), offset = 4 (Sun, Mon, Tue, Wed are undefined).
    const days: HeatmapDaySummary[] = [
      { date: "2026-01-01", expense: 1000, income: 0, net: -1000, count: 1, level: 1, transactions: [] },
      { date: "2026-01-02", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-03", expense: 0, income: 0, net: 0, count: 0, level: 0, transactions: [] },
      { date: "2026-01-04", expense: 500, income: 0, net: -500, count: 1, level: 1, transactions: [] },
    ]

    const weeks = groupDaysIntoWeeks(days, 0)
    assert.strictEqual(weeks.length, 2)
    assert.strictEqual(weeks[0].days.length, 7)
    // First 4 slots in week 0 should be undefined
    assert.strictEqual(weeks[0].days[0], undefined)
    assert.strictEqual(weeks[0].days[1], undefined)
    assert.strictEqual(weeks[0].days[2], undefined)
    assert.strictEqual(weeks[0].days[3], undefined)
    // 5th slot (index 4) should be Jan 1
    assert.strictEqual(weeks[0].days[4]?.date, "2026-01-01")
    assert.strictEqual(weeks[0].days[5]?.date, "2026-01-02")
    assert.strictEqual(weeks[0].days[6]?.date, "2026-01-03")
    // Second week starts with Sunday Jan 4
    assert.strictEqual(weeks[1].days[0]?.date, "2026-01-04")
  })

  it("6. getHeatmapMonthLabels filters out overlapping month labels", () => {
    const mockDays: HeatmapDaySummary[] = []
    // Create 60 days starting Jan 1, 2026
    for (let i = 1; i <= 60; i++) {
      const d = new Date(Date.UTC(2026, 0, i))
      const dateStr = d.toISOString().slice(0, 10)
      mockDays.push({
        date: dateStr,
        expense: 100,
        income: 0,
        net: -100,
        count: 1,
        level: 1,
        transactions: [],
      })
    }

    const weeks = groupDaysIntoWeeks(mockDays, 0)
    const labels = getHeatmapMonthLabels(weeks)

    assert.strictEqual(labels.length >= 2, true)
    assert.strictEqual(labels[0].label, "Jan")
    // Verify spacing between labels is >= 3 weeks
    for (let i = 0; i < labels.length - 1; i++) {
      assert.strictEqual(labels[i + 1].weekIndex - labels[i].weekIndex >= 3, true)
    }
  })
})
