import {
  Wallet,
  Transaction,
  RecurringRule,
  BillInstance,
  Loan,
  LoanRepayment,
  CalendarPlanEvent,
  Category,
  CalendarEventItem,
  CalendarDaySummary,
  CashFlowMonthOverview,
} from "@/types"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isBefore,
  isAfter,
  addDays,
  addWeeks,
  addMonths,
  addYears,
} from "date-fns"

/**
 * Creates a currency converter closure that normalizes amounts into targetCurrency.
 * Safeguards against missing rates, 0, or NaN by falling back to original amount.
 */
export function createCurrencyConverter(
  targetCurrency: string,
  exchangeRates: Record<string, number>
): (amount: number, fromCurrency?: string) => number {
  const targetUpper = (targetCurrency || "USD").toUpperCase()
  return (amount: number, fromCurrency?: string): number => {
    if (!amount || isNaN(amount)) return 0
    const fromUpper = (fromCurrency || targetCurrency || "USD").toUpperCase()
    if (fromUpper === targetUpper) return amount
    const rate = exchangeRates[fromUpper]
    if (rate && rate > 0 && !isNaN(rate)) {
      return Math.round(amount / rate)
    }
    return amount
  }
}

/**
 * Helper to normalize any Date or string into a local noon Date to prevent timezone drift.
 */
function parseToLocalNoon(d: Date | string): Date {
  if (typeof d === "string") {
    if (d.includes("T")) {
      const dt = new Date(d)
      return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 12, 0, 0)
    }
    const [y, m, day] = d.split("-").map(Number)
    return new Date(y, m - 1, day, 12, 0, 0)
  }
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0)
}

/**
 * Generates a full month calendar grid (35 or 42 cells) starting on Sunday (weekStartsOn: 0).
 */
export function generateCalendarGridDays(
  year: number,
  month: number,
  todayStr: string
): CalendarDaySummary[] {
  const monthDate = new Date(year, month - 1, 1)
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })

  const rawDays = eachDayOfInterval({ start, end })

  const days: CalendarDaySummary[] = rawDays.map((d) => {
    const dateStr = format(d, "yyyy-MM-dd")
    const [yStr, mStr, dStr] = dateStr.split("-")
    const dYear = parseInt(yStr, 10)
    const dMonth = parseInt(mStr, 10)
    const dayOfMonth = parseInt(dStr, 10)

    return {
      date: dateStr,
      dayOfMonth,
      isCurrentMonth: dYear === year && dMonth === month,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      closingBalance: 0,
      totalInflow: 0,
      totalOutflow: 0,
      netChange: 0,
      events: [],
      isDeficit: false,
      isLowBuffer: false,
    }
  })

  // Ensure standard calendar row height (minimum 5 weeks / 35 cells, up to 6 weeks / 42 cells)
  while (days.length < 35) {
    const lastDay = days[days.length - 1]
    const nextDate = addDays(parseISO(lastDay.date), 1)
    const dateStr = format(nextDate, "yyyy-MM-dd")
    const [yStr, mStr, dStr] = dateStr.split("-")
    const dYear = parseInt(yStr, 10)
    const dMonth = parseInt(mStr, 10)
    const dayOfMonth = parseInt(dStr, 10)

    days.push({
      date: dateStr,
      dayOfMonth,
      isCurrentMonth: dYear === year && dMonth === month,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      closingBalance: 0,
      totalInflow: 0,
      totalOutflow: 0,
      netChange: 0,
      events: [],
      isDeficit: false,
      isLowBuffer: false,
    })
  }

  return days
}

/**
 * Projects future occurrences of a recurring rule inside the requested date window.
 */
export function projectRecurringOccurrences(
  rule: RecurringRule,
  windowStartStr: string,
  windowEndStr: string
): CalendarEventItem[] {
  if (!rule.isActive) return []

  const occurrences: CalendarEventItem[] = []
  const windowStart = parseToLocalNoon(windowStartStr)
  const windowEnd = parseToLocalNoon(windowEndStr)
  const ruleStart = parseToLocalNoon(rule.startDate)
  const ruleEnd = rule.endDate ? parseToLocalNoon(rule.endDate) : null

  const r = rule as RecurringRule & {
    interval?: number
    nextOccurrence?: Date
    isSubscription?: boolean
  }

  const interval = r.interval && r.interval > 0 ? r.interval : 1
  let cur = parseToLocalNoon(r.nextOccurrence || r.nextDueDate || rule.startDate)

  // Rewind if cur is after windowStart to ensure we catch all instances in window
  while (isAfter(cur, windowStart) && isAfter(cur, ruleStart)) {
    if (rule.frequency === "daily") cur = addDays(cur, -interval)
    else if (rule.frequency === "weekly") cur = addWeeks(cur, -interval)
    else if (rule.frequency === "biweekly") cur = addWeeks(cur, -(2 * interval))
    else if (rule.frequency === "monthly") cur = addMonths(cur, -interval)
    else if (rule.frequency === "quarterly") cur = addMonths(cur, -(3 * interval))
    else if (rule.frequency === "yearly") cur = addYears(cur, -interval)
    else break
  }

  // Fast forward into window
  let safety = 0
  while (safety++ < 1000) {
    if (isAfter(cur, windowEnd)) break
    if (ruleEnd && isAfter(cur, ruleEnd)) break

    const dateStr = format(cur, "yyyy-MM-dd")
    if (dateStr >= windowStartStr && dateStr <= windowEndStr && !isBefore(cur, ruleStart)) {
      const isSub = r.isSubscription || rule.kind === "subscription"
      occurrences.push({
        id: `rec_${rule._id.toString()}_${dateStr}`,
        date: dateStr,
        title: rule.description,
        amount: Math.abs(rule.amount),
        currency: rule.currency || "USD",
        convertedAmount: Math.abs(rule.amount),
        type: rule.type === "income" ? "recurring" : (isSub ? "subscription" : "recurring"),
        flow: rule.type === "income" ? "inflow" : "outflow",
        status: "upcoming",
        walletId: rule.walletId,
        sourceId: rule._id.toString(),
      })
    }

    if (rule.frequency === "daily") cur = addDays(cur, interval)
    else if (rule.frequency === "weekly") cur = addWeeks(cur, interval)
    else if (rule.frequency === "biweekly") cur = addWeeks(cur, 2 * interval)
    else if (rule.frequency === "monthly") cur = addMonths(cur, interval)
    else if (rule.frequency === "quarterly") cur = addMonths(cur, 3 * interval)
    else if (rule.frequency === "yearly") cur = addYears(cur, interval)
    else break
  }

  return occurrences
}

export interface CalculateCashFlowCalendarInputs {
  targetMonth: string // YYYY-MM
  todayDate?: string  // YYYY-MM-DD override for testing
  wallets: Wallet[]
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  bills: BillInstance[]
  loans: Loan[]
  repayments: LoanRepayment[]
  plans: CalendarPlanEvent[]
  categories: Category[]
  targetCurrency: string
  exchangeRates: Record<string, number>
  mode: "liquid" | "all"
  safetyBufferCents?: number
}

/**
 * Pure calculation engine projecting day-by-day cash flow and running balances
 * across a complete calendar grid for the target month.
 */
export function calculateCashFlowCalendar(
  inputs: CalculateCashFlowCalendarInputs
): CashFlowMonthOverview {
  const {
    targetMonth,
    wallets,
    transactions,
    recurringRules,
    bills,
    loans,
    repayments,
    plans,
    categories,
    targetCurrency,
    exchangeRates,
    mode,
    safetyBufferCents = 0,
  } = inputs

  const todayStr = inputs.todayDate || format(new Date(), "yyyy-MM-dd")
  const [yearStr, monthStr] = targetMonth.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const convert = createCurrencyConverter(targetCurrency, exchangeRates || {})
  const categoryMap = new Map<string, Category>()
  categories.forEach((c) => categoryMap.set(c._id.toString(), c))

  const walletMap = new Map<string, Wallet>()
  wallets.forEach((w) => walletMap.set(w._id.toString(), w))

  // 1. Compute baseline cash balance (liquid vs all accounts)
  let baselineCash = 0
  for (const w of wallets) {
    if (w.isArchived) continue
    if (mode === "liquid") {
      if (w.type === "cash" || w.type === "bank" || w.type === "savings") {
        baselineCash += convert(w.balance, w.currency)
      }
    } else {
      // All wallets: credit cards are liabilities
      const val = convert(w.balance, w.currency)
      if (w.type === "credit_card") {
        baselineCash -= Math.abs(val)
      } else {
        baselineCash += val
      }
    }
  }

  // 2. Generate calendar cells (35 or 42 days)
  const days = generateCalendarGridDays(year, month, todayStr)
  const windowStartStr = days[0].date
  const windowEndStr = days[days.length - 1].date

  const dayMap = new Map<string, CalendarDaySummary>()
  days.forEach((d) => dayMap.set(d.date, d))

  // Helper to attach event to a day
  const attachEvent = (item: CalendarEventItem) => {
    const day = dayMap.get(item.date)
    if (!day) return
    day.events.push(item)
    if (item.flow === "inflow") {
      day.totalInflow += item.convertedAmount
    } else {
      day.totalOutflow += item.convertedAmount
    }
    day.netChange = day.totalInflow - day.totalOutflow
  }

  // 3. Map Historical Settled Transactions (Past & Today)
  for (const tx of transactions) {
    const txDateStr = format(new Date(tx.date), "yyyy-MM-dd")
    if (txDateStr > todayStr || txDateStr < windowStartStr) continue

    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined
    const w = walletMap.get(tx.walletId)
    const converted = convert(tx.amount, tx.currency)

    attachEvent({
      id: `tx_${tx._id.toString()}`,
      date: txDateStr,
      title: tx.description,
      amount: tx.amount,
      currency: tx.currency,
      convertedAmount: converted,
      type: "transaction",
      flow: tx.type === "income" ? "inflow" : "outflow",
      status: "settled",
      category: cat
        ? { id: cat._id.toString(), name: cat.name, icon: cat.icon, color: cat.color }
        : undefined,
      walletId: tx.walletId,
      walletName: w?.name,
      sourceId: tx._id.toString(),
      notes: tx.notes,
    })
  }

  // 4. Map Recurring Rule Occurrences (Today & Future)
  for (const rule of recurringRules) {
    const occurrences = projectRecurringOccurrences(rule, todayStr, windowEndStr)
    for (const occ of occurrences) {
      occ.convertedAmount = convert(occ.amount, occ.currency)
      attachEvent(occ)
    }
  }

  // 5. Map Bill Instances (Today & Future or Overdue)
  for (const bill of bills) {
    const billDateStr = format(new Date(bill.dueDate), "yyyy-MM-dd")
    const b = bill as BillInstance & {
      name?: string
      amount?: number
      isPaid?: boolean
    }
    const isPaid = b.isPaid !== undefined ? b.isPaid : b.status === "paid"
    if (isPaid && billDateStr < todayStr) continue // Settled bills in past already captured via transactions

    const rawAmount = b.amount ?? b.actualAmount ?? b.expectedAmount ?? 0
    const converted = convert(rawAmount, b.currency)
    const isOverdue = !isPaid && billDateStr < todayStr
    const effectiveDate = isOverdue ? todayStr : billDateStr // Overdue bills press on today's cash flow

    attachEvent({
      id: `bill_${b._id.toString()}`,
      date: effectiveDate,
      title: b.name || b.description || "Bill",
      amount: rawAmount,
      currency: b.currency,
      convertedAmount: converted,
      type: "bill",
      flow: "outflow",
      status: isOverdue ? "overdue" : (isPaid ? "settled" : "upcoming"),
      sourceId: b._id.toString(),
      notes: isOverdue ? "Overdue Bill" : undefined,
    })
  }

  // 6. Map Loan Repayments (Today & Future)
  for (const rep of repayments) {
    const repDateStr = format(new Date(rep.date), "yyyy-MM-dd")
    if (repDateStr < todayStr) continue

    const repCurrency = (rep as any).currency || targetCurrency
    const converted = convert(rep.amount, repCurrency)
    const loan = loans.find((l) => l._id.toString() === rep.loanId)
    const isLent = loan?.type === "lent"
    const loanTitle = loan ? `${(loan as any).name || loan.personName} Repayment` : "Loan Repayment"

    attachEvent({
      id: `loan_rep_${rep._id.toString()}`,
      date: repDateStr,
      title: loanTitle,
      amount: rep.amount,
      currency: repCurrency,
      convertedAmount: converted,
      type: "loan",
      flow: isLent ? "inflow" : "outflow",
      status: "upcoming",
      sourceId: rep.loanId,
    })
  }

  // 7. Map One-off Planned Events
  for (const plan of plans) {
    const planDateStr = format(new Date(plan.date), "yyyy-MM-dd")
    if (plan.isCompleted && planDateStr < todayStr) continue

    const converted = convert(plan.amount, plan.currency)
    const cat = plan.categoryId ? categoryMap.get(plan.categoryId) : undefined
    const w = plan.walletId ? walletMap.get(plan.walletId) : undefined

    attachEvent({
      id: `plan_${plan._id.toString()}`,
      date: planDateStr,
      title: plan.title,
      amount: plan.amount,
      currency: plan.currency,
      convertedAmount: converted,
      type: "plan",
      flow: plan.flow,
      status: plan.isCompleted ? "settled" : "planned",
      category: cat
        ? { id: cat._id.toString(), name: cat.name, icon: cat.icon, color: cat.color }
        : undefined,
      walletId: plan.walletId,
      walletName: w?.name,
      sourceId: plan._id.toString(),
      notes: plan.notes,
    })
  }

  // 8. Calculate Daily Running Balances (Backward & Forward)
  if (todayStr > windowEndStr) {
    // Entire window is in the past
    let backwardRunning = baselineCash
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i]
      d.closingBalance = backwardRunning
      d.isDeficit = d.closingBalance < 0
      d.isLowBuffer = safetyBufferCents > 0 ? d.closingBalance < safetyBufferCents : false
      backwardRunning -= d.netChange
    }
  } else if (todayStr < windowStartStr) {
    // Entire window is in the future
    let running = baselineCash
    for (let i = 0; i < days.length; i++) {
      const d = days[i]
      running += d.netChange
      d.closingBalance = running
      d.isDeficit = d.closingBalance < 0
      d.isLowBuffer = safetyBufferCents > 0 ? d.closingBalance < safetyBufferCents : false
    }
  } else {
    // Window contains today
    const todayIdx = days.findIndex((d) => d.date === todayStr)
    let running = baselineCash
    for (let i = todayIdx; i < days.length; i++) {
      const d = days[i]
      running += d.netChange
      d.closingBalance = running
      d.isDeficit = d.closingBalance < 0
      d.isLowBuffer = safetyBufferCents > 0 ? d.closingBalance < safetyBufferCents : false
    }

    let backwardRunning = baselineCash
    for (let i = todayIdx - 1; i >= 0; i--) {
      const d = days[i]
      d.closingBalance = backwardRunning
      d.isDeficit = d.closingBalance < 0
      d.isLowBuffer = safetyBufferCents > 0 ? d.closingBalance < safetyBufferCents : false
      backwardRunning -= d.netChange
    }
  }

  // 9. Compute Month-Level Aggregate KPIs
  let totalInflow = 0
  let totalOutflow = 0
  let lowestBalance = Infinity
  let lowestBalanceDate = todayStr
  let deficitDaysCount = 0

  for (const d of days) {
    if (!d.isCurrentMonth) continue
    totalInflow += d.totalInflow
    totalOutflow += d.totalOutflow

    if (d.closingBalance < lowestBalance) {
      lowestBalance = d.closingBalance
      lowestBalanceDate = d.date
    }
    if (d.isDeficit) {
      deficitDaysCount++
    }
  }

  const currentMonthDays = days.filter((d) => d.isCurrentMonth)
  const startingBalance =
    currentMonthDays.length > 0
      ? currentMonthDays[0].closingBalance - currentMonthDays[0].netChange
      : baselineCash
  const projectedEndingBalance =
    currentMonthDays.length > 0
      ? currentMonthDays[currentMonthDays.length - 1].closingBalance
      : baselineCash

  return {
    month: targetMonth,
    targetCurrency,
    startingBalance,
    projectedEndingBalance,
    totalInflow,
    totalOutflow,
    netCashFlow: totalInflow - totalOutflow,
    lowestBalance: lowestBalance === Infinity ? baselineCash : lowestBalance,
    lowestBalanceDate,
    deficitDaysCount,
    days,
  }
}
