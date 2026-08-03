"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loan, LoanRepayment, Wallet, Contact } from "@/types"
import { deleteLoan, deleteRepayment } from "@/lib/actions/loans"
import { LoanDialog } from "./loan-dialog"
import { RepaymentDialog } from "./repayment-dialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
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
  Calendar,
  Wallet as WalletIcon,
  Percent,
  Trash2,
  Edit,
  HandCoins,
  MessageSquare,
  Copy,
  Check,
  Plus,
  Clock,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail as MailIcon,
  Phone,
  BellRing,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Send,
  CalendarClock,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

interface LoanDetailsProps {
  loan: Loan
  repayments: LoanRepayment[]
  wallets: Wallet[]
  contacts: Contact[]
}

export function LoanDetails({
  loan,
  repayments,
  wallets,
  contacts,
}: LoanDetailsProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingLoanFromTimeline, setIsDeletingLoanFromTimeline] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [msgChannel, setMsgChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp")
  const [localRepayments, setLocalRepayments] = useState(repayments)
  const [customMessage, setCustomMessage] = useState("")

  useEffect(() => {
    setLocalRepayments(repayments)
  }, [repayments])

  const isLent = loan.type === "lent"
  const accent = isLent ? "#10b981" : "#ef4444"
  const repaidAmount = loan.amount - loan.remainingAmount
  const progress = loan.amount > 0 ? (repaidAmount / loan.amount) * 100 : 0
  const associatedWallet = wallets.find(w => w._id.toString() === loan.walletId)
  const matchedContact = contacts.find(
    c => c._id.toString() === loan.contactId || c.name === loan.personName
  )

  const daysUntilDue = loan.dueDate ? differenceInDays(new Date(loan.dueDate), new Date()) : null
  const isOverdue = loan.status === "overdue"
  const daysActive = Math.max(0, differenceInDays(new Date(), new Date(loan.date)))
  const sentRemindersCount = (loan.sentReminders || []).length
  const totalRemindersCount = (loan.reminderSchedule || []).length

  // Accrued Interest Estimation
  const calculateAccruedInterest = () => {
    if (!loan.interestRate || loan.interestRate <= 0) return 0
    const startDate = new Date(loan.date)
    const daysElapsed = Math.max(0, differenceInDays(new Date(), startDate))
    const yearsElapsed = daysElapsed / 365
    const interest = loan.amount * (loan.interestRate / 100) * yearsElapsed
    return Math.round(interest)
  }
  const estimatedInterest = calculateAccruedInterest()

  // Chronological Timeline Events
  interface TimelineEvent {
    id: string
    type: "created" | "repayment" | "overdue" | "completed"
    date: Date
    title: string
    description: string
    amount?: number
    repaymentId?: string
    transactionId?: string
  }

  const timelineEvents: TimelineEvent[] = []

  timelineEvents.push({
    id: "created",
    type: "created",
    date: new Date(loan.date),
    title: "Loan Recorded",
    description: isLent
      ? `Lent to ${loan.personName} via ${associatedWallet?.name || "Unknown"}`
      : `Borrowed from ${loan.personName} into ${associatedWallet?.name || "Unknown"}`,
    amount: loan.amount,
    transactionId: loan.transactionId,
  })

  localRepayments.forEach((rep) => {
    timelineEvents.push({
      id: rep._id.toString(),
      type: "repayment",
      date: new Date(rep.date),
      title: "Repayment Logged",
      description: rep.notes ? `"${rep.notes}"` : `Repayment from ${loan.personName}`,
      amount: rep.amount,
      repaymentId: rep._id.toString(),
      transactionId: rep.transactionId,
    })
  })

  if (loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status !== "fully_repaid" && loan.status !== "cancelled") {
    timelineEvents.push({
      id: "overdue",
      type: "overdue",
      date: new Date(loan.dueDate),
      title: "Loan Overdue",
      description: `Passed due date on ${format(new Date(loan.dueDate), "PP")}`,
    })
  }

  if (loan.status === "fully_repaid" && localRepayments.length > 0) {
    const latestRep = localRepayments.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest
    }, localRepayments[0])

    timelineEvents.push({
      id: "completed",
      type: "completed",
      date: new Date(latestRep.date),
      title: "Loan Fully Repaid",
      description: "All balances have been fully settled",
    })
  }

  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime())

  const lastActivity = timelineEvents[0]
  const avgRepayment = localRepayments.length > 0
    ? Math.round(localRepayments.reduce((sum, r) => sum + r.amount, 0) / localRepayments.length)
    : 0

  // Reminder Message Generator
  const generateMessage = (channel: "whatsapp" | "sms" | "email") => {
    const name = loan.personName
    const formattedTotal = formatCurrency(loan.amount, loan.currency)
    const formattedRemaining = formatCurrency(loan.remainingAmount, loan.currency)
    const formattedDate = loan.dueDate ? format(new Date(loan.dueDate), "MMM dd, yyyy") : "soon"
    const loanDate = format(new Date(loan.date), "MMMM dd, yyyy")
    const senderName = session?.user?.name || "Me"

    if (isLent) {
      switch (channel) {
        case "whatsapp":
          return `Hi ${name}! Just a friendly reminder about the loan of ${formattedTotal} from ${loanDate}. The outstanding balance is ${formattedRemaining}, which is due ${formattedDate}. Let me know when you make the transfer. Thanks!`
        case "sms":
          return `Hi ${name}, friendly reminder that ${formattedRemaining} is outstanding on the loan from ${loanDate}. Due on ${formattedDate}. Thanks!`
        case "email":
          return `Subject: Loan Repayment Reminder\n\nHi ${name},\n\nI hope you're doing well. This is a friendly reminder regarding the loan of ${formattedTotal} recorded on ${loanDate}.\n\nThe outstanding balance is ${formattedRemaining}, which is due on ${formattedDate}.\n\nPlease let me know when you've initiated the transfer. Thank you!\n\nBest regards,\n${senderName}`
      }
    } else {
      switch (channel) {
        case "whatsapp":
          return `Hi ${name}! Regarding the loan of ${formattedTotal} I borrowed on ${loanDate}, I wanted to update you that the remaining balance is ${formattedRemaining}. I'm planning to pay it back ${formattedDate}. Thanks for your patience!`
        case "sms":
          return `Hi ${name}, just updating you that the remaining balance on my loan is ${formattedRemaining}. Planned repayment is ${formattedDate}. Thank you!`
        case "email":
          return `Subject: Update on Loan Repayment\n\nHi ${name},\n\nI hope you're doing well. I wanted to send you a quick update regarding the loan of ${formattedTotal} I borrowed on ${loanDate}.\n\nThe remaining balance is ${formattedRemaining}, and I am on track to repay it ${formattedDate}.\n\nThank you again for your support and patience.\n\nBest,\n${senderName}`
      }
    }
  }

  useEffect(() => {
    setCustomMessage(generateMessage(msgChannel) || "")
  }, [msgChannel, loan.remainingAmount, session?.user?.name])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    toast.success(`Copied ${label} template`)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Build the outbound link for a given channel, splitting subject/body for email
  const getSendLink = (channel: "whatsapp" | "sms" | "email") => {
    const message = customMessage || ""
    if (channel === "whatsapp") {
      if (!matchedContact?.phone) return null
      const digits = matchedContact.phone.replace(/[^\d+]/g, "").replace(/^\+/, "")
      return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    }
    if (channel === "sms") {
      if (!matchedContact?.phone) return null
      return `sms:${matchedContact.phone}?&body=${encodeURIComponent(message)}`
    }
    if (channel === "email") {
      if (!matchedContact?.email) return null
      const subjectMatch = message.match(/^Subject:\s*(.+)\n\n([\s\S]*)$/)
      const subject = subjectMatch ? subjectMatch[1] : "Loan Update"
      const body = subjectMatch ? subjectMatch[2] : message
      return `mailto:${matchedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
    return null
  }

  const sendLink = getSendLink(msgChannel)
  const canSendChannel = {
    whatsapp: !!matchedContact?.phone,
    sms: !!matchedContact?.phone,
    email: !!matchedContact?.email,
  }

  const handleSendEmail = (type: "mailto" | "gmail") => {
    if (!matchedContact?.email) {
      toast.error("No email on file for this contact")
      return
    }

    const message = customMessage || ""
    const subjectMatch = message.match(/^Subject:\s*(.+)\n\n([\s\S]*)$/)
    const subject = subjectMatch ? subjectMatch[1] : "Loan Update"
    const body = subjectMatch ? subjectMatch[2] : message

    if (type === "mailto") {
      const mailtoLink = `mailto:${matchedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = mailtoLink
    } else {
      const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(matchedContact.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(gmailLink, "_blank")
    }
  }

  const handleSend = () => {
    if (!sendLink) {
      toast.error(msgChannel === "email" ? "No email on file for this contact" : "No phone number on file for this contact")
      return
    }
    window.open(sendLink, "_blank")
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteLoan(loan._id.toString())
      if (result && !result.success) {
        toast.error((result as any).error || "Failed to delete loan")
        return
      }
      toast.success("Loan deleted successfully")
      router.push("/loans")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete loan")
    } finally {
      setIsDeleting(false)
    }
  }

  // Deleting the loan directly from the timeline (the "created" event) — same as header delete, with redirect
  const handleDeleteLoanFromTimeline = async () => {
    setIsDeletingLoanFromTimeline(true)
    try {
      const result = await deleteLoan(loan._id.toString())
      if (result && !result.success) {
        toast.error((result as any).error || "Failed to delete loan")
        return
      }
      toast.success("Loan deleted successfully")
      router.push("/loans")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete loan")
    } finally {
      setIsDeletingLoanFromTimeline(false)
    }
  }

  const handleDeleteRepayment = async (repId: string) => {
    try {
      const result = await deleteRepayment(repId)
      if (result && !result.success) {
        toast.error(result.error || "Failed to delete repayment")
        return
      }
      toast.success("Repayment deleted")
      setLocalRepayments((prev) => prev.filter((r) => r._id.toString() !== repId))
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete repayment")
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

  const reminderLabels: Record<number, string> = { 7: "7 days before", 3: "3 days before", 1: "1 day before", 0: "On due date" }
  const activeReminders = (loan.reminderSchedule || []).slice().sort((a, b) => b - a)

  const canRepay = loan.status !== "fully_repaid" && loan.status !== "cancelled"

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* ── Header (matches Loans list page pattern) ────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/loans"
            className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{loan.personName}</h1>
              {getStatusBadge(loan.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLent ? "Money Lent (Receivable)" : "Money Borrowed (Payable)"} · Started {formatDate(loan.date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canRepay && (
            <RepaymentDialog
              loan={loan}
              wallets={wallets}
              trigger={
                <Button className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
                  <Plus className="size-4" />
                  Log Repayment
                </Button>
              }
            />
          )}
          <LoanDialog
            wallets={wallets}
            contacts={contacts}
            initialLoan={loan}
            trigger={
              <Button variant="outline" size="icon" className="size-10 rounded-xl">
                <Edit className="size-4" />
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="size-10 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <Trash2 />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete this loan record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this loan, all repayments, and revert the wallet balances of all associated transactions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-semibold" disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="rounded-xl font-semibold"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete Loan"}
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
          icon={isLent ? ArrowUpRight : ArrowDownLeft}
          color={accent}
          label="Outstanding Balance"
          value={formatCurrency(loan.remainingAmount, loan.currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={CheckCircle2}
          color="#10b981"
          label="Repaid"
          value={`${progress.toFixed(0)}%`}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={WalletIcon}
          color="#3b82f6"
          label="Principal"
          value={formatCurrency(loan.amount, loan.currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Calendar}
          color={isOverdue ? "#f43f5e" : "#f59e0b"}
          label="Due Date"
          value={loan.dueDate ? format(new Date(loan.dueDate), "MMM d, yyyy") : "No due date"}
          valueClassName={isOverdue ? "text-rose-600 dark:text-rose-400" : ""}
        />
      </div>

      {/* ── Progress Card (wider, with inline breakdown) ────────── */}
      <Card className="rounded-2xl border border-border/40 shadow-sm p-5 gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-sm font-bold">Settlement Progress</span>
          </div>
          <span className={cn("text-xs font-bold tabular-nums", progress >= 100 ? "text-emerald-500" : "text-primary")}>
            {progress.toFixed(1)}% complete
          </span>
        </div>

        <Progress
          value={progress}
          indicatorStyle={{ backgroundColor: progress >= 100 ? "#10b981" : "var(--primary)" }}
          className="h-2.5 bg-muted/60"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Repaid</span>
            <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(repaidAmount, loan.currency)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Remaining</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(loan.remainingAmount, loan.currency)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Repayments Made</span>
            <span className="text-sm font-bold tabular-nums">{localRepayments.length}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Accrued Interest</span>
            <span className="text-sm font-bold tabular-nums">{loan.interestRate ? formatCurrency(estimatedInterest, loan.currency) : "—"}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column: Loan Info + Contact + Reminder Schedule ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Info className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Loan Information</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <User className="size-3" /> Type
                </span>
                <span className="font-semibold">{isLent ? "Receivable" : "Payable"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <WalletIcon className="size-3" /> Wallet
                </span>
                <span className="font-semibold truncate">{associatedWallet?.name || "Unknown"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Calendar className="size-3" /> Start Date
                </span>
                <span className="font-semibold">{formatDate(loan.date)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Clock className="size-3" /> Due Date
                </span>
                <span className={cn("font-semibold", isOverdue && "text-rose-500")}>
                  {loan.dueDate ? formatDate(loan.dueDate) : "None"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 col-span-2">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Percent className="size-3" /> Interest Rate
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {loan.interestRate ? `${loan.interestRate}% annual` : "Interest-free"}
                  </span>
                  {loan.interestRate && loan.interestRate > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      Accrued: <span className="font-bold text-foreground">{formatCurrency(estimatedInterest, loan.currency)}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground">
                            <Info className="size-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-3 text-xs w-60 border border-border/40 shadow-lg" align="end">
                          Simple interest estimated based on principal and elapsed days since start. For record-keeping only — not auto-added to balance.
                        </PopoverContent>
                      </Popover>
                    </span>
                  ) : null}
                </div>
              </div>

              {loan.notes && (
                <div className="col-span-2 pt-2.5 border-t border-border/30">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider block mb-1">Notes</span>
                  <p className="text-[11px] bg-muted/30 p-2 rounded-lg border border-border/20 italic leading-relaxed">
                    {loan.notes}
                  </p>
                </div>
              )}

              <div className="col-span-2 pt-2.5 border-t border-border/30 grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Last Activity</span>
                  <span className="font-semibold text-foreground">{lastActivity ? format(lastActivity.date, "MMM d, yyyy") : "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Repayments</span>
                  <span className="font-semibold text-foreground">{localRepayments.length}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Avg. Repay</span>
                  <span className="font-semibold text-foreground truncate">{avgRepayment > 0 ? formatCurrency(avgRepayment, loan.currency) : "—"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Details — uses matched contact from contacts list */}
          {matchedContact && (matchedContact.email || matchedContact.phone) && (
            <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Details</span>
              </div>
              <div className="p-4 flex flex-col gap-2.5 text-xs">
                {matchedContact.email && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5">
                    <MailIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{matchedContact.email}</span>
                  </div>
                )}
                {matchedContact.phone && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5">
                    <Phone className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{matchedContact.phone}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Reminder Schedule — uses loan.reminderSchedule already stored */}
          {loan.dueDate && activeReminders.length > 0 && (
            <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
                <BellRing className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reminder Schedule</span>
              </div>
              <div className="p-4 flex flex-wrap gap-1.5">
                {activeReminders.map((d) => (
                  <Badge key={d} variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-semibold border-primary/20 bg-primary/5 text-primary">
                    {reminderLabels[d] || `${d} days before`}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right column: Timeline + Reminder Message ───────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:h-0 lg:min-h-full">
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



            {/* Row-card timeline — bordered rows instead of a sparse dotted line */}
            <ScrollArea className="flex-1 min-h-0">
              <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                {timelineEvents.map((event) => {
                  let iconColor = "bg-muted text-muted-foreground border-border/40"
                  let DotIcon = Clock

                  if (event.type === "created") {
                    iconColor = "bg-primary/10 text-primary border-primary/20"
                    DotIcon = HandCoins
                  } else if (event.type === "repayment") {
                    iconColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    DotIcon = CheckCircle2
                  } else if (event.type === "overdue") {
                    iconColor = "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    DotIcon = AlertCircle
                  } else if (event.type === "completed") {
                    iconColor = "bg-emerald-500 text-white border-emerald-500"
                    DotIcon = Check
                  }

                  const hasLink = !!event.transactionId

                  return (
                    <Item key={event.id} size="sm" className="group" asChild={hasLink}>
                      {hasLink ? (
                        <Link href={`/transactions/${event.transactionId}`}>
                          <ItemMedia className={cn("size-8 rounded-xl border", iconColor)}>
                            <DotIcon className="size-3.5" />
                          </ItemMedia>

                          <ItemContent className="gap-0.5">
                            <ItemTitle className="flex-wrap gap-2">
                              <span className="text-xs font-bold text-foreground">{event.title}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">{format(event.date, "PP")}</span>
                            </ItemTitle>
                            <ItemDescription className="truncate text-[11px]">
                              {event.description}
                            </ItemDescription>
                          </ItemContent>

                          <ItemActions>
                            <span className="text-xs font-bold whitespace-nowrap tabular-nums min-w-[76px] text-right">
                              {event.amount !== undefined
                                ? `${event.type === "repayment" ? "-" : ""}${formatCurrency(event.amount, loan.currency)}`
                                : ""}
                            </span>

                            {/* Fixed-width slot so amounts align across rows whether or not a delete action is present */}
                            <div className="size-6 flex items-center justify-center shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              {event.type === "repayment" && event.repaymentId && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
                                    <AlertDialogHeader>
                                      <AlertDialogMedia>
                                        <Trash2 />
                                      </AlertDialogMedia>
                                      <AlertDialogTitle>Delete this repayment?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will delete this repayment transaction, update the loan balance, and revert the wallet balance. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        variant="destructive"
                                        className="rounded-xl font-semibold"
                                        onClick={() => handleDeleteRepayment(event.repaymentId!)}
                                      >
                                        Delete Repayment
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {event.type === "created" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
                                    <AlertDialogHeader>
                                      <AlertDialogMedia>
                                        <Trash2 />
                                      </AlertDialogMedia>
                                      <AlertDialogTitle>Delete this loan record?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this loan, all repayments, and revert the wallet balances of all associated transactions. You'll be taken back to the loans list.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl font-semibold" disabled={isDeletingLoanFromTimeline}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        variant="destructive"
                                        className="rounded-xl font-semibold"
                                        disabled={isDeletingLoanFromTimeline}
                                        onClick={handleDeleteLoanFromTimeline}
                                      >
                                        {isDeletingLoanFromTimeline ? "Deleting..." : "Delete Loan"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </ItemActions>
                        </Link>
                      ) : (
                        <>
                          <ItemMedia className={cn("size-8 rounded-xl border", iconColor)}>
                            <DotIcon className="size-3.5" />
                          </ItemMedia>

                          <ItemContent className="gap-0.5">
                            <ItemTitle className="flex-wrap gap-2">
                              <span className="text-xs font-bold text-foreground">{event.title}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">{format(event.date, "PP")}</span>
                            </ItemTitle>
                            <ItemDescription className="truncate text-[11px]">
                              {event.description}
                            </ItemDescription>
                          </ItemContent>

                          <ItemActions>
                            <span className="text-xs font-bold whitespace-nowrap tabular-nums min-w-[76px] text-right">
                              {event.amount !== undefined
                                ? `${event.type === "repayment" ? "-" : ""}${formatCurrency(event.amount, loan.currency)}`
                                : ""}
                            </span>
                            <div className="size-6 flex items-center justify-center shrink-0" />
                          </ItemActions>
                        </>
                      )}
                    </Item>
                  )
                })}
              </ItemGroup>
            </ScrollArea>
          </Card>

          {/* Reminder Message — moved here to balance column height */}
          {canRepay && (
            <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
                <MessageSquare className="size-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reminder Message</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Tabs value={msgChannel} onValueChange={(v) => setMsgChannel(v as any)} className="flex-1 min-w-[240px]">
                    <TabsList className="w-full h-8 grid grid-cols-3">
                      <TabsTrigger value="whatsapp" className="text-[10px] gap-1">
                        <MessageCircle className="size-3" /> WhatsApp
                      </TabsTrigger>
                      <TabsTrigger value="sms" className="text-[10px] gap-1">
                        <MessageSquare className="size-3" /> SMS
                      </TabsTrigger>
                      <TabsTrigger value="email" className="text-[10px] gap-1">
                        <MailIcon className="size-3" /> Email
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs font-bold"
                      onClick={() => handleCopy(customMessage, msgChannel)}
                    >
                      {copiedText === msgChannel ? (
                        <>
                          <Check className="size-3.5 mr-1.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 mr-1.5" /> Copy
                        </>
                      )}
                    </Button>
                    {msgChannel === "email" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs font-bold"
                          onClick={() => handleSendEmail("mailto")}
                          disabled={!canSendChannel.email}
                        >
                          <Send className="size-3.5 mr-1.5" />
                          Mail App
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 rounded-lg text-xs font-bold"
                          onClick={() => handleSendEmail("gmail")}
                          disabled={!canSendChannel.email}
                        >
                          <MailIcon className="size-3.5 mr-1.5" />
                          Gmail
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg text-xs font-bold"
                        onClick={handleSend}
                        disabled={!canSendChannel[msgChannel]}
                      >
                        <Send className="size-3.5 mr-1.5" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>

                {!canSendChannel[msgChannel] && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Info className="size-3" />
                    {msgChannel === "email"
                      ? "Add an email for this contact to send directly."
                      : "Add a phone number for this contact to send directly."}
                  </p>
                )}

                <ScrollArea className="h-[120px] bg-muted/30 border border-border/20 rounded-lg">
                  <div className="p-3">
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto"
                          el.style.height = el.scrollHeight + "px"
                        }
                      }}
                      className="w-full bg-transparent border-0 outline-none resize-none focus:outline-none focus:ring-0 md:text-sm text-[11px] text-foreground/80 leading-relaxed font-sans overflow-hidden"
                      value={customMessage}
                      spellCheck={false}
                      onChange={(e) => {
                        setCustomMessage(e.target.value)
                        e.target.style.height = "auto"
                        e.target.style.height = e.target.scrollHeight + "px"
                      }}
                    />
                  </div>
                </ScrollArea>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}