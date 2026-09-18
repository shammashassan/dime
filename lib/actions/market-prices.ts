"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getPortfolioHoldings } from "@/lib/queries/investments"
import { syncHoldingPrices } from "@/lib/market-prices"
import { searchMarketTickers, type TickerSearchResult } from "@/lib/ticker-search"
import { revalidatePath, updateTag } from "next/cache"

export async function syncMarketPricesAction(): Promise<{
  success: boolean
  updatedCount: number
  symbols?: string[]
  error?: string
}> {
  try {
    await requireApprovedUser()

    const holdings = await getPortfolioHoldings()
    if (holdings.length === 0) {
      return { success: true, updatedCount: 0 }
    }

    const holdingInputs = holdings.map((h) => ({
      holdingId: h._id.toString(),
      symbol: h.symbol,
      assetType: h.assetType,
      currency: h.currency,
    }))

    const priceMap = await syncHoldingPrices(holdingInputs)

    updateTag("investments")
    updateTag("net-worth")
    updateTag("dashboard")
    revalidatePath("/investments")
    revalidatePath("/net-worth")
    revalidatePath("/dashboard")

    const updatedSymbols = holdings
      .filter((h) => priceMap.has(h._id.toString()))
      .map((h) => h.symbol)

    return { success: true, updatedCount: priceMap.size, symbols: updatedSymbols }
  } catch (err: any) {
    return {
      success: false,
      updatedCount: 0,
      error: err.message || "Failed to synchronize market prices",
    }
  }
}

export async function searchMarketTickersAction(
  query: string
): Promise<{ success: boolean; results: TickerSearchResult[]; error?: string }> {
  try {
    await requireApprovedUser()
    const results = await searchMarketTickers(query)
    return { success: true, results }
  } catch (err: any) {
    return {
      success: false,
      results: [],
      error: err.message || "Failed to search market tickers",
    }
  }
}
