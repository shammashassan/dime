import { requireApprovedUser } from "@/lib/auth-guard"
import { getTransactionById } from "@/lib/queries/transactions"
import { getCategoryById } from "@/lib/queries/categories"
import { getWalletById } from "@/lib/queries/wallets"
import { notFound, unstable_rethrow } from "next/navigation"
import { TransactionDetails } from "@/components/transactions/transaction-details"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Wallet } from "@/types"
import { serializeData } from "@/lib/utils"

export default async function TransactionDetailPage({
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
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div>
        <Button variant="ghost" asChild className="mb-2 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
          <Link href="/transactions" className="flex items-center gap-1.5 text-xs font-bold">
            <ArrowLeft className="size-3.5" /> Back to Transactions
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Transaction Details</h1>
      </div>

      <div className="p-6 rounded-2xl border border-border/40 bg-card shadow-sm">
        <TransactionDetails
          transaction={serializeData(transaction)}
          category={serializeData(category)}
          wallet={serializeData(wallet)}
          linkedWallet={serializeData(linkedWallet)}
        />
      </div>
    </div>
  )
}

