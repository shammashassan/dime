import { cache } from "react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/collections"
import { Loan, LoanRepayment, Contact } from "@/types"
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
  totalOwed: number // Net amount (positive means they owe you, negative means you owe them)
  baseCurrency: string
}

export const getContactsWithSummaries = cache(async (): Promise<ContactWithSummary[]> => {
  const scope = await getFinancialScope()
  const contactsColl = await getCollection<Contact>("contacts")
  const loansColl = await getCollection<Loan>("loans")

  const contacts = await contactsColl.find(getScopeFilter(scope)).sort({ name: 1 }).toArray()
  const loans = await loansColl.find(getScopeFilter(scope)).toArray()

  // Find user settings/baseCurrency from profile, default INR/USD
  const baseCurrency = "INR" // Dime default base currency

  const contactsWithSummary: ContactWithSummary[] = []

  for (const contact of contacts) {
    const contactIdStr = contact._id.toString()
    const contactLoans = loans.filter(
      (l) => l.contactId === contactIdStr || (!l.contactId && l.personName.toLowerCase() === contact.name.toLowerCase())
    )

    const activeLoans = contactLoans.filter((l) => ["active", "partially_repaid", "overdue"].includes(l.status))

    let netOwed = 0
    for (const loan of contactLoans) {
      if (loan.status === "cancelled") continue

      const convertedRemaining = await convertCurrency(loan.remainingAmount, loan.currency, baseCurrency)
      if (loan.type === "lent") {
        netOwed += convertedRemaining
      } else {
        netOwed -= convertedRemaining
      }
    }

    contactsWithSummary.push({
      ...contact,
      loanCount: contactLoans.length,
      activeLoanCount: activeLoans.length,
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

  let currentBalance = 0
  loans.forEach(loan => {
    if (loan.type === "lent") {
      currentBalance += loan.remainingAmount
    } else {
      currentBalance -= loan.remainingAmount
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
