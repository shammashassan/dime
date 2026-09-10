import { Suspense } from "react"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getRecurringRules } from "@/lib/queries/recurring"
import { getCategories } from "@/lib/queries/categories"
import { getWallets } from "@/lib/queries/wallets"
import { getBillInstances } from "@/lib/queries/bills"
import { RecurringView } from "@/components/recurring/recurring-view"
import { Skeleton } from "@/components/ui/skeleton"
import { unstable_rethrow } from "next/navigation"
import { serializeData } from "@/lib/utils"



import { RecurringSkeleton } from "./loading"

async function RecurringContent() {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let rules: any[] = []
  let categories: any[] = []
  let wallets: any[] = []
  let billInstances: any[] = []

  try {
    const [fetchedRules, fetchedCategories, fetchedWallets, fetchedBills] = await Promise.all([
      getRecurringRules(userId),
      getCategories(userId),
      getWallets(userId),
      getBillInstances()
    ])
    rules = fetchedRules
    categories = fetchedCategories
    wallets = fetchedWallets
    billInstances = fetchedBills
  } catch (error) {
    unstable_rethrow(error)
    console.error("Failed to load recurring rules:", error)
  }

  return (
    <RecurringView
      rules={serializeData(rules)}
      categories={serializeData(categories)}
      wallets={serializeData(wallets)}
      billInstances={serializeData(billInstances)}
    />
  )
}

export default async function RecurringPage() {
  return (
    <Suspense fallback={<RecurringSkeleton />}>
      <RecurringContent />
    </Suspense>
  )
}
