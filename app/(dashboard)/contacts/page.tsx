import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getContactsWithSummaries } from "@/lib/queries/loans"
import { ContactsView } from "@/components/contacts/contacts-view"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { ContactsSkeleton } from "./loading"

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
