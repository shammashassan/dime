import {
  SharedExpense,
  SharedSettlement,
  SharedExpenseParticipant,
  ParticipantType,
  PairwiseBalance,
  ParticipantSummary,
  SimplifiedDebtTransfer,
  SharedExpensesOverviewViewModel,
} from "@/types"

export interface SplitInputParticipant {
  participantId: string
  participantType: ParticipantType
  name: string
  email?: string
  amountPaid?: number // in cents
  amountOwed?: number // in cents
  percentage?: number // for percentage mode
}

/**
 * Calculates equal split amounts for participants, distributing remainder cents evenly.
 */
export function calculateEqualExpenseSplits(
  totalAmountCents: number,
  participants: { participantId: string; participantType: ParticipantType; name: string; email?: string; amountPaid?: number }[]
): SharedExpenseParticipant[] {
  const count = participants.length
  if (count === 0) return []

  const baseAmount = Math.floor(totalAmountCents / count)
  const remainder = totalAmountCents % count

  return participants.map((p, idx) => ({
    participantId: p.participantId,
    participantType: p.participantType,
    name: p.name,
    email: p.email,
    amountPaid: p.amountPaid || 0,
    amountOwed: baseAmount + (idx < remainder ? 1 : 0),
  }))
}

/**
 * Calculates percentage-based splits for participants.
 */
export function calculatePercentageExpenseSplits(
  totalAmountCents: number,
  participants: { participantId: string; participantType: ParticipantType; name: string; email?: string; percentage: number; amountPaid?: number }[]
): SharedExpenseParticipant[] {
  if (participants.length === 0) return []

  let accumulated = 0
  return participants.map((p, idx) => {
    let amt: number
    if (idx === participants.length - 1) {
      amt = totalAmountCents - accumulated
    } else {
      amt = Math.round(totalAmountCents * (p.percentage / 100))
      accumulated += amt
    }

    return {
      participantId: p.participantId,
      participantType: p.participantType,
      name: p.name,
      email: p.email,
      amountPaid: p.amountPaid || 0,
      amountOwed: amt,
      percentage: p.percentage,
    }
  })
}

/**
 * Validates a shared expense split configuration.
 */
export function validateExpenseSplits(
  totalAmountCents: number,
  participants: SharedExpenseParticipant[]
): string | null {
  if (!participants || participants.length < 2) {
    return "An expense split requires at least two participants."
  }

  if (totalAmountCents <= 0) {
    return "Total amount must be greater than zero."
  }

  let totalPaidSum = 0
  let totalOwedSum = 0
  const seenIds = new Set<string>()

  for (const p of participants) {
    if (!p.participantId || !p.name) {
      return "All participants must have a valid ID and name."
    }
    if (seenIds.has(p.participantId)) {
      return `Duplicate participant detected: ${p.name}.`
    }
    seenIds.add(p.participantId)

    if (p.amountOwed < 0 || p.amountPaid < 0) {
      return "Participant amounts cannot be negative."
    }

    totalPaidSum += p.amountPaid
    totalOwedSum += p.amountOwed
  }

  if (totalPaidSum !== totalAmountCents) {
    return `Sum of amounts paid (${(totalPaidSum / 100).toFixed(2)}) must equal total expense amount (${(totalAmountCents / 100).toFixed(2)}).`
  }

  if (totalOwedSum !== totalAmountCents) {
    return `Sum of participant shares (${(totalOwedSum / 100).toFixed(2)}) must equal total expense amount (${(totalAmountCents / 100).toFixed(2)}).`
  }

  return null
}

export interface CalculateBalancesOptions {
  currentUserId?: string
  currency?: string
}

/**
 * Dynamically computes participant summaries (total paid, total share owed, net balance)
 * and pairwise debt matrix from raw canonical ledger records.
 */
export function calculateDynamicBalances(
  expenses: SharedExpense[],
  settlements: SharedSettlement[],
  options: CalculateBalancesOptions = {}
): {
  participantSummaries: ParticipantSummary[]
  pairwiseBalances: PairwiseBalance[]
} {
  const currency = options.currency || expenses[0]?.currency || "USD"

  const participantMap = new Map<
    string,
    {
      id: string
      type: ParticipantType
      name: string
      email?: string
      totalPaid: number
      totalShare: number
    }
  >()

  const getOrCreateParticipant = (
    id: string,
    type: ParticipantType,
    name: string,
    email?: string
  ) => {
    if (!participantMap.has(id)) {
      participantMap.set(id, {
        id,
        type,
        name: name || "Unknown Participant",
        email,
        totalPaid: 0,
        totalShare: 0,
      })
    }
    return participantMap.get(id)!
  }

  for (const expense of expenses) {
    for (const p of expense.participants) {
      const entry = getOrCreateParticipant(
        p.participantId,
        p.participantType,
        p.name,
        p.email
      )
      entry.totalPaid += p.amountPaid
      entry.totalShare += p.amountOwed
    }
  }

  const settlementPaidFromMap = new Map<string, Map<string, number>>()

  for (const s of settlements) {
    getOrCreateParticipant(s.fromParticipantId, s.fromParticipantType, "Participant")
    getOrCreateParticipant(s.toParticipantId, s.toParticipantType, "Participant")

    if (!settlementPaidFromMap.has(s.fromParticipantId)) {
      settlementPaidFromMap.set(s.fromParticipantId, new Map())
    }
    const fromMap = settlementPaidFromMap.get(s.fromParticipantId)!
    const current = fromMap.get(s.toParticipantId) || 0
    fromMap.set(s.toParticipantId, current + s.amount)
  }

  const participantSummaries: ParticipantSummary[] = Array.from(
    participantMap.values()
  ).map((p) => {
    const netFromExpenses = p.totalPaid - p.totalShare
    let settlementAdjustment = 0

    if (settlementPaidFromMap.has(p.id)) {
      for (const amount of settlementPaidFromMap.get(p.id)!.values()) {
        settlementAdjustment += amount
      }
    }
    for (const [fromId, targetMap] of settlementPaidFromMap.entries()) {
      if (targetMap.has(p.id)) {
        settlementAdjustment -= targetMap.get(p.id)!
      }
    }

    return {
      id: p.id,
      type: p.type,
      name: p.name,
      email: p.email,
      totalPaid: p.totalPaid,
      totalShare: p.totalShare,
      netBalance: netFromExpenses + settlementAdjustment,
      currency,
    }
  })

  const pairwiseDebtMap = new Map<string, Map<string, number>>()

  for (const expense of expenses) {
    const totalPaid = expense.totalAmount
    if (totalPaid <= 0) continue

    for (const payer of expense.participants) {
      if (payer.amountPaid <= 0) continue
      const payerRatio = payer.amountPaid / totalPaid

      for (const debtor of expense.participants) {
        if (debtor.participantId === payer.participantId) continue
        if (debtor.amountOwed <= 0) continue

        const debt = Math.round(debtor.amountOwed * payerRatio)

        if (!pairwiseDebtMap.has(debtor.participantId)) {
          pairwiseDebtMap.set(debtor.participantId, new Map())
        }
        const debtorMap = pairwiseDebtMap.get(debtor.participantId)!
        const existing = debtorMap.get(payer.participantId) || 0
        debtorMap.set(payer.participantId, existing + debt)
      }
    }
  }

  for (const [fromId, targetMap] of settlementPaidFromMap.entries()) {
    for (const [toId, amount] of targetMap.entries()) {
      if (pairwiseDebtMap.has(fromId) && pairwiseDebtMap.get(fromId)!.has(toId)) {
        const currentDebt = pairwiseDebtMap.get(fromId)!.get(toId)!
        const newDebt = currentDebt - amount
        pairwiseDebtMap.get(fromId)!.set(toId, newDebt)
      } else {
        if (!pairwiseDebtMap.has(fromId)) {
          pairwiseDebtMap.set(fromId, new Map())
        }
        pairwiseDebtMap.get(fromId)!.set(toId, -amount)
      }
    }
  }

  const processedPairs = new Set<string>()
  const pairwiseBalances: PairwiseBalance[] = []

  for (const p1 of participantSummaries) {
    for (const p2 of participantSummaries) {
      if (p1.id === p2.id) continue

      const pairKey = [p1.id, p2.id].sort().join(":")
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      const p1OwesP2 = pairwiseDebtMap.get(p1.id)?.get(p2.id) || 0
      const p2OwesP1 = pairwiseDebtMap.get(p2.id)?.get(p1.id) || 0

      const netDifference = p1OwesP2 - p2OwesP1

      if (netDifference > 0) {
        pairwiseBalances.push({
          fromParticipantId: p1.id,
          fromParticipantName: p1.name,
          fromParticipantType: p1.type,
          toParticipantId: p2.id,
          toParticipantName: p2.name,
          toParticipantType: p2.type,
          netAmount: netDifference,
          currency,
        })
      } else if (netDifference < 0) {
        pairwiseBalances.push({
          fromParticipantId: p2.id,
          fromParticipantName: p2.name,
          fromParticipantType: p2.type,
          toParticipantId: p1.id,
          toParticipantName: p1.name,
          toParticipantType: p1.type,
          netAmount: Math.abs(netDifference),
          currency,
        })
      }
    }
  }

  return {
    participantSummaries,
    pairwiseBalances,
  }
}

/**
 * Calculates a simplified debt transfer graph that minimizes the total number of
 * transactions required to settle balances within a group of participants.
 */
export function computeSimplifiedDebts(
  participants: ParticipantSummary[],
  currency: string = "USD"
): SimplifiedDebtTransfer[] {
  const debtors: { p: ParticipantSummary; amountOwed: number }[] = []
  const creditors: { p: ParticipantSummary; amountOwed: number }[] = []

  for (const p of participants) {
    if (p.netBalance < -1) {
      debtors.push({ p, amountOwed: Math.abs(p.netBalance) })
    } else if (p.netBalance > 1) {
      creditors.push({ p, amountOwed: p.netBalance })
    }
  }

  debtors.sort((a, b) => b.amountOwed - a.amountOwed)
  creditors.sort((a, b) => b.amountOwed - a.amountOwed)

  const transfers: SimplifiedDebtTransfer[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const transferAmount = Math.min(debtor.amountOwed, creditor.amountOwed)

    if (transferAmount > 0) {
      transfers.push({
        fromParticipantId: debtor.p.id,
        fromParticipantName: debtor.p.name,
        fromParticipantType: debtor.p.type,
        toParticipantId: creditor.p.id,
        toParticipantName: creditor.p.name,
        toParticipantType: creditor.p.type,
        amount: transferAmount,
        currency: currency || debtor.p.currency || "USD",
      })

      debtor.amountOwed -= transferAmount
      creditor.amountOwed -= transferAmount
    }

    if (debtor.amountOwed <= 1) {
      i++
    }
    if (creditor.amountOwed <= 1) {
      j++
    }
  }

  return transfers
}

export interface BuildOverviewViewModelOptions {
  currentUserId: string
  currentUserName?: string
  expenses: SharedExpense[]
  settlements: SharedSettlement[]
  baseCurrency?: string
}

/**
 * Builds the complete SharedExpensesOverviewViewModel for UI consumption.
 */
export function buildSharedExpensesOverviewViewModel(
  options: BuildOverviewViewModelOptions
): SharedExpensesOverviewViewModel {
  const { currentUserId, currentUserName, expenses, settlements, baseCurrency = "USD" } = options
  const currency = baseCurrency || expenses[0]?.currency || "USD"

  const { participantSummaries, pairwiseBalances } = calculateDynamicBalances(
    expenses,
    settlements,
    { currentUserId, currency }
  )

  let currentUserSummary = participantSummaries.find((p) => p.id === currentUserId)
  if (!currentUserSummary) {
    currentUserSummary = {
      id: currentUserId,
      type: "user",
      name: currentUserName || "You",
      totalPaid: 0,
      totalShare: 0,
      netBalance: 0,
      currency,
    }
  }

  const simplifiedTransfers = computeSimplifiedDebts(participantSummaries, currency)

  const userNetBalance = currentUserSummary.netBalance
  let userTotalOwedToOthers = 0
  let userTotalOwedFromOthers = 0

  for (const pair of pairwiseBalances) {
    if (pair.fromParticipantId === currentUserId) {
      userTotalOwedToOthers += pair.netAmount
    } else if (pair.toParticipantId === currentUserId) {
      userTotalOwedFromOthers += pair.netAmount
    }
  }

  const totalSharedAmount = expenses.reduce((acc, e) => acc + e.totalAmount, 0)
  const activeExpenseCount = expenses.filter((e) => e.status !== "settled").length

  return {
    currency,
    totalSharedAmount,
    userNetBalance,
    userTotalOwedToOthers,
    userTotalOwedFromOthers,
    activeExpenseCount,
    participants: participantSummaries,
    pairwiseBalances,
    simplifiedTransfers,
    recentExpenses: expenses,
    recentSettlements: settlements,
  }
}
