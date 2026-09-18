import { cache } from "react"
import type { BillInstance, RecurringRule, Loan, DashboardFocusCounts } from "@/types"
import { addDays, isBefore, endOfDay, startOfDay } from "date-fns"

export function calculateFocusCounts({
  now,
  bills,
  recurring,
  loans,
  unreadNotifications,
  baseCurrency,
  convert,
}: {
  now: Date
  bills: Array<{ dueDate: Date | string; status: string; amount?: number; expectedAmount?: number; actualAmount?: number; currency?: string }>
  recurring: Array<{ nextRun?: Date | string | null; nextRenewalDate?: Date | string | null; nextDueDate?: Date | string | null; status?: string; isActive?: boolean }>
  loans: Array<{ dueDate?: Date | string | null; status?: string; remainingAmount?: number }>
  unreadNotifications: number
  baseCurrency: string
  convert?: (amount: number, from: string) => number
}): DashboardFocusCounts {
  const startOfToday = startOfDay(now)
  const sevenDaysFromNow = endOfDay(addDays(now, 7))

  let overdueBillsCount = 0
  let overdueBillsAmount = 0
  let upcomingRenewalsCount = 0

  for (const b of bills) {
    if (b.status === "paid" || b.status === "cancelled" || b.status === "skipped") continue
    const due = new Date(b.dueDate)
    const rawAmount = b.amount ?? b.expectedAmount ?? b.actualAmount ?? 0
    const billCurrency = b.currency || baseCurrency
    const converted = convert ? convert(rawAmount, billCurrency) : rawAmount
    if (isBefore(due, startOfToday)) {
      overdueBillsCount++
      overdueBillsAmount += converted
    } else if (due <= sevenDaysFromNow) {
      upcomingRenewalsCount++
    }
  }

  for (const r of recurring) {
    if (r.status === "paused" || r.status === "cancelled" || r.isActive === false) continue
    const next = r.nextRun ?? r.nextRenewalDate ?? r.nextDueDate
    if (!next) continue
    const nextDate = new Date(next)
    if (nextDate >= now && nextDate <= sevenDaysFromNow) {
      upcomingRenewalsCount++
    }
  }

  let pendingLoansCount = 0
  for (const l of loans) {
    if (l.status === "fully_repaid" || l.status === "cancelled" || !l.dueDate) continue
    if (l.remainingAmount !== undefined && l.remainingAmount <= 0) continue
    const due = new Date(l.dueDate)
    if (isBefore(due, startOfToday) || due <= sevenDaysFromNow) {
      pendingLoansCount++
    }
  }

  return {
    overdueBillsCount,
    overdueBillsAmount,
    upcomingRenewalsCount,
    pendingLoansCount,
    unreadNotificationsCount: unreadNotifications,
    baseCurrency,
  }
}

export const getDashboardFocusCounts = cache(async (userId: string): Promise<DashboardFocusCounts> => {
  const [{ getCollection, notificationsCollection }, { getFinancialScope, getScopeFilter }, { getPreferences }] =
    await Promise.all([
      import("@/lib/db/collections"),
      import("@/lib/scope"),
      import("@/lib/queries/preferences"),
    ])

  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const prefs = await getPreferences(userId)
  const baseCurrency = prefs.defaultCurrency || "USD"

  const billsColl = await getCollection<BillInstance>("bill_instances")
  const recurringColl = await getCollection<RecurringRule>("recurring_rules")
  const loansColl = await getCollection<Loan>("loans")

  const now = new Date()

  const [bills, recurring, loans, unreadCount] = await Promise.all([
    billsColl.find(filter).toArray(),
    recurringColl.find(filter).toArray(),
    loansColl.find(filter).toArray(),
    notificationsCollection.countDocuments({
      userId,
      readAt: { $exists: false },
      deletedAt: { $exists: false },
    }),
  ])

  const billsCurrencies = Array.from(new Set(bills.map((b) => b.currency).filter(Boolean)))
  const { getCurrencyConverter } = await import("@/lib/currency")
  const convert = await getCurrencyConverter(baseCurrency, billsCurrencies)

  return calculateFocusCounts({
    now,
    bills,
    recurring,
    loans,
    unreadNotifications: unreadCount,
    baseCurrency,
    convert,
  })
})
