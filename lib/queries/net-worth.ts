import { cache } from "react"
import { getAllWalletsIncludingArchived } from "./wallets"
import { getLoans, getActiveBaseCurrency } from "./loans"
import { getAssetsAndValuationsForScope } from "./assets"
import { getPreferences } from "./preferences"
import { getPortfolioHoldings } from "./investments"
import { calculateCurrentNetWorth } from "@/lib/calculations/net-worth"
import { getCurrencyConverter } from "@/lib/currency"

export interface NetWorthSummaryData {
  currentNetWorth: number
}

export const getNetWorthSummary = cache(
  async (userId: string): Promise<NetWorthSummaryData> => {
    const [wallets, loans, { assets }, baseCurrency, prefs, investmentHoldings] = await Promise.all([
      getAllWalletsIncludingArchived(userId),
      getLoans(),
      getAssetsAndValuationsForScope(),
      getActiveBaseCurrency(),
      getPreferences(userId),
      getPortfolioHoldings(),
    ])

    const targetCurrency = baseCurrency || prefs.defaultCurrency || "USD"

    const sourceCurrencies = Array.from(
      new Set([
        ...wallets.map((w) => w.currency),
        ...loans.map((l) => l.currency),
        ...assets.map((a) => a.currency),
      ])
    )

    const convert = await getCurrencyConverter(targetCurrency, sourceCurrencies)

    const breakdown = calculateCurrentNetWorth({
      wallets,
      loans,
      assets,
      investmentHoldings,
      convert,
    })

    return {
      currentNetWorth: breakdown.netWorth,
    }
  }
)
