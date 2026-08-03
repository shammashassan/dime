"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { investmentTransactionSchema, InvestmentTransactionInput } from "@/lib/validations/investment.schema"
import { InvestmentTransaction, InvestmentPrice } from "@/types"
import { getFinancialScope } from "@/lib/scope"
import { revalidatePath, updateTag } from "next/cache"
import { ObjectId } from "mongodb"

export async function recordTransaction(input: InvestmentTransactionInput) {
  await requireApprovedUser()
  const validated = investmentTransactionSchema.parse(input)

  const scope = await getFinancialScope()

  const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")

  // Using symbol and walletId as a proxy for holdingId
  const holdingId = `${validated.walletId}_${validated.symbol}`

  const priceInCents = Math.round(validated.price * 100)
  const feesInCents = Math.round((validated.fees || 0) * 100)
  const dividendAmountInCents = validated.dividendAmount ? Math.round(validated.dividendAmount * 100) : undefined
  const grossAmountInCents = Math.round(validated.quantity * priceInCents)

  const tx: Omit<InvestmentTransaction, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    walletId: validated.walletId,
    holdingId,
    symbol: validated.symbol,
    assetType: validated.assetType,
    type: validated.type,
    quantity: validated.quantity,
    price: priceInCents,
    grossAmount: grossAmountInCents,
    fees: feesInCents,
    cashImpact: 0, // Should be calculated appropriately based on type
    dividendAmount: dividendAmountInCents,
    date: validated.date,
    notes: validated.notes,
    metadata: {
      ...validated.metadata,
      ...(validated.exchange ? { exchange: validated.exchange } : {}),
      ...(validated.isin ? { isin: validated.isin } : {}),
      ...(validated.cusip ? { cusip: validated.cusip } : {}),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Basic cash impact logic
  if (tx.type === "buy") {
    tx.cashImpact = -(tx.grossAmount + tx.fees)
  } else if (tx.type === "sell") {
    tx.cashImpact = tx.grossAmount - tx.fees
  } else if (tx.type === "cash_dividend" || tx.type === "interest") {
    tx.cashImpact = (tx.dividendAmount || 0) - tx.fees
  } else if (tx.type === "fee") {
    tx.cashImpact = -tx.fees
  }

  const result = await transactionsColl.insertOne(tx as InvestmentTransaction)

  updateTag("investments")
  revalidatePath("/investments")
  return { success: true, id: result.insertedId.toString() }
}

export async function recordPriceSnapshot(holdingId: string, price: number, date: Date = new Date()) {
  await requireApprovedUser()
  const scope = await getFinancialScope() // For auth check side-effect

  const pricesColl = await getCollection<InvestmentPrice>("investment_prices")
  const priceInCents = Math.round(price * 100)

  const snapshot: Omit<InvestmentPrice, "_id"> = {
    holdingId,
    price: priceInCents,
    date,
    source: "manual",
    createdAt: new Date(),
  }

  const result = await pricesColl.insertOne(snapshot as InvestmentPrice)

  updateTag("investments")
  revalidatePath("/investments")
  return { success: true, id: result.insertedId.toString() }
}
