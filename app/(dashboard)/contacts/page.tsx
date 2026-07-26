import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getContactsWithSummaries } from "@/lib/queries/loans"
import { ContactsView } from "@/components/contacts/contacts-view"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function ContactsSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <Skeleton className="h-9 w-full sm:max-w-md rounded-xl" />
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

async function ContactsContent() {
  await requireApprovedUser()
  const contacts = await getContactsWithSummaries()

  return <ContactsView contacts={serializeData(contacts)} />
}

export default async function ContactsPage() {
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsContent />
    </Suspense>
  )
}
