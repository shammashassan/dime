export const SUPPORTED_CURRENCIES = [
  "USD",
  "INR",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "SGD",
  "CHF",
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
