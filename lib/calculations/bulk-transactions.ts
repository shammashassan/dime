import type { Transaction } from "@/types"

/**
 * Calculates net balance changes per wallet when deleting a batch of transactions.
 * - For an expense: the wallet is credited (+amount) because the expense is undone.
 * - For an income: the wallet is debited (-amount) because the income is undone.
 * - For a transfer:
 *    - debit leg (source): credited (+amount)
 *    - credit leg (destination): debited (-amount)
 */
export function calculateBulkDeleteBalanceReversions(
  transactions: Array<
    Pick<Transaction, "_id" | "walletId" | "type" | "amount" | "currency"> & {
      transferType?: "debit" | "credit"
      linkedTransactionId?: string
    }
  >
): Record<string, number> {
  const walletChanges: Record<string, number> = {}

  for (const tx of transactions) {
    if (!tx.walletId) continue

    let delta = 0
    if (tx.type === "expense") {
      delta = tx.amount // Revert expense -> add money back
    } else if (tx.type === "income") {
      delta = -tx.amount // Revert income -> remove money
    } else if (tx.type === "transfer") {
      if (tx.transferType === "credit") {
        delta = -tx.amount // Revert received transfer -> remove money
      } else {
        delta = tx.amount // Revert sent transfer -> add money back
      }
    }

    walletChanges[tx.walletId] = (walletChanges[tx.walletId] || 0) + delta
  }

  return walletChanges
}

/**
 * Calculates balance changes when moving non-transfer transactions to a new target wallet.
 * Reverts the balance on each original wallet and applies the balance impact on the target wallet.
 */
export function calculateBulkWalletMoveBalanceChanges(
  transactions: Array<
    Pick<Transaction, "_id" | "walletId" | "type" | "amount" | "currency">
  >,
  targetWalletId: string,
  targetCurrency: string,
  rates?: Record<string, number>
): {
  revertedWalletChanges: Record<string, number>
  targetWalletNetChange: number
  processedTransactionAmounts: Array<{ id: string; newAmount: number }>
} {
  const revertedWalletChanges: Record<string, number> = {}
  let targetWalletNetChange = 0
  const processedTransactionAmounts: Array<{ id: string; newAmount: number }> = []

  for (const tx of transactions) {
    if (tx.type === "transfer") continue // Transfers cannot be simply moved to another wallet
    if (tx.walletId === targetWalletId) continue // Already in target wallet

    const txIdStr = tx._id ? tx._id.toString() : ""

    // 1. Revert original wallet balance
    const revertDelta = tx.type === "expense" ? tx.amount : -tx.amount
    revertedWalletChanges[tx.walletId] =
      (revertedWalletChanges[tx.walletId] || 0) + revertDelta

    // 2. Compute amount in target currency
    let targetAmount = tx.amount
    if (tx.currency && tx.currency !== targetCurrency && rates) {
      const fromRate = rates[tx.currency.toUpperCase()] || 1
      const toRate = rates[targetCurrency.toUpperCase()] || 1
      // Convert via base USD: amount in USD = amount / fromRate, then * toRate
      targetAmount = Math.round((tx.amount / fromRate) * toRate)
    }

    processedTransactionAmounts.push({
      id: txIdStr,
      newAmount: targetAmount,
    })

    // 3. Apply target wallet impact
    const targetDelta = tx.type === "income" ? targetAmount : -targetAmount
    targetWalletNetChange += targetDelta
  }

  return {
    revertedWalletChanges,
    targetWalletNetChange,
    processedTransactionAmounts,
  }
}

/**
 * Merges and normalizes tags for bulk addition, removing duplicates and whitespace.
 */
export function mergeTags(existingTags: string[] = [], newTags: string[] = []): string[] {
  const cleanExisting = existingTags.map((t) => t.trim().toLowerCase()).filter(Boolean)
  const cleanNew = newTags.map((t) => t.trim().toLowerCase()).filter(Boolean)

  const set = new Set<string>([...cleanExisting, ...cleanNew])
  return Array.from(set)
}
