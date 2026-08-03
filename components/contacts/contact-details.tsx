"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Contact, Loan, LoanRepayment, SharedExpense, SharedSettlement } from "@/types"
import { deleteContact, deleteLoan, deleteRepayment } from "@/lib/actions/loans"
import { ContactDialog } from "./contact-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogMedia
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Mail,
  Phone,
  Trash2,
  Edit,
  HandCoins,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Users2,
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import { WalletDetailChart } from "@/components/wallets/wallet-detail-chart"

interface ContactDetailsProps {
  contact: Contact
  loans: Loan[]
  baseCurrency: string
  history: { date: string; balance: number }[]
  repayments?: LoanRepayment[]
  sharedExpenses?: SharedExpense[]
  sharedSettlements?: SharedSettlement[]
}

interface TimelineEvent {
  id: string
  type: "loan_created" | "repayment" | "overdue" | "shared_expense" | "settlement"
  date: Date
  title: string
  description: string
  amount?: number
  currency: string
  isLent: boolean
  loanId?: string
  repaymentId?: string
  expenseId?: string
  settlementId?: string
}

export function ContactDetails({
  contact,
  loans,
  baseCurrency,
  history,
  repayments = [],
  sharedExpenses = [],
  sharedSettlements = [],
}: ContactDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [localLoans, setLocalLoans] = useState(loans)
  const [localRepayments, setLocalRepayments] = useState(repayments)

  const [prevLoans, setPrevLoans] = useState(loans)
  if (loans !== prevLoans) {
    setPrevLoans(loans)
    setLocalLoans(loans)
  }

  const [prevRepayments, setPrevRepayments] = useState(repayments)
  if (repayments !== prevRepayments) {
    setPrevRepayments(repayments)
    setLocalRepayments(repayments)
  }

  const activeLoans = localLoans.filter(l => ["active", "partially_repaid", "overdue"].includes(l.status))
  const settledLoansCount = localLoans.filter(l => l.status === "fully_repaid").length
  const overdueLoansCount = localLoans.filter(l => l.status === "overdue").length

  let netOwed = 0

  // 1. Loans
  localLoans.forEach(loan => {
    if (loan.status === "cancelled") return
    if (loan.type === "lent") {
      netOwed += loan.remainingAmount
    } else {
      netOwed -= loan.remainingAmount
    }
  })

  // 2. Shared Expenses
  const contactIdStr = contact._id.toString()
  sharedExpenses.forEach((exp) => {
    const contactP = exp.participants.find((p) => p.participantId === contactIdStr)
    const userP = exp.participants.find((p) => p.participantType === "user")

    if (!contactP || !userP) return

    if (exp.paidByParticipantId === userP.participantId) {
      netOwed += contactP.amountOwed
    } else if (exp.paidByParticipantId === contactIdStr) {
      netOwed -= userP.amountOwed
    }
  })

  // 3. Shared Settlements
  sharedSettlements.forEach((s) => {
    if (s.fromParticipantId === contactIdStr) {
      netOwed -= s.amount
    } else if (s.toParticipantId === contactIdStr) {
      netOwed += s.amount
    }
  })

  const accent = netOwed > 0 ? "#10b981" : netOwed < 0 ? "#ef4444" : "#94a3b8"

  // Build a merged, chronological timeline across loans, shared expenses, and settlements
  const timelineEvents: TimelineEvent[] = []

  localLoans.forEach((loan) => {
    const isLent = loan.type === "lent"
    timelineEvents.push({
      id: `loan-${loan._id.toString()}`,
      type: "loan_created",
      date: new Date(loan.date),
      title: isLent ? "You Lent Money" : "You Borrowed Money",
      description: `Loan of ${formatCurrency(loan.amount, loan.currency)} recorded`,
      amount: loan.amount,
      currency: loan.currency,
      isLent,
      loanId: loan._id.toString(),
    })

    if (loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status !== "fully_repaid" && loan.status !== "cancelled") {
      timelineEvents.push({
        id: `overdue-${loan._id.toString()}`,
        type: "overdue",
        date: new Date(loan.dueDate),
        title: "Loan Overdue",
        description: `Passed due date on ${format(new Date(loan.dueDate), "PP")}`,
        amount: loan.remainingAmount,
        currency: loan.currency,
        isLent,
        loanId: loan._id.toString(),
      })
    }
  })

  localRepayments.forEach((rep) => {
    const loan = localLoans.find(l => l._id.toString() === rep.loanId)
    if (!loan) return
    const isLent = loan.type === "lent"
    timelineEvents.push({
      id: `rep-${rep._id.toString()}`,
      type: "repayment",
      date: new Date(rep.date),
      title: "Repayment Logged",
      description: rep.notes ? `"${rep.notes}"` : (isLent ? `Repayment from ${contact.name}` : `Repayment to ${contact.name}`),
      amount: rep.amount,
      currency: loan.currency,
      isLent,
      loanId: loan._id.toString(),
      repaymentId: rep._id.toString(),
    })
  })

  // Add Shared Expenses to Timeline
  sharedExpenses.forEach((exp) => {
    const contactP = exp.participants.find((p) => p.participantId === contactIdStr)
    const userP = exp.participants.find((p) => p.participantType === "user")

    if (!contactP || !userP) return
    const userPaid = exp.paidByParticipantId === userP.participantId

    timelineEvents.push({
      id: `expense-${exp._id.toString()}`,
      type: "shared_expense",
      date: new Date(exp.date),
      title: `Shared Expense: ${exp.title}`,
      description: userPaid ? `You paid upfront (${contact.name} owes ${formatCurrency(contactP.amountOwed, exp.currency)})` : `${contact.name} paid upfront (You owe ${formatCurrency(userP.amountOwed, exp.currency)})`,
      amount: userPaid ? contactP.amountOwed : userP.amountOwed,
      currency: exp.currency,
      isLent: userPaid,
      expenseId: exp._id.toString(),
    })
  })

  // Add Shared Settlements to Timeline
  sharedSettlements.forEach((s) => {
    const contactWasPayer = s.fromParticipantId === contactIdStr
    timelineEvents.push({
      id: `settlement-${s._id.toString()}`,
      type: "settlement",
      date: new Date(s.settledAt),
      title: contactWasPayer ? `Settlement Payment from ${contact.name}` : `Settlement Payment to ${contact.name}`,
      description: s.notes ? `"${s.notes}"` : `Recorded settlement (${s.paymentMethod || "Cash"})`,
      amount: s.amount,
      currency: s.currency,
      isLent: !contactWasPayer,
      settlementId: s._id.toString(),
    })
  })

  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime())

  const lastActivity = timelineEvents[0]
  const totalRepayments = localRepayments.length
  const avgRepayment = totalRepayments > 0
    ? Math.round(localRepayments.reduce((sum, r) => sum + r.amount, 0) / totalRepayments)
    : 0

  // Calculate combined Loans + Shared Expenses & Settlements totals
  let contactSharedExpensesOwedToUser = 0
  let userSharedExpensesOwedToContact = 0

  sharedExpenses.forEach((exp) => {
    const contactP = exp.participants.find((p) => p.participantId === contactIdStr)
    const userP = exp.participants.find((p) => p.participantType === "user")

    if (!contactP || !userP) return

    if (exp.paidByParticipantId === userP.participantId) {
      contactSharedExpensesOwedToUser += contactP.amountOwed
    } else if (exp.paidByParticipantId === contactIdStr) {
      userSharedExpensesOwedToContact += userP.amountOwed
    }
  })

  let contactSettlementPaidToUser = 0
  let userSettlementPaidToContact = 0

  sharedSettlements.forEach((s) => {
    if (s.fromParticipantId === contactIdStr) {
      contactSettlementPaidToUser += s.amount
    } else if (s.toParticipantId === contactIdStr) {
      userSettlementPaidToContact += s.amount
    }
  })

  const lentLoans = localLoans.filter(l => l.type === "lent" && l.status !== "cancelled")
  const borrowedLoans = localLoans.filter(l => l.type === "borrowed" && l.status !== "cancelled")

  const totalLentAmount = lentLoans.reduce((sum, l) => sum + l.amount, 0) + contactSharedExpensesOwedToUser
  const totalLentRepaid = lentLoans.reduce((sum, l) => sum + (l.amount - l.remainingAmount), 0) + contactSettlementPaidToUser
  const totalLentRemaining = Math.max(0, totalLentAmount - totalLentRepaid)
  const lentProgress = totalLentAmount > 0 ? Math.min(100, (totalLentRepaid / totalLentAmount) * 100) : 100

  const totalBorrowedAmount = borrowedLoans.reduce((sum, l) => sum + l.amount, 0) + userSharedExpensesOwedToContact
  const totalBorrowedRepaid = borrowedLoans.reduce((sum, l) => sum + (l.amount - l.remainingAmount), 0) + userSettlementPaidToContact
  const totalBorrowedRemaining = Math.max(0, totalBorrowedAmount - totalBorrowedRepaid)
  const borrowedProgress = totalBorrowedAmount > 0 ? Math.min(100, (totalBorrowedRepaid / totalBorrowedAmount) * 100) : 100

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteContact(contact._id.toString())
      if (result && !result.success) {
        toast.error((result as { error?: string }).error || "Failed to delete contact")
        return
      }
      toast.success("Contact deleted successfully")
      router.push("/contacts")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete contact")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteLoanEvent = async (loanId: string) => {
    setDeletingEventId(loanId)
    try {
      const result = await deleteLoan(loanId)
      if (result && !result.success) {
        toast.error((result as { error?: string }).error || "Failed to delete loan")
        return
      }
      toast.success("Loan deleted")
      setLocalLoans((prev) => prev.filter((l) => l._id.toString() !== loanId))
      setLocalRepayments((prev) => prev.filter((r) => r.loanId !== loanId))
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete loan")
    } finally {
      setDeletingEventId(null)
    }
  }

  const handleDeleteRepaymentEvent = async (repaymentId: string) => {
    setDeletingEventId(repaymentId)
    try {
      const result = await deleteRepayment(repaymentId)
      if (result && !result.success) {
        toast.error((result as { error?: string }).error || "Failed to delete repayment")
        return
      }
      toast.success("Repayment deleted")
      setLocalRepayments((prev) => prev.filter((r) => r._id.toString() !== repaymentId))
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete repayment")
    } finally {
      setDeletingEventId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="rounded-md font-semibold text-[10px] h-5">Active</Badge>
      case "partially_repaid":
        return <Badge variant="outline" className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5">Partial</Badge>
      case "fully_repaid":
        return <Badge variant="default" className="rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px] h-5">Repaid</Badge>
      case "overdue":
        return <Badge variant="destructive" className="rounded-md font-semibold text-[10px] h-5">Overdue</Badge>
      case "cancelled":
        return <Badge variant="outline" className="rounded-md font-semibold text-muted-foreground text-[10px] h-5">Cancelled</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/contacts"
            className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{contact.name}</h1>
              {overdueLoansCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0 h-5">
                  {overdueLoansCount} Overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Contact profile overview and loan settlement history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" asChild className="h-9 rounded-xl font-bold border-border/50 bg-card">
            <Link href={`/shared-expenses?contactId=${contact._id.toString()}`}>
              <HandCoins className="size-4 mr-2 text-emerald-500" />
              Shared Expenses
            </Link>
          </Button>

          <ContactDialog
            initialContact={contact}
            trigger={
              <Button variant="outline" className="h-9 rounded-xl font-bold border-border/50 bg-card">
                <Edit className="size-4 mr-2" /> Edit
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="size-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <Trash2 />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete contact details for <strong>{contact.name}</strong>. You cannot delete a contact if they have active or unpaid loans.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="animate-spin" data-icon="inline-start" />}
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={HandCoins}
          color={accent}
          label="Net Outstanding Balance"
          value={(netOwed > 0 ? "+" : "") + formatCurrency(netOwed, baseCurrency)}
          valueClassName={netOwed > 0 ? "text-emerald-600 dark:text-emerald-400" : netOwed < 0 ? "text-rose-600 dark:text-rose-400" : ""}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Clock}
          color="#f59e0b"
          label="Active Loans"
          value={activeLoans.length}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={ShieldCheck}
          color="#10b981"
          label="Settled Loans"
          value={settledLoansCount}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={HandCoins}
          color="#3b82f6"
          label="Total Loans"
          value={localLoans.length}
        />
      </div>

      {/* Daily Balance History Area Chart */}
      <WalletDetailChart initialData={history} currency={baseCurrency} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column: Contact Info + Loans list ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Info className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Information</span>
            </div>
            <div className="p-4 flex flex-col gap-2.5 text-xs">
              {contact.email ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5">
                  <Mail className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{contact.email}</span>
                </div>
              ) : null}
              {contact.phone ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{contact.phone}</span>
                </div>
              ) : null}
              {!contact.email && !contact.phone && (
                <p className="text-muted-foreground">No email or phone on file.</p>
              )}
              {contact.notes && (
                <div className="pt-2.5 border-t border-border/30">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider block mb-1">Notes</span>
                  <p className="text-[11px] bg-muted/30 p-2 rounded-lg border border-border/20 italic leading-relaxed">
                    {contact.notes}
                  </p>
                </div>
              )}

              <div className="pt-2.5 border-t border-border/30 grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Last Activity</span>
                  <span className="font-semibold text-foreground">{lastActivity ? format(lastActivity.date, "MMM d, yyyy") : "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Repayments</span>
                  <span className="font-semibold text-foreground">{totalRepayments}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Avg. Repay</span>
                  <span className="font-semibold text-foreground truncate">{avgRepayment > 0 ? formatCurrency(avgRepayment, baseCurrency) : "—"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 max-h-[360px] lg:max-h-none lg:h-[260px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Associated Records</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                {localLoans.length + sharedExpenses.length} items
              </span>
            </div>
            {localLoans.length === 0 && sharedExpenses.length === 0 ? (
              <div className="flex flex-1 items-center p-4 text-xs text-muted-foreground">No loans or shared expenses recorded for this contact yet.</div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                  {localLoans.map((loan) => {
                    const isLent = loan.type === "lent"
                    return (
                      <Item
                        key={`loan-${loan._id.toString()}`}
                        asChild
                        size="sm"
                        className="cursor-pointer text-left"
                      >
                        <Link href={`/loans/${loan._id.toString()}`}>
                          <ItemMedia className={cn("size-7 rounded-lg", isLent ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {isLent ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
                          </ItemMedia>
                          <ItemContent className="gap-0.5">
                            <ItemTitle className="gap-1.5">
                              <span className="text-xs font-bold truncate">{formatCurrency(loan.remainingAmount, loan.currency)}</span>
                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 h-4 rounded-md">Loan</Badge>
                              {getStatusBadge(loan.status)}
                            </ItemTitle>
                            <ItemDescription className="text-[10px]">{formatDate(loan.date)}</ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                          </ItemActions>
                        </Link>
                      </Item>
                    )
                  })}
                  {sharedExpenses.map((exp) => {
                    const contactP = exp.participants.find((p) => p.participantId === contactIdStr)
                    const userP = exp.participants.find((p) => p.participantType === "user")
                    const userPaid = userP && exp.paidByParticipantId === userP.participantId

                    return (
                      <Item
                        key={`expense-${exp._id.toString()}`}
                        asChild
                        size="sm"
                        className="cursor-pointer text-left"
                      >
                        <Link href={`/shared-expenses/${exp._id.toString()}`}>
                          <ItemMedia className="size-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <Users2 className="size-3.5" />
                          </ItemMedia>
                          <ItemContent className="gap-0.5">
                            <ItemTitle className="gap-1.5">
                              <span className="text-xs font-bold truncate">{exp.title}</span>
                              <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 h-4 rounded-md">Shared Expense</Badge>
                            </ItemTitle>
                            <ItemDescription className="text-[10px]">
                              {userPaid ? `Contact owes ${formatCurrency(contactP?.amountOwed || 0, exp.currency)}` : `You owe ${formatCurrency(userP?.amountOwed || 0, exp.currency)}`} · {formatDate(exp.date)}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                          </ItemActions>
                        </Link>
                      </Item>
                    )
                  })}
                </ItemGroup>
              </ScrollArea>
            )}
          </Card>
        </div>

        {/* ── Right column: Timeline ── */}
        <div className="lg:col-span-2 lg:h-0 lg:min-h-full flex flex-col gap-4">
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 max-h-[480px] lg:max-h-none flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">History &amp; Timeline</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                {timelineEvents.length} event{timelineEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <HandCoins className="size-10 text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground text-sm">No history yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">Loans, shared expenses, and settlements involving this contact will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                  {timelineEvents.map((event) => {
                    let iconColor = "bg-muted text-muted-foreground border-border/40"
                    let DotIcon = Clock

                    if (event.type === "loan_created") {
                      iconColor = "bg-primary/10 text-primary border-primary/20"
                      DotIcon = HandCoins
                    } else if (event.type === "repayment") {
                      iconColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      DotIcon = CheckCircle2
                    } else if (event.type === "overdue") {
                      iconColor = "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      DotIcon = AlertCircle
                    } else if (event.type === "shared_expense") {
                      iconColor = "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      DotIcon = Users2
                    } else if (event.type === "settlement") {
                      iconColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      DotIcon = HandCoins
                    }

                    const eventHref =
                      event.type === "shared_expense" && event.expenseId
                        ? `/shared-expenses/${event.expenseId}`
                        : event.type === "settlement"
                        ? `/shared-expenses`
                        : event.loanId
                        ? `/loans/${event.loanId}`
                        : "#"

                    return (
                      <Item key={event.id} size="sm" className="group flex items-center justify-between gap-3 overflow-hidden" asChild>
                        <Link href={eventHref}>
                          <ItemMedia className={cn("size-8 rounded-xl border flex items-center justify-center shrink-0", iconColor)}>
                            <DotIcon className="size-3.5" />
                          </ItemMedia>

                          <ItemContent className="gap-0.5 min-w-0 flex-1">
                            <ItemTitle className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground truncate">{event.title}</span>
                              <span className="text-[10px] font-normal text-muted-foreground shrink-0">{format(event.date, "PP")}</span>
                            </ItemTitle>
                            <ItemDescription className="line-clamp-2 text-[11px] text-muted-foreground leading-snug">
                              {event.description}
                            </ItemDescription>
                          </ItemContent>

                          <ItemActions className="shrink-0 flex items-center gap-1.5 ml-auto text-right">
                            {event.amount !== undefined && (
                              <span className={cn("text-xs font-bold whitespace-nowrap tabular-nums text-right", event.type === "overdue" ? "text-rose-500" : "")}>
                                {event.type === "repayment" ? "-" : ""}{formatCurrency(event.amount, event.currency)}
                              </span>
                            )}

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <div className="size-6 flex items-center justify-center">
                                {event.type === "repayment" && event.repaymentId && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                          <Trash2 />
                                        </AlertDialogMedia>
                                        <AlertDialogTitle>Delete this repayment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will delete this repayment transaction, update the loan balance, and revert the wallet balance. This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel disabled={deletingEventId === event.repaymentId}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          disabled={deletingEventId === event.repaymentId}
                                          onClick={() => handleDeleteRepaymentEvent(event.repaymentId!)}
                                        >
                                          Delete Repayment
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}

                                {event.type === "loan_created" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                          <Trash2 />
                                        </AlertDialogMedia>
                                        <AlertDialogTitle>Delete this loan record?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete this loan, all its repayments, and revert the associated wallet balances.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel disabled={deletingEventId === event.loanId}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          disabled={deletingEventId === event.loanId}
                                          onClick={() => event.loanId && handleDeleteLoanEvent(event.loanId)}
                                        >
                                          Delete Loan
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </ItemActions>
                        </Link>
                      </Item>
                    )
                  })}
                </ItemGroup>
              </ScrollArea>
            )}
          </Card>

          {/* New Card: Repayment & Settlement Progress */}
          <Card className="rounded-2xl border border-border/40 shadow-sm p-4 h-[210px] flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between border-b border-border/30 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                <span className="text-sm font-bold">Settlement Progress</span>
              </div>
              {lentLoans.length === 0 && borrowedLoans.length === 0 ? (
                <span className="text-xs font-bold text-emerald-500">100% Settled</span>
              ) : (
                <span className="text-xs font-bold text-primary">
                  {lentLoans.length > 0 && borrowedLoans.length > 0
                    ? `${Math.round((lentProgress + borrowedProgress) / 2)}% complete`
                    : lentLoans.length > 0
                    ? `${Math.round(lentProgress)}% complete`
                    : `${Math.round(borrowedProgress)}% complete`}
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center gap-3 py-2 min-h-0 overflow-y-auto">
              {lentLoans.length === 0 && borrowedLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <ShieldCheck className="size-8 text-emerald-500 mb-1.5" />
                  <p className="text-xs font-bold">All accounts settled!</p>
                  <p className="text-[10px] text-muted-foreground">No active loans recorded for this contact.</p>
                </div>
              ) : (
                <>
                  {lentLoans.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ArrowUpRight className="size-3 text-emerald-500" /> Lent to {contact.name}
                        </span>
                        <span className="text-foreground">
                          {formatCurrency(totalLentRepaid, baseCurrency)} / {formatCurrency(totalLentAmount, baseCurrency)}
                        </span>
                      </div>
                      <Progress
                        value={lentProgress}
                        indicatorStyle={{ backgroundColor: lentProgress >= 100 ? "#10b981" : "var(--primary)" }}
                        className="h-2 bg-muted/60"
                      />
                    </div>
                  )}

                  {borrowedLoans.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ArrowDownLeft className="size-3 text-rose-500" /> Borrowed from {contact.name}
                        </span>
                        <span className="text-foreground">
                          {formatCurrency(totalBorrowedRepaid, baseCurrency)} / {formatCurrency(totalBorrowedAmount, baseCurrency)}
                        </span>
                      </div>
                      <Progress
                        value={borrowedProgress}
                        indicatorStyle={{ backgroundColor: borrowedProgress >= 100 ? "#10b981" : "var(--primary)" }}
                        className="h-2 bg-muted/60"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick metrics grid at the bottom, just like loans/goals cards */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 shrink-0">
              <div className="flex flex-col gap-0.5 rounded-lg border border-border/30 bg-muted/20 px-2 py-1">
                <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Total Active</span>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {formatCurrency(totalLentRemaining + totalBorrowedRemaining, baseCurrency)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg border border-border/30 bg-muted/20 px-2 py-1">
                <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Total Repaid</span>
                <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalLentRepaid + totalBorrowedRepaid, baseCurrency)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg border border-border/30 bg-muted/20 px-2 py-1">
                <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Overall Ratio</span>
                <span className="text-xs font-bold tabular-nums text-blue-500">
                  {lentLoans.length > 0 || borrowedLoans.length > 0
                    ? `${Math.round(
                        ((totalLentRepaid + totalBorrowedRepaid) /
                          ((totalLentAmount + totalBorrowedAmount) || 1)) *
                          100
                      )}%`
                    : "100%"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}