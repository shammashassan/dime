import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { ObjectId } from "mongodb"
import {
  calculateBulkDeleteBalanceReversions,
  calculateBulkWalletMoveBalanceChanges,
  mergeTags,
} from "../bulk-transactions"

describe("Bulk Transactions Calculation Engine", () => {
  const wallet1 = new ObjectId().toString()
  const wallet2 = new ObjectId().toString()
  const targetWallet = new ObjectId().toString()

  it("calculates net balance reversions accurately for bulk delete", () => {
    const txs = [
      {
        _id: new ObjectId(),
        walletId: wallet1,
        type: "expense" as const,
        amount: 2500, // $25.00 expense -> revert adds +2500
        currency: "USD",
      },
      {
        _id: new ObjectId(),
        walletId: wallet1,
        type: "income" as const,
        amount: 5000, // $50.00 income -> revert subtracts -5000
        currency: "USD",
      },
      {
        _id: new ObjectId(),
        walletId: wallet2,
        type: "expense" as const,
        amount: 1200, // $12.00 expense -> revert adds +1200
        currency: "USD",
      },
      {
        _id: new ObjectId(),
        walletId: wallet1,
        type: "transfer" as const,
        amount: 3000,
        currency: "USD",
        transferType: "debit" as const, // sender -> revert adds +3000
      },
      {
        _id: new ObjectId(),
        walletId: wallet2,
        type: "transfer" as const,
        amount: 3000,
        currency: "USD",
        transferType: "credit" as const, // receiver -> revert subtracts -3000
      },
    ]

    const result = calculateBulkDeleteBalanceReversions(txs)

    // wallet1: +2500 - 5000 + 3000 = +500
    assert.strictEqual(result[wallet1], 500)
    // wallet2: +1200 - 3000 = -1800
    assert.strictEqual(result[wallet2], -1800)
  })

  it("calculates wallet balance changes when moving transactions in same currency", () => {
    const txs = [
      {
        _id: new ObjectId(),
        walletId: wallet1,
        type: "expense" as const,
        amount: 4000, // expense in wallet1 -> revert +4000 to wallet1, apply -4000 to targetWallet
        currency: "USD",
      },
      {
        _id: new ObjectId(),
        walletId: wallet2,
        type: "income" as const,
        amount: 1500, // income in wallet2 -> revert -1500 to wallet2, apply +1500 to targetWallet
        currency: "USD",
      },
    ]

    const result = calculateBulkWalletMoveBalanceChanges(
      txs,
      targetWallet,
      "USD"
    )

    assert.strictEqual(result.revertedWalletChanges[wallet1], 4000)
    assert.strictEqual(result.revertedWalletChanges[wallet2], -1500)
    // targetWallet: -4000 (expense) + 1500 (income) = -2500
    assert.strictEqual(result.targetWalletNetChange, -2500)
    assert.strictEqual(result.processedTransactionAmounts.length, 2)
  })

  it("converts amount with exchange rates when moving between different currencies", () => {
    const rates = {
      USD: 1,
      EUR: 0.9,
    }

    const txs = [
      {
        _id: new ObjectId(),
        walletId: wallet1,
        type: "expense" as const,
        amount: 10000, // 100 USD
        currency: "USD",
      },
    ]

    // Moving from USD wallet to EUR wallet: 100 USD * 0.9 = 90 EUR (9000 cents)
    const result = calculateBulkWalletMoveBalanceChanges(
      txs,
      targetWallet,
      "EUR",
      rates
    )

    assert.strictEqual(result.revertedWalletChanges[wallet1], 10000)
    assert.strictEqual(result.targetWalletNetChange, -9000)
    assert.strictEqual(result.processedTransactionAmounts[0].newAmount, 9000)
  })

  it("merges and deduplicates tags cleanly", () => {
    const existing = ["food", "TRAVEL", " groceries "]
    const newTags = ["Dining", "travel", "Dinner "]

    const merged = mergeTags(existing, newTags)
    assert.deepStrictEqual(merged.sort(), [
      "dining",
      "dinner",
      "food",
      "groceries",
      "travel",
    ])
  })
})
