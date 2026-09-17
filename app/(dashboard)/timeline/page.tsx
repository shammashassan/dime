import { Suspense } from "react"
import type { Metadata } from "next"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getTimelineData } from "@/lib/queries/timeline"
import { TimelineClient } from "@/components/timeline/timeline-client"
import { serializeData } from "@/lib/utils"
import TimelineLoading from "./loading"
import type { TimelineEventCategory } from "@/types"

export const metadata: Metadata = {
  title: "Financial Timeline",
  description: "Chronological narrative of your financial journey, transactions, debt milestones, and goals.",
}

interface TimelinePageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    from?: string
    to?: string
  }>
}

async function TimelinePageContent({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    from?: string
    to?: string
  }>
}) {
  const session = await requireApprovedUser()
  const resolvedParams = await searchParams

  const data = await getTimelineData(session.user.id, {
    category: resolvedParams.category as TimelineEventCategory | undefined,
    search: resolvedParams.search,
    from: resolvedParams.from,
    to: resolvedParams.to,
  })

  return <TimelineClient initialData={serializeData(data)} />
}

export default async function TimelinePage(props: TimelinePageProps) {
  return (
    <Suspense fallback={<TimelineLoading />}>
      <TimelinePageContent searchParams={props.searchParams} />
    </Suspense>
  )
}
