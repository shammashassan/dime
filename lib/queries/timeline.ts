import { cache } from "react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { getPreferences } from "@/lib/queries/preferences"
import { getOrganizationSettings } from "@/lib/queries/organization"
import { getCurrencyConverter } from "@/lib/currency"
import {
  synthesizeTimelineEvents,
  groupEventsByDateBracket,
  calculateTimelineStats,
  filterTimelineEvents,
  type RawTimelineEntityBundle,
} from "@/lib/calculations/timeline"
import type {
  Transaction,
  Goal,
  Loan,
  LoanRepayment,
  BillInstance,
  RecurringRule,
  InvestmentTransaction,
  SharedSettlement,
  Asset,
  AssetValuation,
  Wallet,
  Category,
  TimelineData,
  TimelineEventCategory,
} from "@/types"

export interface GetTimelineOptions {
  category?: TimelineEventCategory
  search?: string
  from?: string
  to?: string
  limit?: number
}

export const getTimelineData = cache(
  async (userId: string, options: GetTimelineOptions = {}): Promise<TimelineData> => {
    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)

    // Resolve base currency
    let baseCurrency = "USD"
    if (scope.isOrganization && scope.organizationId) {
      const orgSettings = await getOrganizationSettings(scope.organizationId)
      if (orgSettings?.baseCurrency) {
        baseCurrency = orgSettings.baseCurrency
      }
    } else {
      const prefs = await getPreferences(userId)
      if (prefs?.defaultCurrency) {
        baseCurrency = prefs.defaultCurrency
      }
    }

    // Collections
    const [
      txColl,
      goalsColl,
      loansColl,
      repColl,
      billsColl,
      recColl,
      invColl,
      sharedColl,
      assetsColl,
      walletsColl,
      catsColl,
    ] = await Promise.all([
      getCollection<Transaction>("transactions"),
      getCollection<Goal>("goals"),
      getCollection<Loan>("loans"),
      getCollection<LoanRepayment>("loan_repayments"),
      getCollection<BillInstance>("bill_instances"),
      getCollection<RecurringRule>("recurring_rules"),
      getCollection<InvestmentTransaction>("investment_transactions"),
      getCollection<SharedSettlement>("shared_settlements"),
      getCollection<Asset>("assets"),
      getCollection<Wallet>("wallets"),
      getCollection<Category>("categories"),
    ])

    // Parallel entity queries with limits for performance
    const [
      transactions,
      goals,
      loans,
      repayments,
      bills,
      recurring,
      investments,
      sharedSettlements,
      assets,
      wallets,
      categories,
    ] = await Promise.all([
      txColl.find(scopeFilter).sort({ date: -1 }).limit(100).toArray(),
      goalsColl.find(scopeFilter).sort({ createdAt: -1 }).limit(50).toArray(),
      loansColl.find(scopeFilter).sort({ date: -1 }).limit(50).toArray(),
      repColl.find({}).sort({ date: -1 }).limit(50).toArray(),
      billsColl.find(scopeFilter).sort({ dueDate: -1 }).limit(50).toArray(),
      recColl.find(scopeFilter).toArray(),
      invColl.find(scopeFilter).sort({ date: -1 }).limit(50).toArray(),
      sharedColl.find(scopeFilter).sort({ settledAt: -1 }).limit(50).toArray(),
      assetsColl.find({ ...scopeFilter, isArchived: false }).sort({ createdAt: -1 }).limit(50).toArray(),
      walletsColl.find(scopeFilter).toArray(),
      catsColl.find({}).toArray(),
    ])

    // Create quick lookup maps
    const walletMap = new Map<string, { name: string; currency: string }>()
    for (const w of wallets) {
      walletMap.set(w._id.toString(), { name: w.name, currency: w.currency })
    }

    const categoryMap = new Map<string, { name: string; color: string; icon: string }>()
    for (const c of categories) {
      categoryMap.set(c._id.toString(), { name: c.name, color: c.color, icon: c.icon })
    }

    const loanMap = new Map(loans.map((l) => [l._id.toString(), l]))

    const bundle: RawTimelineEntityBundle = {
      transactions: transactions.map((t) => ({
        _id: t._id.toString(),
        amount: t.amount,
        currency: t.currency,
        date: t.date,
        type: t.type,
        walletId: t.walletId,
        categoryId: t.categoryId,
        description: t.description,
        isRecurring: t.isRecurring,
        isFlagged: t.isFlagged,
        splits: t.splits,
      })),
      goals: goals.map((g) => ({
        _id: g._id.toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        currency: g.currency,
        createdAt: g.createdAt,
        targetDate: g.targetDate,
      })),
      loans: loans.map((l) => ({
        _id: l._id.toString(),
        personName: l.personName,
        type: l.type,
        amount: l.amount,
        currency: l.currency,
        date: l.date,
        status: l.status,
        remainingAmount: l.remainingAmount,
      })),
      loanRepayments: repayments.map((r) => {
        const linkedLoan = loanMap.get(r.loanId)
        return {
          _id: r._id.toString(),
          loanId: r.loanId,
          amount: r.amount,
          date: r.date,
          notes: r.notes,
          personName: linkedLoan?.personName,
          loanType: linkedLoan?.type,
          currency: linkedLoan?.currency || baseCurrency,
        }
      }),
      bills: bills.map((b) => ({
        _id: b._id.toString(),
        description: b.description,
        amount: b.actualAmount ?? b.expectedAmount,
        actualAmount: b.actualAmount,
        expectedAmount: b.expectedAmount,
        currency: b.currency,
        dueDate: b.dueDate,
        paidDate: b.paidDate,
        status: b.status,
      })),
      recurringRules: recurring.map((r) => ({
        _id: r._id.toString(),
        description: r.description,
        amount: r.amount,
        currency: r.currency,
        frequency: r.frequency,
        kind: r.kind,
        nextRenewalDate: r.nextRenewalDate,
        lastProcessedDate: r.lastProcessedDate,
        status: r.status,
        isActive: r.isActive,
      })),
      investmentTransactions: investments.map((i) => ({
        _id: i._id.toString(),
        symbol: i.symbol,
        type: i.type,
        quantity: i.quantity,
        price: i.price,
        totalAmount: i.grossAmount || Math.round(i.price * i.quantity),
        currency: walletMap.get(i.walletId)?.currency || baseCurrency,
        date: i.date,
        notes: i.notes,
      })),
      sharedSettlements: sharedSettlements.map((s) => ({
        _id: s._id.toString(),
        fromParticipantId: s.fromParticipantId,
        toParticipantId: s.toParticipantId,
        amount: s.amount,
        currency: s.currency,
        settledAt: s.settledAt,
        method: s.paymentMethod,
        notes: s.notes,
        isPayer: s.fromParticipantId === userId,
      })),
      assets: assets.map((a) => ({
        _id: a._id.toString(),
        name: a.name,
        kind: a.kind,
        category: a.category,
        currentValue: a.currentValue,
        currency: a.currency,
        createdAt: a.createdAt,
      })),
      walletMap,
      categoryMap,
    }

    // Resolve distinct currencies and pre-fetch converter
    const sourceCurrencies = Array.from(
      new Set([
        ...transactions.map((t) => t.currency).filter(Boolean),
        ...goals.map((g) => g.currency).filter(Boolean),
        ...loans.map((l) => l.currency).filter(Boolean),
        ...repayments.map((r) => loanMap.get(r.loanId)?.currency || baseCurrency).filter(Boolean),
        ...bills.map((b) => b.currency).filter(Boolean),
        ...recurring.map((r) => r.currency).filter(Boolean),
        ...investments.map((i) => walletMap.get(i.walletId)?.currency || baseCurrency),
        ...sharedSettlements.map((s) => s.currency).filter(Boolean),
        ...assets.map((a) => a.currency).filter(Boolean),
      ])
    )
    const convert = await getCurrencyConverter(baseCurrency, sourceCurrencies as string[])

    // Pure synthesis
    const rawEvents = synthesizeTimelineEvents(bundle, baseCurrency, convert)

    // Apply optional filter parameters
    const filteredEvents = filterTimelineEvents(rawEvents, {
      category: options.category,
      search: options.search,
      from: options.from,
      to: options.to,
      limit: options.limit ?? 100,
    })

    // Grouping and stats
    const groups = groupEventsByDateBracket(filteredEvents)
    const stats = calculateTimelineStats(filteredEvents, baseCurrency)

    return {
      events: filteredEvents,
      groups,
      stats,
      currency: baseCurrency,
    }
  }
)
