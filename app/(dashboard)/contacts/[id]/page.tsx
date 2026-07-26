import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getContactById, getLoansByContact, getActiveBaseCurrency, getContactBalanceDailyHistory, getLoanRepayments } from "@/lib/queries/loans"
import { ContactDetails } from "@/components/contacts/contact-details"
import { unstable_rethrow } from "next/navigation"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function ContactDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
      
      {/* Metrics Row Skeleton */}
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-[380px] w-full rounded-2xl" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function ContactDetailContent({ id }: { id: string }) {
  await requireApprovedUser()

  let contact
  let loans
  let baseCurrency
  let history
  let repayments: any[] = []

  try {
    contact = await getContactById(id)
    if (!contact) {
      notFound()
    }
    // Fetch in parallel
    const [fetchedLoans, fetchedBaseCurrency, fetchedHistory] = await Promise.all([
      getLoansByContact(id, contact.name),
      getActiveBaseCurrency(),
      getContactBalanceDailyHistory(id, contact.name, 90)
    ])

    loans = fetchedLoans
    baseCurrency = fetchedBaseCurrency
    history = fetchedHistory

    // Fetch repayments for every loan tied to this contact, in parallel
    const repaymentLists = await Promise.all(loans.map((loan) => getLoanRepayments(loan._id.toString())))
    repayments = repaymentLists.flat()
  } catch (error: any) {
    unstable_rethrow(error)
    notFound()
  }

  return (
    <ContactDetails
      contact={serializeData(contact)}
      loans={serializeData(loans)}
      baseCurrency={baseCurrency}
      history={serializeData(history)}
      repayments={serializeData(repayments)}
    />
  )
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<ContactDetailSkeleton />}>
      <ContactDetailContent id={id} />
    </Suspense>
  )
}