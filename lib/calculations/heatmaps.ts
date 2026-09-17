import {
  parseISO,
  getDay,
  getMonth,
  getYear,
  formatISO,
  eachDayOfInterval,
  differenceInCalendarDays,
  subDays,
} from "date-fns"

export type HeatmapMetric = "expense" | "income" | "net" | "count"

export interface HeatmapTransactionPreview {
  id: string
  description: string
  amount: number // in cents
  currency: string
  type: "income" | "expense" | "transfer"
  categoryName: string
  categoryColor: string
  categoryIcon: string
  walletName: string
}

export interface HeatmapDaySummary {
  date: string // YYYY-MM-DD
  expense: number // in cents
  income: number // in cents
  net: number // in cents
  count: number
  level: number // 0..4
  transactions: HeatmapTransactionPreview[]
}

export interface HeatmapHabitStats {
  currentNoSpendStreak: number
  longestNoSpendStreak: number
  noSpendDaysCount: number
  activeDaysCount: number
  totalDays: number
  totalExpense: number // in cents
  totalIncome: number // in cents
  netSavings: number // in cents
  dailyAverageSpend: number // in cents
  peakSpendDay: { date: string; amount: number; count: number } | null
  mostActiveDayOfWeek: { dayName: string; averageSpend: number; count: number } | null
}

export interface HeatmapWeek {
  days: Array<HeatmapDaySummary | undefined>
}

export interface MonthLabel {
  weekIndex: number
  label: string
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/**
 * Calculates adaptive quantile levels (0 to 4) for an array of numbers.
 * Level 0 = 0 (or no activity).
 * Levels 1..4 = non-zero values split into 4 quantile buckets (25%, 50%, 75%, 100%).
 */
export function calculateQuantileLevels(
  values: number[],
  metric: HeatmapMetric = "expense"
): Map<number, number> {
  const levelMap = new Map<number, number>()
  levelMap.set(0, 0)

  // Filter positive values for scaling
  const positiveValues = values
    .map((v) => (metric === "net" ? Math.abs(v) : v))
    .filter((v) => v > 0)
    .sort((a, b) => a - b)

  if (positiveValues.length === 0) {
    return levelMap
  }

  // Handle small datasets directly by relative rank
  if (positiveValues.length === 1) {
    levelMap.set(positiveValues[0], 2)
    return levelMap
  }

  const maxVal = positiveValues[positiveValues.length - 1]
  const minVal = positiveValues[0]

  if (maxVal === minVal) {
    for (const val of values) {
      levelMap.set(val, val > 0 ? 2 : 0)
    }
    return levelMap
  }

  // Small array (2..4 items): distribute evenly between 1 and 4
  if (positiveValues.length <= 4) {
    const uniquePos = Array.from(new Set(positiveValues)).sort((a, b) => a - b)
    uniquePos.forEach((val, idx) => {
      const level = Math.min(4, Math.max(1, Math.round((idx / (uniquePos.length - 1)) * 3) + 1))
      levelMap.set(val, level)
    })
    return levelMap
  }

  const getPercentile = (p: number): number => {
    const index = Math.floor((p / 100) * (positiveValues.length - 1))
    return positiveValues[index]
  }

  const q1 = getPercentile(25)
  const q2 = getPercentile(50)
  const q3 = getPercentile(75)

  for (const val of values) {
    const compVal = metric === "net" ? Math.abs(val) : val
    if (compVal <= 0) {
      levelMap.set(val, 0)
    } else if (compVal === maxVal) {
      levelMap.set(val, 4)
    } else if (compVal <= q1) {
      levelMap.set(val, 1)
    } else if (compVal <= q2) {
      levelMap.set(val, 2)
    } else if (compVal <= q3) {
      levelMap.set(val, 3)
    } else {
      levelMap.set(val, 4)
    }
  }

  return levelMap
}

/**
 * Assigns intensity levels (0..4) to each day based on the selected metric.
 */
export function assignQuantileLevelsToDays(
  days: HeatmapDaySummary[],
  metric: HeatmapMetric
): HeatmapDaySummary[] {
  const metricExtractor = (d: HeatmapDaySummary) => {
    switch (metric) {
      case "expense":
        return d.expense
      case "income":
        return d.income
      case "net":
        return d.net
      case "count":
        return d.count
      default:
        return d.expense
    }
  }

  const rawValues = days.map(metricExtractor)
  const levelMap = calculateQuantileLevels(rawValues, metric)

  return days.map((day) => {
    const val = metricExtractor(day)
    return {
      ...day,
      level: levelMap.get(val) ?? (val > 0 ? 1 : 0),
    }
  })
}

/**
 * Calculates habit telemetry: current/longest zero-spend streak, averages, peak days, and active weekdays.
 */
export function calculateHeatmapHabits(
  days: HeatmapDaySummary[],
  referenceDateStr?: string
): HeatmapHabitStats {
  if (days.length === 0) {
    return {
      currentNoSpendStreak: 0,
      longestNoSpendStreak: 0,
      noSpendDaysCount: 0,
      activeDaysCount: 0,
      totalDays: 0,
      totalExpense: 0,
      totalIncome: 0,
      netSavings: 0,
      dailyAverageSpend: 0,
      peakSpendDay: null,
      mostActiveDayOfWeek: null,
    }
  }

  // Sort chronologically
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const totalDays = sortedDays.length

  let totalExpense = 0
  let totalIncome = 0
  let activeDaysCount = 0
  let noSpendDaysCount = 0

  let peakSpendDay: { date: string; amount: number; count: number } | null = null

  // Weekday aggregation for spending habits
  const weekdaySpendTotals: Record<number, { total: number; count: number }> = {
    0: { total: 0, count: 0 }, // Sun
    1: { total: 0, count: 0 }, // Mon
    2: { total: 0, count: 0 }, // Tue
    3: { total: 0, count: 0 }, // Wed
    4: { total: 0, count: 0 }, // Thu
    5: { total: 0, count: 0 }, // Fri
    6: { total: 0, count: 0 }, // Sat
  }

  let longestNoSpendStreak = 0
  let runningNoSpendStreak = 0

  for (const day of sortedDays) {
    totalExpense += day.expense
    totalIncome += day.income

    if (day.count > 0) {
      activeDaysCount++
    }

    if (day.expense === 0) {
      noSpendDaysCount++
      runningNoSpendStreak++
      if (runningNoSpendStreak > longestNoSpendStreak) {
        longestNoSpendStreak = runningNoSpendStreak
      }
    } else {
      runningNoSpendStreak = 0
    }

    // Peak spend day tracking
    if (day.expense > 0 && (!peakSpendDay || day.expense > peakSpendDay.amount)) {
      peakSpendDay = {
        date: day.date,
        amount: day.expense,
        count: day.count,
      }
    }

    // Weekday spending tracking
    const dayOfWeek = getDay(parseISO(day.date))
    weekdaySpendTotals[dayOfWeek].total += day.expense
    weekdaySpendTotals[dayOfWeek].count++
  }

  // Current no-spend streak ending at reference date (or latest day in dataset)
  let currentNoSpendStreak = 0
  const latestDate = referenceDateStr || sortedDays[sortedDays.length - 1].date
  const latestIndex = sortedDays.findIndex((d) => d.date === latestDate)
  const startIndex = latestIndex >= 0 ? latestIndex : sortedDays.length - 1

  for (let i = startIndex; i >= 0; i--) {
    if (sortedDays[i].expense === 0) {
      currentNoSpendStreak++
    } else {
      break
    }
  }

  // Determine most active spending day of week (highest average spend)
  let bestDayIndex = 0
  let maxAvgSpend = -1
  for (let d = 0; d < 7; d++) {
    const { total, count } = weekdaySpendTotals[d]
    const avg = count > 0 ? total / count : 0
    if (avg > maxAvgSpend) {
      maxAvgSpend = avg
      bestDayIndex = d
    }
  }

  const mostActiveDayOfWeek =
    maxAvgSpend > 0
      ? {
          dayName: DAY_NAMES[bestDayIndex],
          averageSpend: Math.round(maxAvgSpend),
          count: weekdaySpendTotals[bestDayIndex].count,
        }
      : null

  return {
    currentNoSpendStreak,
    longestNoSpendStreak,
    noSpendDaysCount,
    activeDaysCount,
    totalDays,
    totalExpense,
    totalIncome,
    netSavings: totalIncome - totalExpense,
    dailyAverageSpend: totalDays > 0 ? Math.round(totalExpense / totalDays) : 0,
    peakSpendDay,
    mostActiveDayOfWeek,
  }
}

/**
 * Groups day summaries into weeks (52-53 columns) matching GitHub / Kibo UI convention.
 * weekStart: 0 = Sunday, 1 = Monday (default: 0).
 */
export function groupDaysIntoWeeks(
  days: HeatmapDaySummary[],
  weekStart: 0 | 1 = 0
): HeatmapWeek[] {
  if (days.length === 0) return []

  // Create date lookup map
  const dayMap = new Map<string, HeatmapDaySummary>()
  days.forEach((d) => dayMap.set(d.date, d))

  const sortedDates = days.map((d) => parseISO(d.date)).sort((a, b) => a.getTime() - b.getTime())
  const startDate = sortedDates[0]
  const endDate = sortedDates[sortedDates.length - 1]

  const allIntervalDates = eachDayOfInterval({ start: startDate, end: endDate })

  const firstDay = allIntervalDates[0]
  const firstDayOfWeek = getDay(firstDay)
  const offset = (firstDayOfWeek - weekStart + 7) % 7

  const weeks: HeatmapWeek[] = []
  let currentWeek: Array<HeatmapDaySummary | undefined> = new Array(offset).fill(undefined)

  for (const date of allIntervalDates) {
    const dateStr = formatISO(date, { representation: "date" })
    const dayData = dayMap.get(dateStr) || {
      date: dateStr,
      expense: 0,
      income: 0,
      net: 0,
      count: 0,
      level: 0,
      transactions: [],
    }

    currentWeek.push(dayData)

    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek })
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(undefined)
    }
    weeks.push({ days: currentWeek })
  }

  return weeks
}

/**
 * Generates month label positions aligned with week columns, filtering out adjacent overlaps.
 */
export function getHeatmapMonthLabels(
  weeks: HeatmapWeek[],
  monthNames: string[] = MONTH_NAMES
): MonthLabel[] {
  const rawLabels: MonthLabel[] = []

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.days.find((d) => d !== undefined)
    if (!firstDay) return

    const monthIndex = getMonth(parseISO(firstDay.date))
    const monthLabel = monthNames[monthIndex]

    const prev = rawLabels[rawLabels.length - 1]
    if (weekIndex === 0 || !prev || prev.label !== monthLabel) {
      rawLabels.push({ weekIndex, label: monthLabel })
    }
  })

  // Prevent labels too close to one another (min 3 weeks spacing)
  return rawLabels.filter(({ weekIndex }, index, labels) => {
    const minWeeks = 3
    if (index === 0) {
      return !labels[1] || labels[1].weekIndex - weekIndex >= minWeeks
    }
    if (index === labels.length - 1) {
      return weeks.length - weekIndex >= 2
    }
    return labels[index + 1].weekIndex - weekIndex >= minWeeks
  })
}
