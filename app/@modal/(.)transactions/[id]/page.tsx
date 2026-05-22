import { requireApprovedUser } from "@/lib/auth-guard"
import { getTransactionById } from "@/lib/queries/transactions"
import { getCategoryById } from "@/lib/queries/categories"
import { getWalletById } from "@/lib/queries/wallets"
import { notFound, unstable_rethrow } from "next/navigation"
import { TransactionDetailsModal } from "./transaction-details-modal"
import { serializeData } from "@/lib/utils"

export default async function InterceptedTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireApprovedUser()
  const userId = session.user.id

  let id: string
  try {
    const resolvedParams = await params
    id = resolvedParams.id
  } catch (err) {
    notFound()
  }

  let transaction
  let category = null
  let wallet = null
  let linkedWallet = null

  try {
    transaction = await getTransactionById(userId, id)
    if (!transaction) {
      notFound()
    }

    const [cat, w] = await Promise.all([
      getCategoryById(userId, transaction.categoryId),
      getWalletById(userId, transaction.walletId),
    ])
    category = cat
    wallet = w

    if (transaction.type === "transfer" && transaction.linkedTransactionId) {
      const linkedTx = await getTransactionById(userId, transaction.linkedTransactionId)
      if (linkedTx) {
        linkedWallet = await getWalletById(userId, linkedTx.walletId)
      }
    }
  } catch (err: any) {
    unstable_rethrow(err)
    notFound()
  }

  return (
    <TransactionDetailsModal
      transaction={serializeData(transaction)}
      category={serializeData(category)}
      wallet={serializeData(wallet)}
      linkedWallet={serializeData(linkedWallet)}
    />
  )
}

