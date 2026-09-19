import type {
  DividendForecastItem,
  DividendForecastSummary,
  InvestmentHolding,
  InvestmentTransaction,
} from "@/types"

/**
 * Calculates a forward-looking 12-month dividend income forecast from active holdings
 * and historical dividend distribution behavior.
 */
export function calculateForwardDividends(
  holdings: InvestmentHolding[],
  transactions: InvestmentTransaction[],
  now: Date = new Date()
): DividendForecastSummary {
  const activeHoldings = holdings.filter((h) => h.status === "active" && h.quantity > 0)
  const currentPortfolioValueCents = activeHoldings.reduce(
    (sum, h) => sum + Math.round(h.quantity * h.currentPrice),
    0
  )
  const totalCostBasisCents = activeHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0)

  // Map historical dividend transactions by holdingId / symbol
  const dividendTxMap = new Map<string, InvestmentTransaction[]>()
  for (const tx of transactions) {
    if (tx.type === "cash_dividend" || tx.type === "reinvested_dividend") {
      const key = `${tx.walletId}_${tx.symbol.toUpperCase()}`
      const list = dividendTxMap.get(key) || []
      list.push(tx)
      dividendTxMap.set(key, list)
    }
  }

  // Next 12 months keys and labels
  const next12Months: Array<{ monthKey: string; monthLabel: string; year: number; month: number }> = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`
    const monthLabel = d.toLocaleString("default", { month: "short", year: "numeric" })
    next12Months.push({ monthKey, monthLabel, year: y, month: m })
  }

  const monthlyTotals = new Map<string, number>()
  for (const m of next12Months) {
    monthlyTotals.set(m.monthKey, 0)
  }

  const forecastItems: DividendForecastItem[] = []
  let totalProjectedAnnualIncomeCents = 0

  for (const h of activeHoldings) {
    const key = `${h.walletId}_${h.symbol.toUpperCase()}`
    const divTxs = dividendTxMap.get(key) || []

    // Analyze past dividend behavior
    let trailingAnnualDivPerShare = 0
    let frequency: "monthly" | "quarterly" | "semi_annual" | "annual" = "quarterly"
    let lastPaymentDate: Date | undefined = undefined

    if (divTxs.length > 0) {
      // Sort newest first
      divTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      lastPaymentDate = new Date(divTxs[0].date)

      // Total dividends paid in the trailing 365 days
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 3600 * 1000)
      const trailingYearDivs = divTxs.filter((t) => new Date(t.date) >= oneYearAgo)

      const totalTrailingDivCents = trailingYearDivs.reduce(
        (sum, t) => sum + (t.dividendAmount || t.grossAmount || 0),
        0
      )

      if (totalTrailingDivCents > 0 && h.quantity > 0) {
        trailingAnnualDivPerShare = totalTrailingDivCents / h.quantity
      } else if (divTxs.length > 0) {
        // Use latest payment extrapolated
        const latestAmount = divTxs[0].dividendAmount || divTxs[0].grossAmount || 0
        trailingAnnualDivPerShare = (latestAmount * 4) / Math.max(1, h.quantity)
      }

      // Infer payment cadence
      if (divTxs.length >= 8) {
        frequency = "monthly"
      } else if (divTxs.length >= 3) {
        frequency = "quarterly"
      } else if (divTxs.length === 2) {
        frequency = "semi_annual"
      } else {
        frequency = "annual"
      }
    }

    const currentPriceCents = Math.round(h.currentPrice)
    const currentValueCents = Math.round(h.quantity * h.currentPrice)
    const projectedAnnualIncomeCents = Math.round(h.quantity * trailingAnnualDivPerShare)

    totalProjectedAnnualIncomeCents += projectedAnnualIncomeCents

    const projectedAnnualYieldPct =
      currentValueCents > 0
        ? Number(((projectedAnnualIncomeCents / currentValueCents) * 100).toFixed(2))
        : 0

    // Distribute across next 12 months
    if (projectedAnnualIncomeCents > 0) {
      let intervalMonths = 3 // default quarterly
      if (frequency === "monthly") intervalMonths = 1
      else if (frequency === "semi_annual") intervalMonths = 6
      else if (frequency === "annual") intervalMonths = 12

      const payoutPerEvent = Math.round(projectedAnnualIncomeCents / (12 / intervalMonths))

      // Offset starting month based on last payment or stagger
      let startOffset = 0
      if (lastPaymentDate) {
        const monthsSinceLast =
          (now.getFullYear() - lastPaymentDate.getFullYear()) * 12 +
          (now.getMonth() - lastPaymentDate.getMonth())
        startOffset = Math.max(0, (intervalMonths - (monthsSinceLast % intervalMonths)) % intervalMonths)
      }

      for (let i = startOffset; i < 12; i += intervalMonths) {
        const monthKey = next12Months[i].monthKey
        monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + payoutPerEvent)
      }
    }

    // Estimated next payment date
    let nextEstimatedPaymentDate: Date | undefined
    if (projectedAnnualIncomeCents > 0) {
      const baseMonth = lastPaymentDate ? lastPaymentDate.getMonth() : now.getMonth()
      const nextMonth = (baseMonth + 3) % 12
      const nextYear = now.getFullYear() + (nextMonth < now.getMonth() ? 1 : 0)
      nextEstimatedPaymentDate = new Date(nextYear, nextMonth, 15)
    }

    forecastItems.push({
      symbol: h.symbol,
      name: h.name,
      assetType: h.assetType,
      walletId: h.walletId,
      quantity: h.quantity,
      currentPriceCents,
      currentValueCents,
      trailingAnnualDividendPerShare: Math.round(trailingAnnualDivPerShare),
      projectedAnnualYieldPct,
      projectedAnnualIncomeCents,
      frequency,
      lastPaymentDate,
      nextEstimatedPaymentDate,
    })
  }

  // Sort items: dividend payers first by projected income DESC, then non-payers
  forecastItems.sort((a, b) => b.projectedAnnualIncomeCents - a.projectedAnnualIncomeCents)

  const monthlyDistribution = next12Months.map((m) => ({
    monthKey: m.monthKey,
    monthLabel: m.monthLabel,
    projectedIncomeCents: monthlyTotals.get(m.monthKey) || 0,
  }))

  const projectedYieldOnCostPct =
    totalCostBasisCents > 0
      ? Number(((totalProjectedAnnualIncomeCents / totalCostBasisCents) * 100).toFixed(2))
      : null

  const projectedYieldOnValuePct =
    currentPortfolioValueCents > 0
      ? Number(((totalProjectedAnnualIncomeCents / currentPortfolioValueCents) * 100).toFixed(2))
      : null

  return {
    projectedAnnualIncomeCents: totalProjectedAnnualIncomeCents,
    currentPortfolioValueCents,
    projectedYieldOnCostPct,
    projectedYieldOnValuePct,
    monthlyDistribution,
    holdings: forecastItems,
  }
}
