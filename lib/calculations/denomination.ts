/**
 * Currency Denomination Utilities for Dime
 *
 * Formats financial values into compact denominations based on currency conventions:
 * - Indian Rupee (INR): Thousands (k), Lakhs (L/l), Crores (Cr/cr)
 * - Western & Global Currencies (USD, EUR, GBP, CAD, AUD, etc.): Thousands (k/K), Millions (m/M), Billions (b/B)
 */

export interface DenominationOptions {
  /** Include the currency symbol (e.g. ₹2L, $2M). Default: true */
  includeSymbol?: boolean
  /** Use lowercase notation for denomination suffix (e.g. 2k, 2cr, 2l, 2m). Default: true */
  lowercase?: boolean
  /** Maximum number of decimal places for fractional values (e.g. 2.5k). Default: 1 */
  maxDecimals?: number
  /** Whether to prefix positive amounts with '+' (e.g. +$2k). Default: false */
  showPositiveSign?: boolean
  /** Add a space between currency symbol and amount. Default: false */
  spaceSymbol?: boolean
}

/**
 * Currency symbol mapping for major supported currencies
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  SGD: "S$",
  CHF: "CHF ",
}

/**
 * Returns the symbol for a given currency code (e.g. "USD" -> "$", "INR" -> "₹")
 */
export function getCurrencySymbol(currency: string = "USD"): string {
  const upper = currency.toUpperCase()
  if (CURRENCY_SYMBOLS[upper]) {
    return CURRENCY_SYMBOLS[upper]
  }

  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: upper,
    }).formatToParts(0)
    const currencyPart = parts.find((p) => p.type === "currency")
    return currencyPart ? currencyPart.value : upper
  } catch {
    return upper
  }
}

/**
 * Checks if currency follows the South Asian numbering system (Lakhs & Crores)
 */
export function isLakhCroreCurrency(currency: string = "USD"): boolean {
  const upper = currency.toUpperCase()
  // INR and regional South Asian currencies that convention uses Lakh / Crore
  return upper === "INR" || upper === "NPR" || upper === "PKR" || upper === "BDT"
}

/**
 * Format a raw major currency number (e.g. 2000 -> "2k", 200000 INR -> "2l", 20000000 INR -> "2cr")
 */
export function formatDenomination(
  amount: number,
  currency: string = "USD",
  options: DenominationOptions = {}
): string {
  const {
    includeSymbol = true,
    lowercase = true,
    maxDecimals = 1,
    showPositiveSign = false,
    spaceSymbol = false,
  } = options

  if (isNaN(amount) || !isFinite(amount)) {
    return "0"
  }

  const isNegative = amount < 0
  const isPositive = amount > 0
  const abs = Math.abs(amount)
  const isLakhCrore = isLakhCroreCurrency(currency)
  const symbol = includeSymbol ? getCurrencySymbol(currency) : ""
  const symbolGap = spaceSymbol && symbol ? " " : ""

  let value = abs
  let suffix = ""

  if (isLakhCrore) {
    // 1 Crore = 10,000,000 (100 Lakhs)
    if (abs >= 10_000_000) {
      value = abs / 10_000_000
      suffix = lowercase ? "cr" : "Cr"
    }
    // 1 Lakh = 100,000
    else if (abs >= 100_000) {
      value = abs / 100_000
      suffix = lowercase ? "l" : "L"
    }
    // 1 Thousand = 1,000
    else if (abs >= 1_000) {
      value = abs / 1_000
      suffix = lowercase ? "k" : "K"
    }
  } else {
    // Trillions = 1,000,000,000,000
    if (abs >= 1_000_000_000_000) {
      value = abs / 1_000_000_000_000
      suffix = lowercase ? "t" : "T"
    }
    // Billions = 1,000,000,000
    else if (abs >= 1_000_000_000) {
      value = abs / 1_000_000_000
      suffix = lowercase ? "b" : "B"
    }
    // Millions = 1,000,000
    else if (abs >= 1_000_000) {
      value = abs / 1_000_000
      suffix = lowercase ? "m" : "M"
    }
    // Thousands = 1,000
    else if (abs >= 1_000) {
      value = abs / 1_000
      suffix = lowercase ? "k" : "K"
    }
  }

  // Format value: if integer, show no decimals. If fractional, show up to maxDecimals
  let formattedNumber: string
  if (suffix === "") {
    // Numbers under 1,000: if whole, no decimal. If fraction, up to maxDecimals or 2
    formattedNumber = Number.isInteger(value)
      ? value.toString()
      : value.toFixed(Math.min(maxDecimals, 2)).replace(/\.?0+$/, "")
  } else {
    const factor = Math.pow(10, maxDecimals)
    const rounded = Math.round(value * factor) / factor
    formattedNumber = rounded.toString()
  }

  // Prefix handling: + or -
  let sign = ""
  if (isNegative) {
    sign = "-"
  } else if (isPositive && showPositiveSign) {
    sign = "+"
  }

  // Assembly: sign + symbol + gap + number + suffix (e.g. +$2k, -₹2.5L, -$500)
  return `${sign}${symbol}${symbolGap}${formattedNumber}${suffix}`
}

/**
 * Format currency amount stored in cents (Dime standard: 1 USD = 100 cents)
 * Converts cents to major unit before applying denomination formatting.
 *
 * @param amountInCents - Financial amount stored in cents (e.g. 200000 = $2,000)
 * @param currency - 3-letter currency code (e.g. "USD", "INR", "EUR")
 * @param options - Denomination options (lowercase, maxDecimals, includeSymbol, etc.)
 */
export function formatDenominatedCurrency(
  amountInCents: number,
  currency: string = "USD",
  options: DenominationOptions = {}
): string {
  const amountInMajor = amountInCents / 100
  return formatDenomination(amountInMajor, currency, options)
}
