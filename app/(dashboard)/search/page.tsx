import type { Metadata } from "next"
import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { searchEntities } from "@/lib/queries/search"
import { getSavedSearchesAction } from "@/lib/actions/search"
import { SearchResultsView } from "@/components/search/search-results-view"
import SearchLoading from "./loading"
import { serializeData } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Search Hub",
  description: "Search across transactions, accounts, budgets, goals, recurring platforms, and holdings.",
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    entity?: string
  }>
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string }>
}) {
  const session = await requireApprovedUser()
  const userId = session.user.id
  const params = await searchParams
  const rawQuery = params.q || ""

  const [results, savedSearches] = await Promise.all([
    searchEntities(userId, rawQuery, { limitPerEntity: 20 }),
    getSavedSearchesAction(),
  ])

  return (
    <SearchResultsView
      initialQuery={rawQuery}
      initialResults={serializeData(results)}
      initialSavedSearches={serializeData(savedSearches)}
    />
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  )
}
