import {
  format,
  parseISO,
  isToday,
  isYesterday,
  differenceInCalendarDays,
  isSameMonth,
  isSameYear,
  startOfDay,
  isSameDay,
  subDays,
} from "date-fns"
import type {
  TimelineEvent,
  TimelineEventType,
  TimelineEventCategory,
  TimelineEventImpact,
  TimelineDateGroup,
  TimelineSummaryStats,
} from "@/types"

export interface RawTimelineEntityBundle {
  transactions?: Array<{
    _id: string | { toString(): string }
    date: Date | string
    amount: number
    currency?: string
    type: "income" | "expense" | "transfer"
    description: string
    notes?: string
    walletId?: string
    categoryId?: string | null
    isRecurring?: boolean
    isFlagged?: boolean
    splits?: Array<{ categoryId: string; amount: number }>
  }>
  goals?: Array<{
    _id: string | { toString(): string }
    name: string
    targetAmount: number
    currentAmount: number
    currency: string
    createdAt: Date | string
    targetDate?: Date | string
  }>
  loans?: Array<{
    _id: string | { toString(): string }
    personName: string
    type: "lent" | "borrowed"
    amount: number
    currency: string
    date: Date | string
    status: string
    remainingAmount: number
  }>
  loanRepayments?: Array<{
    _id: string | { toString(): string }
    loanId: string
    amount: number
    date: Date | string
    notes?: string
    personName?: string
    loanType?: "lent" | "borrowed"
    currency?: string
  }>
  bills?: Array<{
    _id: string | { toString(): string }
    description: string
    amount?: number
    expectedAmount?: number
    actualAmount?: number
    currency: string
    dueDate: Date | string
    paidDate?: Date | string
    status: string
  }>
  recurringRules?: Array<{
    _id: string | { toString(): string }
    description: string
    amount: number
    currency: string
    frequency: string
    kind?: string
    nextRenewalDate?: Date | string
    lastProcessedDate?: Date | string
    status?: string
    isActive: boolean
  }>
  investmentTransactions?: Array<{
    _id: string | { toString(): string }
    symbol: string
    type: string
    quantity: number
    price?: number
    totalAmount?: number
    currency?: string
    date: Date | string
    notes?: string
  }>
  sharedSettlements?: Array<{
    _id: string | { toString(): string }
    fromParticipantId?: string
    toParticipantId?: string
    payerName?: string
    payeeName?: string
    amount: number
    currency: string
    settledAt: Date | string
    method?: string
    notes?: string
    isPayer?: boolean
  }>
  assets?: Array<{
    _id: string | { toString(): string }
    name: string
    kind: "asset" | "liability"
    category: string
    currentValue: number
    currency: string
    createdAt: Date | string
  }>
  assetValuations?: Array<{
    _id: string | { toString(): string }
    assetName?: string
    value: number
    currency?: string
    date: Date | string
    source?: string
    notes?: string
  }>
  walletMap?: Map<string, { name: string; currency: string }>
  categoryMap?: Map<string, { name: string; color: string; icon: string }>
}

/**
 * Normalizes an arbitrary raw Date or ISO string into a canonical ISO string.
 */
export function toSafeISOString(dateVal: Date | string | undefined | null, fallbackDate = new Date()): string {
  if (!dateVal) return fallbackDate.toISOString()
  if (typeof dateVal === "string") {
    const parsed = new Date(dateVal)
    return isNaN(parsed.getTime()) ? fallbackDate.toISOString() : parsed.toISOString()
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString()
  }
  return fallbackDate.toISOString()
}

/**
 * Pure synthesizer that transforms heterogeneous financial entities into uniform TimelineEvents.
 */
export function synthesizeTimelineEvents(
  bundle: RawTimelineEntityBundle,
  baseCurrency = "USD",
  convert?: (amount: number, from: string) => number
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const walletMap = bundle.walletMap || new Map()
  const categoryMap = bundle.categoryMap || new Map()

  // 1. Transactions
  if (bundle.transactions) {
    for (const tx of bundle.transactions) {
      const txId = typeof tx._id === "string" ? tx._id : tx._id.toString()
      const dateStr = toSafeISOString(tx.date)
      const amount = Math.abs(tx.amount || 0)
      const currency = tx.currency || baseCurrency
      const convertedAmount = convert ? convert(amount, currency) : amount
      const category = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined
      const wallet = tx.walletId ? walletMap.get(tx.walletId) : undefined

      const categoryName = category?.name || (tx.type === "transfer" ? "Transfer" : "Uncategorized")
      const walletName = wallet?.name || "Account"

      let impact: TimelineEventImpact = "neutral"
      let isMilestone = false
      let milestoneReason: string | undefined

      if (tx.type === "income") {
        impact = "inflow"
        // Check for milestone: high income / payday (e.g. >= 100,000 cents / $1,000)
        if (amount >= 100000 || /salary|payroll|bonus|payday/i.test(tx.description)) {
          isMilestone = true
          milestoneReason = "Significant Inflow"
        }
      } else if (tx.type === "expense") {
        impact = "outflow"
        // Large expense milestone (e.g. >= 50,000 cents / $500)
        if (amount >= 50000) {
          isMilestone = true
          milestoneReason = "Major Purchase"
        }
      }

      const iconName =
        tx.type === "income"
          ? "ArrowDownLeft"
          : tx.type === "expense"
            ? "ArrowUpRight"
            : "ArrowLeftRight"

      events.push({
        id: `tx-${txId}`,
        type: "transaction",
        category: isMilestone ? "milestones" : "transactions",
        title: tx.description || (tx.type === "income" ? "Income Received" : "Expense Recorded"),
        description: `${walletName} • ${categoryName}${tx.notes ? ` • ${tx.notes}` : ""}`,
        date: dateStr,
        amount,
        currency,
        convertedAmount,
        impact,
        iconName,
        badge: {
          label: isMilestone ? (milestoneReason || "Milestone") : tx.type.toUpperCase(),
          variant: tx.type === "income" ? "success" : tx.type === "expense" ? "secondary" : "outline",
        },
        isMilestone,
        milestoneReason,
        href: `/transactions/${txId}`,
        metadata: {
          walletId: tx.walletId,
          categoryId: tx.categoryId,
          isSplit: Boolean(tx.splits && tx.splits.length > 0),
        },
      })
    }
  }

  // 2. Goals (Achieved, Milestones, and Creations)
  if (bundle.goals) {
    for (const g of bundle.goals) {
      const goalId = typeof g._id === "string" ? g._id : g._id.toString()
      const isCompleted = g.targetAmount > 0 && g.currentAmount >= g.targetAmount
      const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
      const dateStr = toSafeISOString(g.createdAt)

      if (isCompleted) {
        const goalCurr = g.currency || baseCurrency
        events.push({
          id: `goal-achieved-${goalId}`,
          type: "goal_completed",
          category: "milestones",
          title: `Goal Achieved: ${g.name}! 🎉`,
          description: `Successfully reached 100% of target target (${pct}%)`,
          date: dateStr,
          amount: g.targetAmount,
          currency: goalCurr,
          convertedAmount: convert ? convert(g.targetAmount, goalCurr) : g.targetAmount,
          impact: "milestone",
          iconName: "Trophy",
          badge: { label: "Goal Reached! 🏆", variant: "default" },
          isMilestone: true,
          milestoneReason: `Reached 100% of ${g.name}`,
          href: `/goals/${goalId}`,
        })
      } else if (pct >= 50) {
        const goalCurr = g.currency || baseCurrency
        events.push({
          id: `goal-milestone-${goalId}`,
          type: "goal_milestone",
          category: "milestones",
          title: `Goal Milestone: ${g.name} (${pct}%)`,
          description: `Progress milestone crossed for ${g.name}`,
          date: dateStr,
          amount: g.currentAmount,
          currency: goalCurr,
          convertedAmount: convert ? convert(g.currentAmount, goalCurr) : g.currentAmount,
          impact: "milestone",
          iconName: "Target",
          badge: { label: `${pct}% Milestone`, variant: "outline" },
          isMilestone: true,
          milestoneReason: `Crossed ${pct}% for ${g.name}`,
          href: `/goals/${goalId}`,
        })
      }
    }
  }

  // 3. Loans & Repayments
  if (bundle.loans) {
    for (const loan of bundle.loans) {
      const loanId = typeof loan._id === "string" ? loan._id : loan._id.toString()
      const dateStr = toSafeISOString(loan.date)
      const isFullySettled = loan.status === "fully_repaid" || loan.remainingAmount <= 0
      const loanCurr = loan.currency || baseCurrency

      if (isFullySettled) {
        events.push({
          id: `loan-settled-${loanId}`,
          type: "loan_settled",
          category: "milestones",
          title: `Loan Fully Settled: ${loan.personName} 🎯`,
          description: `The ${loan.type === "lent" ? "lent money" : "debt"} with ${loan.personName} has been completely cleared.`,
          date: dateStr,
          amount: loan.amount,
          currency: loanCurr,
          convertedAmount: convert ? convert(loan.amount, loanCurr) : loan.amount,
          impact: "milestone",
          iconName: "CheckCheck",
          badge: { label: "Fully Settled 🏆", variant: "default" },
          isMilestone: true,
          milestoneReason: `Loan with ${loan.personName} settled`,
          href: `/loans/${loanId}`,
        })
      } else {
        events.push({
          id: `loan-originated-${loanId}`,
          type: "loan_originated",
          category: "loans",
          title: loan.type === "lent" ? `Money Lent to ${loan.personName}` : `Borrowed from ${loan.personName}`,
          description: `Initial principal • Status: ${loan.status.replace("_", " ").toUpperCase()}`,
          date: dateStr,
          amount: loan.amount,
          currency: loanCurr,
          convertedAmount: convert ? convert(loan.amount, loanCurr) : loan.amount,
          impact: loan.type === "lent" ? "outflow" : "inflow",
          iconName: "HandCoins",
          badge: { label: loan.type === "lent" ? "LENT" : "BORROWED", variant: "secondary" },
          isMilestone: false,
          href: `/loans/${loanId}`,
        })
      }
    }
  }

  if (bundle.loanRepayments) {
    for (const rep of bundle.loanRepayments) {
      const repId = typeof rep._id === "string" ? rep._id : rep._id.toString()
      const dateStr = toSafeISOString(rep.date)
      const isLent = rep.loanType === "lent"
      const repCurr = rep.currency || baseCurrency

      events.push({
        id: `repayment-${repId}`,
        type: "loan_repayment",
        category: "loans",
        title: isLent ? `Repayment Received from ${rep.personName || "Contact"}` : `Repaid to ${rep.personName || "Contact"}`,
        description: rep.notes ? `Repayment • ${rep.notes}` : "Loan Repayment",
        date: dateStr,
        amount: rep.amount,
        currency: repCurr,
        convertedAmount: convert ? convert(rep.amount, repCurr) : rep.amount,
        impact: isLent ? "inflow" : "outflow",
        iconName: "CheckCircle2",
        badge: { label: "Repayment", variant: "outline" },
        isMilestone: false,
        href: rep.loanId ? `/loans/${rep.loanId}` : "/loans",
      })
    }
  }

  // 4. Bills & Subscriptions
  if (bundle.bills) {
    for (const bill of bundle.bills) {
      const billId = typeof bill._id === "string" ? bill._id : bill._id.toString()
      const isPaid = bill.status === "paid"
      const dateStr = toSafeISOString(isPaid ? bill.paidDate || bill.dueDate : bill.dueDate)
      const amount = bill.actualAmount ?? bill.expectedAmount ?? bill.amount ?? 0
      const billCurr = bill.currency || baseCurrency

      events.push({
        id: `bill-${billId}`,
        type: "bill_paid",
        category: "bills_subscriptions",
        title: bill.description,
        description: `Bill ${isPaid ? "Paid" : "Due"} • ${bill.status.toUpperCase()}`,
        date: dateStr,
        amount,
        currency: billCurr,
        convertedAmount: convert ? convert(amount, billCurr) : amount,
        impact: isPaid ? "outflow" : "neutral",
        iconName: "Receipt",
        badge: { label: isPaid ? "Paid Bill" : "Pending Bill", variant: isPaid ? "outline" : "secondary" },
        isMilestone: false,
        href: "/recurring?tab=bills",
      })
    }
  }

  if (bundle.recurringRules) {
    for (const rec of bundle.recurringRules) {
      if (rec.kind === "subscription" && rec.isActive) {
        const recId = typeof rec._id === "string" ? rec._id : rec._id.toString()
        const dateStr = toSafeISOString(rec.lastProcessedDate || rec.nextRenewalDate)
        const recCurr = rec.currency || baseCurrency

        events.push({
          id: `sub-${recId}`,
          type: "subscription_renewed",
          category: "bills_subscriptions",
          title: `${rec.description} Subscription`,
          description: `Cycle: ${rec.frequency.toUpperCase()}`,
          date: dateStr,
          amount: rec.amount,
          currency: recCurr,
          convertedAmount: convert ? convert(rec.amount, recCurr) : rec.amount,
          impact: "outflow",
          iconName: "Repeat",
          badge: { label: "Subscription", variant: "secondary" },
          isMilestone: false,
          href: "/recurring?tab=subscriptions",
        })
      }
    }
  }

  // 5. Investment Transactions
  if (bundle.investmentTransactions) {
    for (const it of bundle.investmentTransactions) {
      const itId = typeof it._id === "string" ? it._id : it._id.toString()
      const dateStr = toSafeISOString(it.date)
      const isDividend = /dividend/i.test(it.type)
      const itAmount = it.totalAmount ?? (it.price && it.quantity ? Math.round(it.price * it.quantity) : 0)
      const itCurr = it.currency || baseCurrency

      events.push({
        id: `inv-${itId}`,
        type: isDividend ? "dividend_received" : "investment_trade",
        category: isDividend ? "milestones" : "investments",
        title: isDividend
          ? `Dividend Received: ${it.symbol}`
          : `${it.type.toUpperCase()} ${it.quantity} shares of ${it.symbol}`,
        description: it.notes || `Holding: ${it.symbol} • ${it.type.toUpperCase()}`,
        date: dateStr,
        amount: itAmount,
        currency: itCurr,
        convertedAmount: convert ? convert(itAmount, itCurr) : itAmount,
        impact: it.type === "buy" ? "outflow" : "inflow",
        iconName: isDividend ? "Sparkles" : "TrendingUp",
        badge: {
          label: isDividend ? "Dividend ⭐" : it.type.toUpperCase(),
          variant: isDividend ? "default" : "outline",
        },
        isMilestone: isDividend,
        milestoneReason: isDividend ? `Dividend from ${it.symbol}` : undefined,
        href: "/investments",
      })
    }
  }

  // 6. Shared Settlements
  if (bundle.sharedSettlements) {
    for (const set of bundle.sharedSettlements) {
      const setId = typeof set._id === "string" ? set._id : set._id.toString()
      const dateStr = toSafeISOString(set.settledAt)
      const isPayer = set.isPayer !== false
      const setCurr = set.currency || baseCurrency

      events.push({
        id: `shared-${setId}`,
        type: "shared_settlement",
        category: "shared",
        title: `Settled with ${isPayer ? set.payeeName || "Group" : set.payerName || "Group"}`,
        description: `Shared Expenses Settlement${set.method ? ` via ${set.method}` : ""}`,
        date: dateStr,
        amount: set.amount,
        currency: setCurr,
        convertedAmount: convert ? convert(set.amount, setCurr) : set.amount,
        impact: isPayer ? "outflow" : "inflow",
        iconName: "Users2",
        badge: { label: "Shared Settle Up", variant: "outline" },
        isMilestone: false,
        href: "/shared-expenses",
      })
    }
  }

  // 7. Assets
  if (bundle.assets) {
    for (const ast of bundle.assets) {
      const astId = typeof ast._id === "string" ? ast._id : ast._id.toString()
      const dateStr = toSafeISOString(ast.createdAt)
      const astCurr = ast.currency || baseCurrency

      events.push({
        id: `asset-${astId}`,
        type: "asset_created",
        category: "investments",
        title: `New ${ast.kind === "asset" ? "Asset" : "Liability"} Added: ${ast.name}`,
        description: `Category: ${ast.category.replace("_", " ").toUpperCase()}`,
        date: dateStr,
        amount: ast.currentValue,
        currency: astCurr,
        convertedAmount: convert ? convert(ast.currentValue, astCurr) : ast.currentValue,
        impact: "neutral",
        iconName: ast.kind === "asset" ? "Building2" : "CreditCard",
        badge: { label: ast.kind.toUpperCase(), variant: "secondary" },
        isMilestone: ast.currentValue >= 500000, // Significant asset ($5k+)
        milestoneReason: ast.currentValue >= 500000 ? `High-value asset: ${ast.name}` : undefined,
        href: "/net-worth",
      })
    }
  }

  // Sort descending by date
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return events
}

/**
 * Groups events into chronological human-readable buckets ("Today", "Yesterday", "This Week", etc.).
 */
export function groupEventsByDateBracket(
  events: TimelineEvent[],
  referenceDate = new Date()
): TimelineDateGroup[] {
  const groupMap = new Map<string, { label: string; events: TimelineEvent[]; netAmount: number }>()

  for (const ev of events) {
    const evDate = parseISO(ev.date)
    let groupKey: string
    let groupLabel: string

    const isEventToday = isSameDay(evDate, referenceDate)
    const isEventYesterday = isSameDay(evDate, subDays(referenceDate, 1))

    if (isEventToday) {
      groupKey = "today"
      groupLabel = "Today"
    } else if (isEventYesterday) {
      groupKey = "yesterday"
      groupLabel = "Yesterday"
    } else if (differenceInCalendarDays(referenceDate, evDate) <= 7 && differenceInCalendarDays(referenceDate, evDate) > 0) {
      groupKey = "this-week"
      groupLabel = "Earlier This Week"
    } else if (isSameMonth(evDate, referenceDate) && isSameYear(evDate, referenceDate)) {
      groupKey = "earlier-this-month"
      groupLabel = "Earlier This Month"
    } else if (isSameYear(evDate, referenceDate)) {
      groupKey = format(evDate, "yyyy-MM")
      groupLabel = format(evDate, "MMMM yyyy")
    } else {
      groupKey = format(evDate, "yyyy-MM")
      groupLabel = format(evDate, "MMMM yyyy")
    }

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        label: groupLabel,
        events: [],
        netAmount: 0,
      })
    }

    const group = groupMap.get(groupKey)!
    group.events.push(ev)

    const evVal = ev.convertedAmount ?? ev.amount ?? 0
    if (ev.impact === "inflow" && ev.amount) {
      group.netAmount += evVal
    } else if (ev.impact === "outflow" && ev.amount) {
      group.netAmount -= evVal
    }
  }

  return Array.from(groupMap.entries()).map(([dateKey, val]) => ({
    dateKey,
    label: val.label,
    netAmount: val.netAmount,
    events: val.events,
  }))
}

/**
 * Computes high-level summary KPIs from the timeline events.
 */
export function calculateTimelineStats(
  events: TimelineEvent[],
  currency = "USD"
): TimelineSummaryStats {
  let milestonesCount = 0
  let totalInflow = 0
  let totalOutflow = 0

  for (const ev of events) {
    if (ev.isMilestone) {
      milestonesCount++
    }
    const evVal = ev.convertedAmount ?? ev.amount ?? 0
    if (ev.impact === "inflow" && ev.amount) {
      totalInflow += evVal
    } else if (ev.impact === "outflow" && ev.amount) {
      totalOutflow += evVal
    }
  }

  return {
    totalEvents: events.length,
    milestonesCount,
    totalInflow,
    totalOutflow,
    netFlow: totalInflow - totalOutflow,
    currency,
  }
}

/**
 * Filters timeline events by category, free-text search, and date ranges.
 */
export function filterTimelineEvents(
  events: TimelineEvent[],
  filter: {
    category?: TimelineEventCategory
    search?: string
    from?: string
    to?: string
    limit?: number
  }
): TimelineEvent[] {
  let result = events

  // 1. Category Filter
  if (filter.category && filter.category !== "all") {
    if (filter.category === "milestones") {
      result = result.filter((e) => e.isMilestone)
    } else {
      result = result.filter((e) => e.category === filter.category)
    }
  }

  // 2. Date Range Filter
  if (filter.from) {
    const fromTime = startOfDay(parseISO(filter.from)).getTime()
    result = result.filter((e) => new Date(e.date).getTime() >= fromTime)
  }
  if (filter.to) {
    const toTime = new Date(`${filter.to}T23:59:59.999Z`).getTime()
    result = result.filter((e) => new Date(e.date).getTime() <= toTime)
  }

  // 3. Free-Text Search
  if (filter.search && filter.search.trim() !== "") {
    const q = filter.search.toLowerCase().trim()
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.badge?.label && e.badge.label.toLowerCase().includes(q)) ||
        (e.milestoneReason && e.milestoneReason.toLowerCase().includes(q))
    )
  }

  // 4. Limit
  if (filter.limit && filter.limit > 0) {
    result = result.slice(0, filter.limit)
  }

  return result
}
