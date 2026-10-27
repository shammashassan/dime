import type { Metadata } from "next"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getCashFlowCalendarData } from "@/lib/queries/cash-flow-calendar"
import { CalendarClient } from "@/components/calendar/calendar-client"
import { serializeData } from "@/lib/utils"
import CalendarLoading from "./loading"

export const metadata: Metadata = {
  title: "Cash Flow Calendar",
  description: "Visualize your day-by-day cash balance trajectory, upcoming bills, subscriptions, and liquidity.",
}

interface CalendarPageProps {
  searchParams: Promise<{
    month?: string
    mode?: "liquid" | "all"
  }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await requireApprovedUser()
  const { month, mode } = await searchParams

  const data = await getCashFlowCalendarData(session.user.id, {
    month,
    mode,
  })

  const serialized = serializeData(data)
  return <CalendarClient data={serialized} initialMode={mode} />
}
