import type {
  CostBasisMethod,
  InvestmentTransaction,
  RealizedTaxEvent,
  TaxLot,
  TaxScheduleSummary,
} from "@/types"

/**
 * Builds tax lots and matches sales to open lots according to the chosen cost basis strategy.
 *
 * @param transactions All investment transactions (sorted or unsorted)
 * @param method Cost basis method: "fifo" | "lifo" | "hifo" | "average_cost"
 * @param targetSymbol Optional symbol to filter processing
 */
export function buildTaxLots(
  transactions: InvestmentTransaction[],
  method: CostBasisMethod = "fifo",
  targetSymbol?: string
): {
  openLots: TaxLot[]
  realizedEvents: RealizedTaxEvent[]
} {
  const filtered = transactions.filter(
    (t) => !targetSymbol || t.symbol.toUpperCase() === targetSymbol.toUpperCase()
  )

  // Chronological sort
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const openLotsMap = new Map<string, TaxLot[]>() // key: `${walletId}_${symbol}`
  const realizedEvents: RealizedTaxEvent[] = []

  let eventCounter = 1

  for (const tx of sorted) {
    const key = `${tx.walletId}_${tx.symbol.toUpperCase()}`
    const lots = openLotsMap.get(key) || []

    if (tx.type === "buy" || tx.type === "reinvested_dividend") {
      if (tx.quantity > 0) {
        const costBasisCents = Math.round(tx.price * tx.quantity + tx.fees)
        const newLot: TaxLot = {
          id: `lot_${tx._id?.toString() || Math.random().toString(36).slice(2)}`,
          buyTransactionId: tx._id?.toString() || "",
          date: new Date(tx.date),
          symbol: tx.symbol.toUpperCase(),
          walletId: tx.walletId,
          quantity: tx.quantity,
          remainingQuantity: tx.quantity,
          price: tx.price,
          fees: tx.fees,
          totalCostBasis: costBasisCents,
          remainingCostBasis: costBasisCents,
          status: "open",
        }
        lots.push(newLot)
        openLotsMap.set(key, lots)
      }
    } else if (tx.type === "sell") {
      let qtyToSell = tx.quantity
      if (qtyToSell <= 0 || lots.length === 0) continue

      const sellDate = new Date(tx.date)
      const sellPrice = tx.price

      if (method === "average_cost") {
        // Average Cost: compute current pool average cost basis per share
        const activeLots = lots.filter((l) => l.remainingQuantity > 0)
        const totalRemainingQty = activeLots.reduce((sum, l) => sum + l.remainingQuantity, 0)
        const totalRemainingCost = activeLots.reduce((sum, l) => sum + l.remainingCostBasis, 0)

        const avgCostPerShare = totalRemainingQty > 0 ? totalRemainingCost / totalRemainingQty : sellPrice

        // Deplete oldest lots first for record-keeping while applying average cost per share
        activeLots.sort((a, b) => a.date.getTime() - b.date.getTime())

        for (const lot of activeLots) {
          if (qtyToSell <= 0) break

          const matchedQty = Math.min(lot.remainingQuantity, qtyToSell)
          const proceedsCents = Math.round(matchedQty * sellPrice)
          const costBasisCents = Math.round(matchedQty * avgCostPerShare)
          const realizedGainCents = proceedsCents - costBasisCents

          const holdingPeriodDays = Math.max(
            0,
            Math.round((sellDate.getTime() - lot.date.getTime()) / (24 * 3600 * 1000))
          )

          realizedEvents.push({
            id: `evt_${tx._id?.toString() || ""}_${eventCounter++}`,
            symbol: tx.symbol.toUpperCase(),
            walletId: tx.walletId,
            sellTransactionId: tx._id?.toString() || "",
            buyDate: new Date(lot.date),
            sellDate,
            quantity: matchedQty,
            buyPrice: Math.round(avgCostPerShare),
            sellPrice,
            proceedsCents,
            costBasisCents,
            realizedGainCents,
            holdingPeriodDays,
            term: holdingPeriodDays > 365 ? "long_term" : "short_term",
            costBasisMethod: "average_cost",
          })

          lot.remainingQuantity -= matchedQty
          lot.remainingCostBasis = Math.max(0, Math.round(lot.remainingQuantity * avgCostPerShare))
          lot.status = lot.remainingQuantity <= 1e-6 ? "closed" : "partially_closed"

          qtyToSell -= matchedQty
        }
      } else {
        // Sort according to FIFO, LIFO, or HIFO
        const activeLots = lots.filter((l) => l.remainingQuantity > 0)

        if (method === "fifo") {
          activeLots.sort((a, b) => a.date.getTime() - b.date.getTime())
        } else if (method === "lifo") {
          activeLots.sort((a, b) => b.date.getTime() - a.date.getTime())
        } else if (method === "hifo") {
          activeLots.sort((a, b) => {
            if (b.price !== a.price) return b.price - a.price // highest price first
            return a.date.getTime() - b.date.getTime() // tie-break earliest
          })
        }

        for (const lot of activeLots) {
          if (qtyToSell <= 0) break

          const matchedQty = Math.min(lot.remainingQuantity, qtyToSell)
          const unitCost = lot.totalCostBasis / lot.quantity
          const costBasisCents = Math.round(matchedQty * unitCost)
          const proceedsCents = Math.round(matchedQty * sellPrice)
          const realizedGainCents = proceedsCents - costBasisCents

          const holdingPeriodDays = Math.max(
            0,
            Math.round((sellDate.getTime() - lot.date.getTime()) / (24 * 3600 * 1000))
          )

          realizedEvents.push({
            id: `evt_${tx._id?.toString() || ""}_${eventCounter++}`,
            symbol: tx.symbol.toUpperCase(),
            walletId: tx.walletId,
            sellTransactionId: tx._id?.toString() || "",
            buyDate: new Date(lot.date),
            sellDate,
            quantity: matchedQty,
            buyPrice: Math.round(unitCost),
            sellPrice,
            proceedsCents,
            costBasisCents,
            realizedGainCents,
            holdingPeriodDays,
            term: holdingPeriodDays > 365 ? "long_term" : "short_term",
            costBasisMethod: method,
          })

          lot.remainingQuantity -= matchedQty
          lot.remainingCostBasis = Math.max(0, lot.remainingCostBasis - costBasisCents)
          lot.status = lot.remainingQuantity <= 1e-6 ? "closed" : "partially_closed"

          qtyToSell -= matchedQty
        }
      }

      openLotsMap.set(key, lots)
    } else if (tx.type === "stock_split") {
      const splitRatio = tx.quantity
      if (splitRatio > 0) {
        for (const lot of lots) {
          lot.quantity *= splitRatio
          lot.remainingQuantity *= splitRatio
          lot.price /= splitRatio
        }
      }
    } else if (tx.type === "reverse_split") {
      const reverseRatio = tx.quantity
      if (reverseRatio > 0) {
        for (const lot of lots) {
          lot.quantity /= reverseRatio
          lot.remainingQuantity /= reverseRatio
          lot.price *= reverseRatio
        }
      }
    }
  }

  // Collect all currently open or partially closed lots
  const allOpenLots: TaxLot[] = []
  for (const lots of openLotsMap.values()) {
    for (const lot of lots) {
      if (lot.remainingQuantity > 1e-6) {
        allOpenLots.push(lot)
      }
    }
  }

  // Sort open lots by date DESC
  allOpenLots.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Sort realized events by sell date DESC
  realizedEvents.sort((a, b) => b.sellDate.getTime() - a.sellDate.getTime())

  return {
    openLots: allOpenLots,
    realizedEvents,
  }
}

/**
 * Calculates a complete Capital Gains tax schedule summary by tax year and term (STCG vs LTCG).
 *
 * @param transactions All investment transactions
 * @param taxYear Specific tax year (e.g. 2026), or 0 for all years combined
 * @param method Cost basis method
 */
export function calculateCapitalGainsSchedule(
  transactions: InvestmentTransaction[],
  taxYear: number = 0,
  method: CostBasisMethod = "fifo"
): TaxScheduleSummary {
  const { realizedEvents } = buildTaxLots(transactions, method)

  // Identify all available tax years
  const yearSet = new Set<number>()
  for (const evt of realizedEvents) {
    yearSet.add(evt.sellDate.getFullYear())
  }
  const availableTaxYears = Array.from(yearSet).sort((a, b) => b - a)

  // Filter events for the requested tax year
  const filteredEvents =
    taxYear > 0 ? realizedEvents.filter((e) => e.sellDate.getFullYear() === taxYear) : realizedEvents

  let totalProceedsCents = 0
  let totalCostBasisCents = 0

  const shortTerm = {
    proceedsCents: 0,
    costBasisCents: 0,
    netGainCents: 0,
    gainCents: 0,
    lossCents: 0,
  }

  const longTerm = {
    proceedsCents: 0,
    costBasisCents: 0,
    netGainCents: 0,
    gainCents: 0,
    lossCents: 0,
  }

  const symbolMap = new Map<
    string,
    { shortTermGainCents: number; longTermGainCents: number; netGainCents: number; eventsCount: number }
  >()

  for (const evt of filteredEvents) {
    totalProceedsCents += evt.proceedsCents
    totalCostBasisCents += evt.costBasisCents

    const sym = evt.symbol.toUpperCase()
    const symStat = symbolMap.get(sym) || {
      shortTermGainCents: 0,
      longTermGainCents: 0,
      netGainCents: 0,
      eventsCount: 0,
    }
    symStat.eventsCount += 1
    symStat.netGainCents += evt.realizedGainCents

    if (evt.term === "short_term") {
      shortTerm.proceedsCents += evt.proceedsCents
      shortTerm.costBasisCents += evt.costBasisCents
      shortTerm.netGainCents += evt.realizedGainCents
      if (evt.realizedGainCents > 0) {
        shortTerm.gainCents += evt.realizedGainCents
      } else {
        shortTerm.lossCents += Math.abs(evt.realizedGainCents)
      }
      symStat.shortTermGainCents += evt.realizedGainCents
    } else {
      longTerm.proceedsCents += evt.proceedsCents
      longTerm.costBasisCents += evt.costBasisCents
      longTerm.netGainCents += evt.realizedGainCents
      if (evt.realizedGainCents > 0) {
        longTerm.gainCents += evt.realizedGainCents
      } else {
        longTerm.lossCents += Math.abs(evt.realizedGainCents)
      }
      symStat.longTermGainCents += evt.realizedGainCents
    }

    symbolMap.set(sym, symStat)
  }

  const bySymbol = Array.from(symbolMap.entries())
    .map(([symbol, stat]) => ({
      symbol,
      ...stat,
    }))
    .sort((a, b) => b.netGainCents - a.netGainCents)

  const netRealizedGainCents = totalProceedsCents - totalCostBasisCents

  return {
    taxYear,
    costBasisMethod: method,
    totalProceedsCents,
    totalCostBasisCents,
    netRealizedGainCents,
    shortTerm,
    longTerm,
    bySymbol,
    events: filteredEvents,
    availableTaxYears,
  }
}

/**
 * Generates an exportable IRS Schedule D / Form 8949 style CSV string from realized tax events.
 */
export function generateTaxScheduleCsv(
  events: RealizedTaxEvent[],
  taxYear: number,
  method: CostBasisMethod
): string {
  const headers = [
    "Symbol",
    "Term",
    "Date Acquired",
    "Date Sold",
    "Shares",
    "Proceeds ($)",
    "Cost Basis ($)",
    "Gain or Loss ($)",
    "Holding Period (Days)",
    "Cost Basis Method",
  ]

  const rows = events.map((e) => {
    const buyDateStr = e.buyDate.toISOString().slice(0, 10)
    const sellDateStr = e.sellDate.toISOString().slice(0, 10)
    const proceedsStr = (e.proceedsCents / 100).toFixed(2)
    const costStr = (e.costBasisCents / 100).toFixed(2)
    const gainStr = (e.realizedGainCents / 100).toFixed(2)
    const termLabel = e.term === "long_term" ? "Long-Term" : "Short-Term"

    return [
      `"${e.symbol}"`,
      `"${termLabel}"`,
      buyDateStr,
      sellDateStr,
      e.quantity.toString(),
      proceedsStr,
      costStr,
      gainStr,
      e.holdingPeriodDays.toString(),
      `"${e.costBasisMethod.toUpperCase()}"`,
    ].join(",")
  })

  return [headers.join(","), ...rows].join("\n")
}
