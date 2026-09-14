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

test("calculateFocusCounts treats bills due today as upcoming renewals and skips zero-balance loans", () => {
  const now = new Date("2026-09-14T12:00:00Z")

  const bills = [
    // Due earlier today (e.g. 2 hours before `now`) - should NOT be overdue, should be upcoming renewal
    { dueDate: new Date("2026-09-14T10:00:00Z"), status: "unpaid", amount: 1500 },
    // Due 2 days ago - should be overdue
    { dueDate: new Date("2026-09-12T12:00:00Z"), status: "unpaid", amount: 2500 },
  ]

  const recurring = [
    { nextRun: new Date("2026-09-14T14:00:00Z"), status: "active" }, // today -> upcoming
  ]

  const loans = [
    // Active loan with zero remaining amount should be skipped
    { dueDate: new Date("2026-09-14T10:00:00Z"), status: "active", remainingAmount: 0 },
    // Active loan with negative remaining amount should be skipped
    { dueDate: new Date("2026-09-12T10:00:00Z"), status: "active", remainingAmount: -50 },
    // Active loan with positive remaining amount due today should be pending
    { dueDate: new Date("2026-09-14T15:00:00Z"), status: "active", remainingAmount: 4000 },
  ]

  const result = calculateFocusCounts({
    now,
    bills,
    recurring,
    loans,
    unreadNotifications: 1,
    baseCurrency: "EUR",
  })

  assert.equal(result.overdueBillsCount, 1) // Only past bill from Sep 12
  assert.equal(result.overdueBillsAmount, 2500)
  assert.equal(result.upcomingRenewalsCount, 2) // Today's bill + today's recurring
  assert.equal(result.pendingLoansCount, 1) // Only active loan with positive remainingAmount
  assert.equal(result.unreadNotificationsCount, 1)
  assert.equal(result.baseCurrency, "EUR")
})
