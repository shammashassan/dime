import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contacts",
  description: "Manage people you lend to, borrow from, or split expenses with.",
}
import { requireApprovedUser } from "@/lib/auth-guard"
import { getContactsWithSummaries } from "@/lib/queries/loans"
import { ContactsView } from "@/components/contacts/contacts-view"
import { serializeData } from "@/lib/utils"


export default async function ContactsPage() {
  await requireApprovedUser()
  const contacts = await getContactsWithSummaries()

  return <ContactsView contacts={serializeData(contacts)} />
}
