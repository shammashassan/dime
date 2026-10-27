import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Loan Details",
  description: "Detailed view of loan terms, repayment history, and outstanding balance.",
}
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getLoanById, getLoanRepayments, getContacts } from "@/lib/queries/loans"
import { getWallets } from "@/lib/queries/wallets"
import { LoanDetails } from "@/components/loans/loan-details"
import { serializeData } from "@/lib/utils"


interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireApprovedUser()
  const userId = session.user.id

  // Fetch loan, repayments, wallets, and contacts in parallel
  const [loan, repayments, wallets, contacts] = await Promise.all([
    getLoanById(id),
    getLoanRepayments(id),
    getWallets(userId),
    getContacts(),
  ])

  if (!loan) {
    notFound()
  }

  return (
    <LoanDetails
      loan={serializeData(loan)}
      repayments={serializeData(repayments)}
      wallets={serializeData(wallets)}
      contacts={serializeData(contacts)}
    />
  )
}
