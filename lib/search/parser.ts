import type {
  ActiveFilterBadge,
  ParsedSearchQuery,
  SearchEntityType,
  SearchOperators,
} from "./types"

/**
 * Normalizes an amount string (e.g. "50", "12.50", "1,000", "5k") into integer cents/paise.
 */
export function parseAmountToCents(amountStr: string): number | null {
  if (!amountStr) return null
  const cleaned = amountStr.replace(/,/g, "").trim().toLowerCase()

  let multiplier = 100 // default decimal to cents factor
  let numStr = cleaned

  if (cleaned.endsWith("k")) {
    multiplier = 100 * 1000
    numStr = cleaned.slice(0, -1)
  } else if (cleaned.endsWith("m")) {
    multiplier = 100 * 1000000
    numStr = cleaned.slice(0, -1)
  }

  const parsedNum = parseFloat(numStr)
  if (isNaN(parsedNum)) return null

  return Math.round(parsedNum * multiplier)
}

/**
 * Resolves a date string or keyword into startDate and endDate.
 */
export function resolveDateRange(dateStr: string, referenceDate = new Date()): { startDate: Date; endDate: Date } | null {
  if (!dateStr) return null
  const key = dateStr.trim().toLowerCase()

  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const date = referenceDate.getDate()

  // Handle explicit range: YYYY-MM-DD..YYYY-MM-DD
  if (key.includes("..")) {
    const [startPart, endPart] = key.split("..")
    const d1 = new Date(`${startPart}T00:00:00.000Z`)
    const d2 = new Date(`${endPart}T23:59:59.999Z`)
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      return { startDate: d1, endDate: d2 }
    }
  }

  switch (key) {
    case "today": {
      const start = new Date(year, month, date, 0, 0, 0, 0)
      const end = new Date(year, month, date, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "yesterday": {
      const start = new Date(year, month, date - 1, 0, 0, 0, 0)
      const end = new Date(year, month, date - 1, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "this-week": {
      const day = referenceDate.getDay() // 0 = Sunday
      const diffToMonday = day === 0 ? -6 : 1 - day
      const monday = new Date(year, month, date + diffToMonday, 0, 0, 0, 0)
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999)
      return { startDate: monday, endDate: sunday }
    }
    case "last-week": {
      const day = referenceDate.getDay()
      const diffToLastMonday = (day === 0 ? -6 : 1 - day) - 7
      const monday = new Date(year, month, date + diffToLastMonday, 0, 0, 0, 0)
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999)
      return { startDate: monday, endDate: sunday }
    }
    case "this-month": {
      const start = new Date(year, month, 1, 0, 0, 0, 0)
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "last-month": {
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
      const end = new Date(year, month, 0, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "this-quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3
      const start = new Date(year, quarterStartMonth, 1, 0, 0, 0, 0)
      const end = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "last-quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3 - 3
      const start = new Date(year, quarterStartMonth, 1, 0, 0, 0, 0)
      const end = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "this-year": {
      const start = new Date(year, 0, 1, 0, 0, 0, 0)
      const end = new Date(year, 11, 31, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "last-year": {
      const start = new Date(year - 1, 0, 1, 0, 0, 0, 0)
      const end = new Date(year - 1, 11, 31, 23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    case "last-30-days": {
      const start = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { startDate: start, endDate: referenceDate }
    }
    case "last-7-days": {
      const start = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      return { startDate: start, endDate: referenceDate }
    }
    default: {
      // Single explicit date YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const [y, m, d] = key.split("-").map(Number)
        const start = new Date(y, m - 1, d, 0, 0, 0, 0)
        const end = new Date(y, m - 1, d, 23, 59, 59, 999)
        if (!isNaN(start.getTime())) {
          return { startDate: start, endDate: end }
        }
      }
      return null
    }
  }
}

/**
 * Tokenizes a query string, respecting double quotes.
 */
function tokenizeQuery(rawQuery: string): string[] {
  const tokens: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < rawQuery.length; i++) {
    const char = rawQuery[i]
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if (char === " " && !inQuotes) {
      if (current.trim().length > 0) {
        tokens.push(current.trim())
        current = ""
      }
    } else {
      current += char
    }
  }

  if (current.trim().length > 0) {
    tokens.push(current.trim())
  }

  return tokens
}

/**
 * Strips outer quotes from a string value if present.
 */
function stripQuotes(str: string): string {
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    return str.slice(1, -1).trim()
  }
  return str.trim()
}

/**
 * Main parser: transforms a free-form search query string with operators into structured ParsedSearchQuery.
 */
export function parseSearchQuery(
  rawQuery: string,
  referenceDate = new Date()
): ParsedSearchQuery {
  if (!rawQuery || typeof rawQuery !== "string") {
    return {
      rawQuery: "",
      textQuery: "",
      operators: {},
      activeBadges: [],
    }
  }

  const tokens = tokenizeQuery(rawQuery)
  const operators: SearchOperators = {}
  const activeBadges: ActiveFilterBadge[] = []
  const remainingTokens: string[] = []

  const entityTypeSet = new Set<SearchEntityType>()

  for (const token of tokens) {
    let matched = false

    // 1. Check Amount Inequality Operators (amount>100, amount>=100, amount<100, amount<=100, amount=100)
    const amountRegex = /^amount(>=|<=|>|<|=)(.+)$/i
    const amountMatch = token.match(amountRegex)
    if (amountMatch) {
      const op = amountMatch[1]
      const valStr = amountMatch[2]
      const cents = parseAmountToCents(valStr)

      if (cents !== null) {
        matched = true
        if (op === ">") {
          operators.minAmount = cents + 1
          activeBadges.push({ key: "minAmount", label: "Min Amount", value: `> ${(cents / 100).toFixed(2)}` })
        } else if (op === ">=") {
          operators.minAmount = cents
          activeBadges.push({ key: "minAmount", label: "Min Amount", value: `>= ${(cents / 100).toFixed(2)}` })
        } else if (op === "<") {
          operators.maxAmount = Math.max(0, cents - 1)
          activeBadges.push({ key: "maxAmount", label: "Max Amount", value: `< ${(cents / 100).toFixed(2)}` })
        } else if (op === "<=") {
          operators.maxAmount = cents
          activeBadges.push({ key: "maxAmount", label: "Max Amount", value: `<= ${(cents / 100).toFixed(2)}` })
        } else if (op === "=") {
          operators.exactAmount = cents
          activeBadges.push({ key: "exactAmount", label: "Amount", value: `= ${(cents / 100).toFixed(2)}` })
        }
        continue
      }
    }

    // 2. Check Key:Value Operators
    const colonIndex = token.indexOf(":")
    if (colonIndex > 0) {
      const key = token.slice(0, colonIndex).toLowerCase()
      const rawVal = token.slice(colonIndex + 1)
      const val = stripQuotes(rawVal)

      if (val.length > 0) {
        switch (key) {
          case "merchant":
          case "payee": {
            operators.merchant = val
            activeBadges.push({ key: "merchant", label: "Merchant", value: val })
            matched = true
            break
          }
          case "category": {
            operators.category = val
            activeBadges.push({ key: "category", label: "Category", value: val })
            matched = true
            break
          }
          case "wallet":
          case "account": {
            operators.wallet = val
            activeBadges.push({ key: "wallet", label: "Wallet", value: val })
            matched = true
            break
          }
          case "person":
          case "contact": {
            operators.person = val
            activeBadges.push({ key: "person", label: "Person", value: val })
            matched = true
            break
          }
          case "tag": {
            operators.tag = val
            activeBadges.push({ key: "tag", label: "Tag", value: val })
            matched = true
            break
          }
          case "currency": {
            const curr = val.toUpperCase()
            operators.currency = curr
            activeBadges.push({ key: "currency", label: "Currency", value: curr })
            matched = true
            break
          }
          case "type": {
            const lowerType = val.toLowerCase()
            if (lowerType === "income" || lowerType === "expense" || lowerType === "transfer") {
              operators.type = lowerType
              activeBadges.push({ key: "type", label: "Type", value: lowerType })
              matched = true
            }
            break
          }
          case "status": {
            const lowerStatus = val.toLowerCase()
            operators.status = lowerStatus
            activeBadges.push({ key: "status", label: "Status", value: lowerStatus })
            matched = true
            break
          }
          case "amount": {
            const cents = parseAmountToCents(val)
            if (cents !== null) {
              operators.exactAmount = cents
              activeBadges.push({ key: "exactAmount", label: "Amount", value: `${(cents / 100).toFixed(2)}` })
              matched = true
            }
            break
          }
          case "date": {
            const range = resolveDateRange(val, referenceDate)
            if (range) {
              operators.startDate = range.startDate
              operators.endDate = range.endDate
              activeBadges.push({ key: "date", label: "Date", value: val })
              matched = true
            }
            break
          }
          case "entity": {
            const lowerEntity = val.toLowerCase() as SearchEntityType
            entityTypeSet.add(lowerEntity)
            activeBadges.push({ key: "entity", label: "Entity", value: lowerEntity })
            matched = true
            break
          }
          case "frequency":
          case "recurring": {
            const lowerFreq = val.toLowerCase()
            if (["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"].includes(lowerFreq)) {
              operators.frequency = lowerFreq
              entityTypeSet.add("recurring")
              activeBadges.push({ key: "frequency", label: "Recurring", value: lowerFreq })
              matched = true
            }
            break
          }
          case "loan": {
            // e.g. loan:active, loan:paid, loan:overdue
            entityTypeSet.add("loan")
            const lower = val.toLowerCase()
            operators.status = lower === "paid" ? "fully_repaid" : lower
            activeBadges.push({ key: "loan", label: "Loan", value: lower })
            matched = true
            break
          }
          case "bill": {
            // e.g. bill:overdue, bill:paid, bill:pending
            entityTypeSet.add("recurring")
            operators.kind = "bill"
            operators.status = val.toLowerCase()
            activeBadges.push({ key: "bill", label: "Bill", value: val.toLowerCase() })
            matched = true
            break
          }
          case "subscription": {
            // e.g. subscription:active, subscription:cancelled
            entityTypeSet.add("recurring")
            operators.kind = "subscription"
            operators.status = val.toLowerCase()
            activeBadges.push({ key: "subscription", label: "Subscription", value: val.toLowerCase() })
            matched = true
            break
          }
          case "goal": {
            // e.g. goal:active, goal:completed
            entityTypeSet.add("goal")
            operators.status = val.toLowerCase()
            activeBadges.push({ key: "goal", label: "Goal", value: val.toLowerCase() })
            matched = true
            break
          }
          case "investment": {
            // e.g. investment:stocks, investment:crypto, investment:etf
            entityTypeSet.add("investment")
            const lower = val.toLowerCase()
            const assetMap: Record<string, string> = {
              stocks: "stock",
              stock: "stock",
              crypto: "crypto",
              etf: "etf",
              gold: "commodity",
              mutual_fund: "mutual_fund",
              bond: "bond",
            }
            operators.assetClass = assetMap[lower] || lower
            activeBadges.push({ key: "investment", label: "Investment", value: val })
            matched = true
            break
          }
          case "asset": {
            // e.g. asset:real-estate, asset:gold
            entityTypeSet.add("asset")
            operators.assetClass = val.toLowerCase().replace("-", "_")
            activeBadges.push({ key: "asset", label: "Asset", value: val })
            matched = true
            break
          }
          case "liability": {
            // e.g. liability:mortgage
            entityTypeSet.add("liability")
            operators.assetClass = val.toLowerCase().replace("-", "_")
            activeBadges.push({ key: "liability", label: "Liability", value: val })
            matched = true
            break
          }
          case "budget": {
            entityTypeSet.add("budget")
            if (val.toLowerCase() === "active") {
              operators.status = "active"
            }
            activeBadges.push({ key: "budget", label: "Budget", value: val })
            matched = true
            break
          }
          case "transaction": {
            entityTypeSet.add("transaction")
            if (val.toLowerCase() === "split") {
              operators.isSplit = true
              activeBadges.push({ key: "transaction", label: "Transaction", value: "split" })
            }
            matched = true
            break
          }
          case "rule": {
            if (val.toLowerCase() === "enabled") {
              operators.status = "active"
              activeBadges.push({ key: "rule", label: "Rule", value: "enabled" })
              matched = true
            }
            break
          }
        }
      }
    }

    if (!matched) {
      remainingTokens.push(stripQuotes(token))
    }
  }

  if (entityTypeSet.size > 0) {
    operators.entityTypes = Array.from(entityTypeSet)
  }

  const textQuery = remainingTokens.join(" ").trim()

  return {
    rawQuery,
    textQuery,
    operators,
    activeBadges,
  }
}
