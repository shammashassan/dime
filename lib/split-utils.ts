import { Transaction } from "@/types"

export interface SplitItem {
  id: string
  categoryId: string
  amount: number // in cents (integer)
  percentage?: number // optional, stored for percentage splits
  notes?: string
}

/**
 * Generates a stable unique ID for a split item.
 * Safe to run on both client (browser) and server.
 */
export function generateSplitId(): string {
  return "split_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36)
}

/**
 * Expands a single transaction into one or more virtual transactions.
 * If the transaction has no splits, returns the transaction itself as a single-element array.
 * If the transaction is split, returns an array of virtual transactions (one for each split).
 */
export function expandTransaction(tx: Transaction): (Transaction & { _isVirtualSplit?: boolean })[] {
  if (!tx.splits || tx.splits.length === 0) {
    return [tx]
  }

  return tx.splits.map((split) => ({
    ...tx,
    amount: split.amount,
    categoryId: split.categoryId,
    notes: split.notes || tx.notes || undefined,
    _isVirtualSplit: true,
  }))
}

/**
 * Expands an array of transactions, replacing any split transactions with their individual virtual splits.
 */
export function expandTransactions(txs: Transaction[]): (Transaction & { _isVirtualSplit?: boolean })[] {
  return txs.flatMap(expandTransaction)
}

/**
 * Calculates split amounts in cents (integers) using the equal split mode.
 * Distributes remainder cents to the first splits to ensure the sum equals the total exactly.
 */
export function calculateEqualSplits(totalAmountCents: number, numSplits: number): number[] {
  if (numSplits <= 0) return []
  const baseAmount = Math.floor(totalAmountCents / numSplits)
  const remainder = totalAmountCents % numSplits

  return Array.from({ length: numSplits }, (_, i) => {
    return baseAmount + (i < remainder ? 1 : 0)
  })
}

/**
 * Calculates split amounts in cents (integers) using the percentage split mode.
 * Distributes rounding remainders to the last split to ensure the sum equals the total exactly.
 */
export function calculatePercentageSplits(totalAmountCents: number, percentages: number[]): number[] {
  if (percentages.length === 0) return []
  
  let accumulated = 0
  const amounts = percentages.map((pct, index) => {
    if (index === percentages.length - 1) {
      // Last split takes the exact remainder
      return totalAmountCents - accumulated
    }
    const amt = Math.round(totalAmountCents * (pct / 100))
    accumulated += amt
    return amt
  })

  return amounts
}

/**
 * Validates a list of split items against business rules.
 * Returns null if valid, or a descriptive error message if invalid.
 */
export function validateSplits(
  totalAmountCents: number,
  splits: { categoryId: string; amount: number; notes?: string }[]
): string | null {
  if (!splits || splits.length === 0) {
    return null // Not a split transaction, or splits are omitted (valid)
  }

  if (splits.length < 2) {
    return "At least two split categories are required for a split transaction."
  }

  const categoryIds = new Set<string>()
  let sum = 0

  for (const split of splits) {
    if (!split.categoryId || split.categoryId === "uncategorized") {
      return "All split items must be assigned a category."
    }

    if (split.amount <= 0) {
      return "Split amounts must be positive values greater than zero."
    }

    if (categoryIds.has(split.categoryId)) {
      return "Duplicate categories are not allowed in splits. Please choose unique categories."
    }
    categoryIds.add(split.categoryId)

    sum += split.amount
  }

  if (sum !== totalAmountCents) {
    const diff = (totalAmountCents - sum) / 100
    return `The sum of splits does not equal the total transaction amount. Difference: ${diff > 0 ? "+" : ""}${diff.toFixed(2)}.`
  }

  return null
}
