import test from "node:test"
import assert from "node:assert/strict"
import { calculateFocusCounts } from "../dashboard"

test("calculateFocusCounts aggregates overdue bills, 7-day renewals, loan dues, and unread alerts", () => {
  const now = new Date("2026-09-14T12:00:00Z")
  
  const bills = [
    { dueDate: new Date("2026-09-10"), status: "unpaid", amount: 5000 }, // overdue
    { dueDate: new Date("2026-09-16"), status: "unpaid", amount: 3000 }, // upcoming in 2d
    { dueDate: new Date("2026-09-25"), status: "unpaid", amount: 4000 }, // later
    { dueDate: new Date("2026-09-05"), status: "paid", amount: 2000 },   // paid
  ]

  const recurring = [
    { nextRun: new Date("2026-09-18"), status: "active" }, // in 4d
    { nextRun: new Date("2026-09-30"), status: "active" }, // later
    { nextRun: new Date("2026-09-17"), status: "paused" }, // paused (should be skipped)
  ]

  const loans = [
    { dueDate: new Date("2026-09-12"), status: "active", remainingAmount: 10000 }, // overdue
    { dueDate: new Date("2026-09-20"), status: "active", remainingAmount: 5000 },  // in 6d
    { dueDate: new Date("2026-10-01"), status: "active", remainingAmount: 2000 },  // later
    { dueDate: new Date("2026-09-15"), status: "fully_repaid", remainingAmount: 0 }, // repaid (should be skipped)
  ]

  const unreadNotifications = 4

  const result = calculateFocusCounts({
    now,
    bills,
    recurring,
    loans,
    unreadNotifications,
    baseCurrency: "USD",
  })

  assert.equal(result.overdueBillsCount, 1)
  assert.equal(result.overdueBillsAmount, 5000)
  assert.equal(result.upcomingRenewalsCount, 2) // 1 bill in 2d + 1 recurring in 4d
  assert.equal(result.pendingLoansCount, 2)    // 1 overdue loan + 1 loan in 6d
  assert.equal(result.unreadNotificationsCount, 4)
  assert.equal(result.baseCurrency, "USD")
})
