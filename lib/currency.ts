import { getCollection } from "@/lib/db/collections"
import { ExchangeRate } from "@/types"

const FREE_EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest"

export async function getExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  const base = baseCurrency.toUpperCase()
  const exchangeRatesColl = await getCollection<ExchangeRate>("exchange_rates")

  // Check if we have a cached version that is less than 1 hour old
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const cached = await exchangeRatesColl.findOne({
    base,
    updatedAt: { $gte: oneHourAgo }
  })

  if (cached) {
    return cached.rates
  }

  // Fetch new rates
  try {
    const res = await fetch(`${FREE_EXCHANGE_RATE_API}/${base}`, {
      next: { revalidate: 3600 } // Next.js level caching as fallback
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rates for ${base}`)
    }

    const data = await res.json()
    const rates = data.rates as Record<string, number>

    if (!rates) {
      throw new Error(`Invalid response format from exchange rate API for ${base}`)
    }

    // Cache the rates
    await exchangeRatesColl.updateOne(
      { base },
      {
        $set: {
          rates,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return rates
  } catch (err) {
    console.error("Exchange rate fetch error:", err)
    // Return stale cache if available as fallback
    const stale = await exchangeRatesColl.findOne({ base })
    if (stale) {
      return stale.rates
    }
    // Hard fallback: return 1.0 for same, and empty object or basic values
    return { [base]: 1.0 }
  }
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()

  if (fromUpper === toUpper) {
    return amount
  }

  const rates = await getExchangeRates(fromUpper)
  const rate = rates[toUpper]

  if (!rate) {
    // If not found in base rates, try inverse or fetch base = to
    const targetRates = await getExchangeRates(toUpper)
    const inverseRate = targetRates[fromUpper]
    if (inverseRate) {
      return Math.round(amount / inverseRate)
    }
    console.warn(`No exchange rate found from ${fromUpper} to ${toUpper}. Using 1:1 fallback.`)
    return amount
  }

  return Math.round(amount * rate)
}
