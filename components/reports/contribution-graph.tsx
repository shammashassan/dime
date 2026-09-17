"use client"

import {
  createContext,
  Fragment,
  useContext,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import type { Day as WeekDay } from "date-fns"
import {
  eachDayOfInterval,
  formatISO,
  getDay,
  getMonth,
  getYear,
  parseISO,
} from "date-fns"
import { cn } from "@/lib/utils"

export type Activity = {
  date: string
  count: number
  level: number
  amount?: number // cents
  net?: number
  transactionsCount?: number
  [key: string]: any
}

type Week = Array<Activity | undefined>

export type Labels = {
  months?: string[]
  weekdays?: string[]
  totalCount?: string
  legend?: {
    less?: string
    more?: string
  }
}

type MonthLabel = {
  weekIndex: number
  label: string
}

const DEFAULT_MONTH_LABELS = [
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

const DEFAULT_LABELS: Labels = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  totalCount: "{{count}} activities in {{year}}",
  legend: {
    less: "Less",
    more: "More",
  },
}

export type HeatmapThemeVariant = "expense" | "income" | "count" | "net"

export const getThemeClasses = (variant: HeatmapThemeVariant = "expense") => {
  switch (variant) {
    case "expense":
      return cn(
        'data-[level="0"]:fill-muted/70 dark:data-[level="0"]:fill-muted/40 stroke-border/30 stroke-[0.5px]',
        'data-[level="1"]:fill-rose-500/35 dark:data-[level="1"]:fill-rose-400/30 stroke-rose-500/20 stroke-[0.5px]',
        'data-[level="2"]:fill-rose-500/60 dark:data-[level="2"]:fill-rose-400/55',
        'data-[level="3"]:fill-rose-500/80 dark:data-[level="3"]:fill-rose-400/80',
        'data-[level="4"]:fill-rose-600 dark:data-[level="4"]:fill-rose-500'
      )
    case "income":
      return cn(
        'data-[level="0"]:fill-muted/70 dark:data-[level="0"]:fill-muted/40 stroke-border/30 stroke-[0.5px]',
        'data-[level="1"]:fill-emerald-500/35 dark:data-[level="1"]:fill-emerald-400/30 stroke-emerald-500/20 stroke-[0.5px]',
        'data-[level="2"]:fill-emerald-500/60 dark:data-[level="2"]:fill-emerald-400/55',
        'data-[level="3"]:fill-emerald-500/80 dark:data-[level="3"]:fill-emerald-400/80',
        'data-[level="4"]:fill-emerald-600 dark:data-[level="4"]:fill-emerald-500'
      )
    case "net":
      return cn(
        'data-[level="0"]:fill-muted/70 dark:data-[level="0"]:fill-muted/40 stroke-border/30 stroke-[0.5px]',
        'data-[level="1"]:fill-blue-500/35 dark:data-[level="1"]:fill-blue-400/30 stroke-blue-500/20 stroke-[0.5px]',
        'data-[level="2"]:fill-blue-500/60 dark:data-[level="2"]:fill-blue-400/55',
        'data-[level="3"]:fill-blue-500/80 dark:data-[level="3"]:fill-blue-400/80',
        'data-[level="4"]:fill-blue-600 dark:data-[level="4"]:fill-blue-500'
      )
    case "count":
    default:
      return cn(
        'data-[level="0"]:fill-muted/70 dark:data-[level="0"]:fill-muted/40 stroke-border/30 stroke-[0.5px]',
        'data-[level="1"]:fill-primary/35 stroke-primary/20 stroke-[0.5px]',
        'data-[level="2"]:fill-primary/60',
        'data-[level="3"]:fill-primary/80',
        'data-[level="4"]:fill-primary'
      )
  }
}

export const groupByWeeks = (
  activities: Activity[],
  weekStart: WeekDay = 0
): Week[] => {
  if (activities.length === 0) return []

  const map = new Map<string, Activity>()
  activities.forEach((act) => map.set(act.date, act))

  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date))
  const start = parseISO(sorted[0].date)
  const end = parseISO(sorted[sorted.length - 1].date)

  const allDates = eachDayOfInterval({ start, end })
  const firstDay = allDates[0]
  const offset = (getDay(firstDay) - weekStart + 7) % 7

  const weeks: Week[] = []
  let currentWeek: Week = new Array(offset).fill(undefined)

  for (const d of allDates) {
    const key = formatISO(d, { representation: "date" })
    const item = map.get(key) || {
      date: key,
      count: 0,
      level: 0,
    }

    currentWeek.push(item)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(undefined)
    }
    weeks.push(currentWeek)
  }

  return weeks
}

export const getMonthLabels = (
  weeks: Week[],
  monthNames: string[] = DEFAULT_MONTH_LABELS
): MonthLabel[] => {
  return weeks
    .reduce<MonthLabel[]>((labels, week, weekIndex) => {
      const firstActivity = week.find((activity) => activity !== undefined)
      if (!firstActivity) return labels

      const month = monthNames[getMonth(parseISO(firstActivity.date))]
      if (!month) return labels

      const prevLabel = labels.at(-1)
      if (weekIndex === 0 || !prevLabel || prevLabel.label !== month) {
        return labels.concat({ weekIndex, label: month })
      }
      return labels
    }, [])
    .filter(({ weekIndex }, index, labels) => {
      const minWeeks = 3
      if (index === 0) {
        return labels[1] && labels[1].weekIndex - weekIndex >= minWeeks
      }
      if (index === labels.length - 1) {
        return weeks.slice(weekIndex).length >= minWeeks
      }
      return true
    })
}

type ContributionGraphContextType = {
  data: Activity[]
  weeks: Week[]
  blockMargin: number
  blockRadius: number
  blockSize: number
  fontSize: number
  labels: Labels
  labelHeight: number
  maxLevel: number
  totalCount: number
  weekStart: WeekDay
  year: number
  width: number
  height: number
  variant: HeatmapThemeVariant
  weekdayLabelWidth: number
}

const ContributionGraphContext =
  createContext<ContributionGraphContextType | null>(null)

export const useContributionGraph = () => {
  const context = useContext(ContributionGraphContext)
  if (!context) {
    throw new Error(
      "ContributionGraph components must be used within a ContributionGraph provider"
    )
  }
  return context
}

export type ContributionGraphProps = HTMLAttributes<HTMLDivElement> & {
  data: Activity[]
  blockMargin?: number
  blockRadius?: number
  blockSize?: number
  fontSize?: number
  labels?: Labels
  maxLevel?: number
  style?: CSSProperties
  totalCount?: number
  weekStart?: WeekDay
  variant?: HeatmapThemeVariant
  showWeekdayLabels?: boolean
  children: ReactNode
  className?: string
}

export const ContributionGraph = ({
  data,
  blockMargin = 3,
  blockRadius = 2,
  blockSize = 11,
  fontSize = 11,
  labels: labelsProp = undefined,
  maxLevel: maxLevelProp = 4,
  style = {},
  totalCount: totalCountProp = undefined,
  weekStart = 0,
  variant = "expense",
  showWeekdayLabels = true,
  className,
  children,
  ...props
}: ContributionGraphProps) => {
  const maxLevel = Math.max(1, maxLevelProp)
  const weeks = useMemo(() => groupByWeeks(data, weekStart), [data, weekStart])
  const LABEL_MARGIN = 6

  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const labelHeight = fontSize + LABEL_MARGIN
  const weekdayLabelWidth = showWeekdayLabels ? 28 : 0

  const year =
    data.length > 0 ? getYear(parseISO(data[0].date)) : new Date().getFullYear()

  const totalCount =
    typeof totalCountProp === "number"
      ? totalCountProp
      : data.reduce((sum, activity) => sum + activity.count, 0)

  const width = weekdayLabelWidth + weeks.length * (blockSize + blockMargin) - blockMargin
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin

  if (data.length === 0) {
    return null
  }

  return (
    <ContributionGraphContext.Provider
      value={{
        data,
        weeks,
        blockMargin,
        blockRadius,
        blockSize,
        fontSize,
        labels,
        labelHeight,
        maxLevel,
        totalCount,
        weekStart,
        year,
        width,
        height,
        variant,
        weekdayLabelWidth,
      }}
    >
      <div
        className={cn("flex w-max max-w-full flex-col gap-2", className)}
        style={{ fontSize, ...style }}
        {...props}
      >
        {children}
      </div>
    </ContributionGraphContext.Provider>
  )
}

export type ContributionGraphBlockProps = HTMLAttributes<SVGRectElement> & {
  activity: Activity
  dayIndex: number
  weekIndex: number
}

export const ContributionGraphBlock = ({
  activity,
  dayIndex,
  weekIndex,
  className,
  ...props
}: ContributionGraphBlockProps) => {
  const {
    blockSize,
    blockMargin,
    blockRadius,
    labelHeight,
    maxLevel,
    variant,
    weekdayLabelWidth,
  } = useContributionGraph()

  const themeClasses = getThemeClasses(variant)

  return (
    <rect
      className={cn(
        themeClasses,
        "transition-colors duration-100 hover:stroke-foreground/40 hover:stroke-[1.5px] cursor-pointer focus:outline-none",
        className
      )}
      data-count={activity.count}
      data-date={activity.date}
      data-level={Math.min(maxLevel, Math.max(0, activity.level))}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockSize}
      x={weekdayLabelWidth + (blockSize + blockMargin) * weekIndex}
      y={labelHeight + (blockSize + blockMargin) * dayIndex}
      {...props}
    />
  )
}

export type ContributionGraphCalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  title?: string
  hideMonthLabels?: boolean
  hideWeekdayLabels?: boolean
  className?: string
  children: (props: {
    activity: Activity
    dayIndex: number
    weekIndex: number
  }) => ReactNode
}

export const ContributionGraphCalendar = ({
  title = "Contribution Graph",
  hideMonthLabels = false,
  hideWeekdayLabels = false,
  className,
  children,
  ...props
}: ContributionGraphCalendarProps) => {
  const {
    weeks,
    width,
    height,
    blockSize,
    blockMargin,
    labels,
    weekdayLabelWidth,
    labelHeight,
  } = useContributionGraph()

  const monthLabels = useMemo(
    () => getMonthLabels(weeks, labels.months),
    [weeks, labels.months]
  )

  // Standard weekday labels: Mon (1), Wed (3), Fri (5)
  const weekdayIndices = [1, 3, 5]

  return (
    <div
      className={cn(
        "no-scrollbar max-w-full overflow-x-auto overflow-y-hidden select-none",
        className
      )}
      {...props}
    >
      <svg
        className="block overflow-visible text-xs font-medium"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <title>{title}</title>

        {/* Month labels along top */}
        {!hideMonthLabels && (
          <g
            data-slot="month-labels"
            className="fill-muted-foreground text-[10px]"
          >
            {monthLabels.map(({ label, weekIndex }) => (
              <text
                dominantBaseline="hanging"
                key={weekIndex}
                x={weekdayLabelWidth + (blockSize + blockMargin) * weekIndex}
                y={0}
              >
                {label}
              </text>
            ))}
          </g>
        )}

        {/* Weekday labels on left */}
        {!hideWeekdayLabels && weekdayLabelWidth > 0 && (
          <g
            data-slot="weekday-labels"
            className="fill-muted-foreground text-[9px]"
          >
            {weekdayIndices.map((dayIdx) => {
              const label = labels.weekdays?.[dayIdx] || ""
              return (
                <text
                  key={dayIdx}
                  x={0}
                  y={labelHeight + (blockSize + blockMargin) * dayIdx + blockSize - 2}
                  dominantBaseline="auto"
                >
                  {label}
                </text>
              )
            })}
          </g>
        )}

        {/* Calendar Day Blocks */}
        {weeks.map((week, weekIndex) =>
          week.map((activity, dayIndex) => {
            if (!activity) return null
            return (
              <Fragment key={`${weekIndex}-${dayIndex}`}>
                {children({ activity, dayIndex, weekIndex })}
              </Fragment>
            )
          })
        )}
      </svg>
    </div>
  )
}

export type ContributionGraphFooterProps = HTMLAttributes<HTMLDivElement>

export const ContributionGraphFooter = ({
  className,
  ...props
}: ContributionGraphFooterProps) => (
  <div
    className={cn(
      "flex flex-wrap items-center justify-between gap-2 whitespace-nowrap text-xs text-muted-foreground pt-1",
      className
    )}
    {...props}
  />
)

export type ContributionGraphTotalCountProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { totalCount: number; year: number }) => ReactNode
}

export const ContributionGraphTotalCount = ({
  className,
  children,
  ...props
}: ContributionGraphTotalCountProps) => {
  const { totalCount, year, labels } = useContributionGraph()

  if (children) {
    return <>{children({ totalCount, year })}</>
  }

  return (
    <div className={cn("text-muted-foreground", className)} {...props}>
      {labels.totalCount
        ? labels.totalCount
            .replace("{{count}}", String(totalCount))
            .replace("{{year}}", String(year))
        : `${totalCount} activities in ${year}`}
    </div>
  )
}

export type ContributionGraphLegendProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { level: number }) => ReactNode
}

export const ContributionGraphLegend = ({
  className,
  children,
  ...props
}: ContributionGraphLegendProps) => {
  const { labels, maxLevel, blockSize, blockRadius, blockMargin, variant } =
    useContributionGraph()

  const themeClasses = getThemeClasses(variant)

  return (
    <div
      className={cn("flex items-center text-xs text-muted-foreground", className)}
      style={{ gap: blockMargin }}
      {...props}
    >
      <span className="mr-1 text-[11px]">
        {labels.legend?.less || "Less"}
      </span>

      {new Array(maxLevel + 1).fill(undefined).map((_, level) =>
        children ? (
          <Fragment key={level}>{children({ level })}</Fragment>
        ) : (
          <svg height={blockSize} key={level} width={blockSize}>
            <title>{`Level ${level}`}</title>
            <rect
              className={cn(themeClasses)}
              data-level={level}
              height={blockSize}
              rx={blockRadius}
              ry={blockRadius}
              width={blockSize}
            />
          </svg>
        )
      )}

      <span className="ml-1 text-[11px]">
        {labels.legend?.more || "More"}
      </span>
    </div>
  )
}
