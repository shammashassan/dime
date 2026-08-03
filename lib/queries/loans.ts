import { cache } from "react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/collections"
import { Loan, LoanRepayment, Contact, SharedExpense, SharedSettlement } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getOrganizationSettings } from "@/lib/queries/organization"
import { getPreferences } from "@/lib/queries/preferences"
import { convertCurrency } from "@/lib/currency"
import { startOfMonth, endOfMonth, isAfter, isBefore, endOfDay, subDays, format } from "date-fns"

export async function getActiveBaseCurrency(): Promise<string> {
  const scope = await getFinancialScope()
  if (scope.isOrganization && scope.organizationId) {
    const orgSettings = await getOrganizationSettings(scope.organizationId)
    if (orgSettings?.baseCurrency) {
      return orgSettings.baseCurrency
    }
  }
  const prefs = await getPreferences(scope.userId)
  return prefs.defaultCurrency || "USD"
}

export const getLoans = cache(async (): Promise<Loan[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const loansColl = await getCollection<Loan>("loans")

  return loansColl.find(filter).sort({ date: -1 }).toArray()
})

export const getLoanById = cache(async (id: string): Promise<Loan | null> => {
  try {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const loansColl = await getCollection<Loan>("loans")

    return loansColl.findOne({
      _id: new ObjectId(id),
      ...filter
    })
  } catch {
    return null
  }
})

export const getLoanRepayments = cache(async (loanId: string): Promise<LoanRepayment[]> => {
  try {
    const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")
    return repaymentsColl.find({ loanId }).sort({ date: -1 }).toArray()
  } catch {
    return []
  }
})

export const getContacts = cache(async (): Promise<Contact[]> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const contactsColl = await getCollection<Contact>("contacts")

  return contactsColl.find(filter).sort({ name: 1 }).toArray()
})

export interface OwedSummaries {
  totalLent: number
  totalBorrowed: number
  dueThisMonth: number
  overdue: number
  repaidThisMonth: number
  baseCurrency: string
}

export const getOwedSummaries = cache(async (): Promise<OwedSummaries> => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)
  const baseCurrency = await getActiveBaseCurrency()

  const loansColl = await getCollection<Loan>("loans")
  const repaymentsColl = await getCollection<LoanRepayment>("loan_repayments")

  const loans = await loansColl.find(filter).toArray()

  let totalLent = 0
  let totalBorrowed = 0
  let dueThisMonth = 0
  let overdue = 0

  const now = new Date()
  const startOfThisMonth = startOfMonth(now)
  const endOfThisMonth = endOfMonth(now)

  for (const loan of loans) {
    if (loan.status === "cancelled" || loan.status === "fully_repaid") {
      continue
    }

    const convertedRemaining = await convertCurrency(loan.remainingAmount, loan.currency, baseCurrency)

    if (loan.type === "lent") {
      totalLent += convertedRemaining
    } else {
      totalBorrowed += convertedRemaining
    }

    // Check if overdue
    const isOverdueStatus = loan.status === "overdue"
    const isDatePassed = loan.dueDate && isBefore(new Date(loan.dueDate), now)
    
    if (isOverdueStatus || isDatePassed) {
      overdue += convertedRemaining
    }

    // Check if due this month
    if (loan.dueDate) {
      const due = new Date(loan.dueDate)
      if (due >= startOfThisMonth && due <= endOfThisMonth) {
        dueThisMonth += convertedRemaining
      }
    }
  }

  // Calculate repayments in the current month
  // We need to fetch repayments for loans in the active scope
  const loanIds = loans.map(l => l._id.toString())
  let repaidThisMonth = 0

  if (loanIds.length > 0) {
    const repayments = await repaymentsColl.find({
      loanId: { $in: loanIds },
      date: { $gte: startOfThisMonth, $lte: endOfThisMonth }
    }).toArray()

    for (const rep of repayments) {
      // Find the corresponding loan to get the currency
      const loan = loans.find(l => l._id.toString() === rep.loanId)
      if (loan) {
        const convertedRep = await convertCurrency(rep.amount, loan.currency, baseCurrency)
        repaidThisMonth += convertedRep
      }
    }
  }

  return {
    totalLent,
    totalBorrowed,
    dueThisMonth,
    overdue,
    repaidThisMonth,
    baseCurrency
  }
})

export interface ContactWithSummary extends Omit<Contact, "_id"> {
  _id: string | any
  loanCount: number
  activeLoanCount: number
  sharedExpenseCount?: number
  totalOwed: number // Net amount (positive means they owe you, negative means you owe them)
  baseCurrency: string
}

export const getContactsWithSummaries = cache(async (): Promise<ContactWithSummary[]> => {
  const scope = await getFinancialScope()
  const contactsColl = await getCollection<Contact>("contacts")
  const loansColl = await getCollection<Loan>("loans")
  const sharedExpensesColl = await getCollection<SharedExpense>("shared_expenses")
  const sharedSettlementsColl = await getCollection<SharedSettlement>("shared_settlements")

  const contacts = await contactsColl.find(getScopeFilter(scope)).sort({ name: 1 }).toArray()
  const loans = await loansColl.find(getScopeFilter(scope)).toArray()
  const sharedExpenses = await sharedExpensesColl.find(getScopeFilter(scope)).toArray()
  const sharedSettlements = await sharedSettlementsColl.find(getScopeFilter(scope)).toArray()

  const baseCurrency = await getActiveBaseCurrency()

  const contactsWithSummary: ContactWithSummary[] = []

  for (const contact of contacts) {
    const contactIdStr = contact._id.toString()
    const contactLoans = loans.filter(
      (l) => l.contactId === contactIdStr || (!l.contactId && l.personName.toLowerCase() === contact.name.toLowerCase())
    )

    const activeLoans = contactLoans.filter((l) => ["active", "partially_repaid", "overdue"].includes(l.status))

    let netOwed = 0

    // 1. Loan debts
    for (const loan of contactLoans) {
      if (loan.status === "cancelled") continue

      const convertedRemaining = await convertCurrency(loan.remainingAmount, loan.currency, baseCurrency)
      if (loan.type === "lent") {
        netOwed += convertedRemaining
      } else {
        netOwed -= convertedRemaining
      }
    }

    // 2. Shared Expenses
    const contactExpenses = sharedExpenses.filter((e) =>
      e.participants.some((p) => p.participantId === contactIdStr)
    )

    for (const expense of contactExpenses) {
      const contactP = expense.participants.find((p) => p.participantId === contactIdStr)
      const userP = expense.participants.find((p) => p.participantType === "user")

      if (!contactP || !userP) continue

      if (expense.paidByParticipantId === userP.participantId) {
        // User paid upfront -> Contact owes user contactP.amountOwed
        const converted = await convertCurrency(contactP.amountOwed, expense.currency, baseCurrency)
        netOwed += converted
      } else if (expense.paidByParticipantId === contactIdStr) {
        // Contact paid upfront -> User owes contact userP.amountOwed
        const converted = await convertCurrency(userP.amountOwed, expense.currency, baseCurrency)
        netOwed -= converted
      }
    }

    // 3. Shared Settlements
    const contactSettlements = sharedSettlements.filter(
      (s) => s.fromParticipantId === contactIdStr || s.toParticipantId === contactIdStr
    )

    for (const s of contactSettlements) {
      const converted = await convertCurrency(s.amount, s.currency, baseCurrency)
      if (s.fromParticipantId === contactIdStr) {
        // Contact paid User -> reduces debt contact owes user
        netOwed -= converted
      } else if (s.toParticipantId === contactIdStr) {
        // User paid Contact -> reduces debt user owes contact
        netOwed += converted
      }
    }

    contactsWithSummary.push({
      ...contact,
      loanCount: contactLoans.length,
      activeLoanCount: activeLoans.length,
      sharedExpenseCount: contactExpenses.length,
      totalOwed: netOwed,
      baseCurrency
    })
  }

  return contactsWithSummary
})

export const getContactById = cache(async (id: string): Promise<Contact | null> => {
  const scope = await getFinancialScope()
  const contactsColl = await getCollection<Contact>("contacts")
  return contactsColl.findOne({ _id: new ObjectId(id), ...getScopeFilter(scope) })
})

export const getLoansByContact = cache(async (contactId: string, contactName: string): Promise<Loan[]> => {
  const scope = await getFinancialScope()
  const loansColl = await getCollection<Loan>("loans")
  return loansColl.find({
    $or: [
      { contactId },
      { personName: { $regex: new RegExp(`^${contactName}$`, "i") } }
    ],
    ...getScopeFilter(scope)
  }).sort({ date: -1 }).toArray()
})

export const getContactBalanceDailyHistory = cache(async (contactId: string, contactName: string, daysCount: number = 90) => {
  const scope = await getFinancialScope()
  const filter = getScopeFilter(scope)

  const contactsColl = await getCollection<Contact>("contacts")
  const contact = await contactsColl.findOne({ _id: new ObjectId(contactId), ...filter })
  if (!contact) return []

  const loansColl = await getCollection<Loan>("loans")
  const loans = await loansColl.find({
    $or: [
      { contactId },
      { personName: { $regex: new RegExp(`^${contactName}$`, "i") } }
    ],
    status: { $ne: "cancelled" },
    ...filter
  }).toArray()

  const repaymentsColl = await getCollection<any>("loan_repayments")
  const loanIds = loans.map(l => l._id.toString())
  const repayments = loanIds.length > 0
    ? await repaymentsColl.find({ loanId: { $in: loanIds } }).toArray()
    : []

  const sharedExpensesColl = await getCollection<SharedExpense>("shared_expenses")
  const sharedExpenses = await sharedExpensesColl.find({
    ...filter,
    "participants.participantId": contactId,
  }).toArray()

  const sharedSettlementsColl = await getCollection<SharedSettlement>("shared_settlements")
  const sharedSettlements = await sharedSettlementsColl.find({
    ...filter,
    $or: [{ fromParticipantId: contactId }, { toParticipantId: contactId }],
  }).toArray()

  let currentBalance = 0

  // 1. Loans current remaining
  loans.forEach(loan => {
    if (loan.type === "lent") {
      currentBalance += loan.remainingAmount
    } else {
      currentBalance -= loan.remainingAmount
    }
  })

  // 2. Shared Expenses current remaining
  const contactIdStr = contact._id.toString()
  sharedExpenses.forEach((exp) => {
    const contactP = exp.participants.find((p) => p.participantId === contactIdStr)
    const userP = exp.participants.find((p) => p.participantType === "user")

    if (!contactP || !userP) return

    if (exp.paidByParticipantId === userP.participantId) {
      currentBalance += contactP.amountOwed
    } else if (exp.paidByParticipantId === contactIdStr) {
      currentBalance -= userP.amountOwed
    }
  })

  // 3. Shared Settlements current remaining
  sharedSettlements.forEach((s) => {
    if (s.fromParticipantId === contactIdStr) {
      currentBalance -= s.amount
    } else if (s.toParticipantId === contactIdStr) {
      currentBalance += s.amount
    }
  })

  const days: Date[] = []
  for (let i = 0; i < daysCount; i++) {
    days.push(endOfDay(subDays(new Date(), i)))
  }
  days.sort((a, b) => a.getTime() - b.getTime())

  const events: { date: Date; delta: number }[] = []

  loans.forEach(loan => {
    events.push({
      date: new Date(loan.date),
      delta: loan.type === "lent" ? loan.amount : -loan.amount
    })
  })

  repayments.forEach(rep => {
    const loan = loans.find(l => l._id.toString() === rep.loanId)
    if (!loan) return
    events.push({
      date: new Date(rep.date),
      delta: loan.type === "lent" ? -rep.amount : rep.amount
    })
  })

  sharedExpenses.forEach(exp => {
    const contactP = exp.participants.find((p) => p.participantId === contactIdStr)
    const userP = exp.participants.find((p) => p.participantType === "user")

    if (!contactP || !userP) return

    if (exp.paidByParticipantId === userP.participantId) {
      events.push({
        date: new Date(exp.date),
        delta: contactP.amountOwed,
      })
    } else if (exp.paidByParticipantId === contactIdStr) {
      events.push({
        date: new Date(exp.date),
        delta: -userP.amountOwed,
      })
    }
  })

  sharedSettlements.forEach(s => {
    events.push({
      date: new Date(s.settledAt),
      delta: s.fromParticipantId === contactIdStr ? -s.amount : s.amount,
    })
  })

  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  const recordedBalances: Record<string, number> = {}
  let eventIndex = 0
  const reverseDays = [...days].reverse()

  reverseDays.forEach((dayEnd: Date) => {
    while (eventIndex < events.length && events[eventIndex].date > dayEnd) {
      const event = events[eventIndex]
      currentBalance -= event.delta
      eventIndex++
    }
    recordedBalances[dayEnd.getTime().toString()] = currentBalance
  })

  return days.map((dayEnd) => ({
    date: format(dayEnd, "yyyy-MM-dd"),
    balance: (recordedBalances[dayEnd.getTime().toString()] || 0) / 100,
  }))
})
