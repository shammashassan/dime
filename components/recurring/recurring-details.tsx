"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RecurringRule, BillInstance, Transaction, Wallet, Category } from "@/types"
import { deleteRecurringRule, toggleRecurringRuleActive, processRecurringRuleNow } from "@/lib/actions/recurring"
import { deleteTransaction } from "@/lib/actions/transactions"
import { deleteBillInstance, skipBillInstance } from "@/lib/actions/bills"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecurringForm } from "./recurring-form"
import { PayBillForm } from "./pay-bill-form"
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
  ArrowLeft, Edit, Trash2, Calendar, RefreshCw, Loader2, Play, Pause,
  CheckCircle2, AlertTriangle, Clock, Wallet as WalletIcon, TrendingUp, TrendingDown,
  Info, ExternalLink, Ban, BellRing, Activity,
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { format, differenceInDays } from "date-fns"
import { Area, AreaChart, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import Link from "next/link"
import { toast } from "sonner"
import { CategoryIcon } from "../categories/category-icon"

interface RecurringDetailsProps {
  rule: RecurringRule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any[]
  wallets: Wallet[]
  categories: Category[]
}

export function RecurringDetails({
  rule,
  history,
  wallets,
  categories,
}: RecurringDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [payingBill, setPayingBill] = useState<BillInstance | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localHistory = history.filter((h: any) => !deletedIds.has(h._id?.toString() || ""))

  const isBill = rule.kind === "bill"
  const isSubscription = rule.kind === "subscription"

  const category = categories.find((c) => c._id.toString() === rule.categoryId)
  const wallet = wallets.find((w) => w._id.toString() === rule.walletId)

  const accent = category?.color || (rule.type === "income" ? "#10b981" : "#888")

  const lastActivity = localHistory[0]
  const avgAmount = localHistory.length > 0
    ? Math.round(
      localHistory.reduce((s: number, h: { status?: string; actualAmount?: number; expectedAmount?: number; amount?: number }) => s + (isBill ? (h.status === "paid" ? h.actualAmount : h.expectedAmount) || 0 : h.amount || 0), 0) / localHistory.length
    )
    : 0
  const paidOrProcessedCount = isBill
    ? (localHistory as BillInstance[]).filter((b) => b.status === "paid").length
    : localHistory.length

  // ── Trend & Reliability data ──
  // Sparkline data — chronological order, last 8 points
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sparklineData = [...localHistory]
    .slice(0, 8)
    .reverse()
    .map((h: any, i: number) => ({
      i,
      date: format(new Date(isBill ? h.dueDate : h.date), "MMM d"),
      amount: isBill ? (h.status === "paid" ? h.actualAmount : h.expectedAmount) || 0 : h.amount || 0,
    }))

  const trendChartConfig = {
    amount: {
      label: rule.description,
      color: accent,
    },
  } satisfies ChartConfig

  // On-time rate (bills only)
  const paidBills = isBill ? (localHistory as BillInstance[]).filter((b) => b.status === "paid") : []
  const onTimeBills = paidBills.filter((b) => b.paidDate && new Date(b.paidDate) <= new Date(b.dueDate))
  const onTimeRate = paidBills.length > 0 ? Math.round((onTimeBills.length / paidBills.length) * 100) : null

  // Trend: latest amount vs. historical average
  const trendValues = sparklineData.map((d) => d.amount)
  const latestValue = trendValues[trendValues.length - 1] || 0
  const priorValues = trendValues.slice(0, -1)
  const priorAvg = priorValues.length > 0 ? priorValues.reduce((s, v) => s + v, 0) / priorValues.length : 0
  const trendPct = priorAvg > 0 ? Math.round(((latestValue - priorAvg) / priorAvg) * 100) : 0
  const trendDirection = trendPct > 2 ? "up" : trendPct < -2 ? "down" : "flat"

  const daysUntilNext = differenceInDays(new Date(rule.nextDueDate), new Date())

  const handleDelete = async () => {
    setIsDeleting(true)
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await deleteRecurringRule(rule._id.toString())
        if (!res.success) throw new Error(res.error || "Failed to delete")
        router.push("/recurring")
        resolve(true)
      } catch (err) {
        setIsDeleting(false)
        reject(err)
      }
    })
    toast.promise(p, { loading: "Deleting...", success: "Deleted", error: "Failed to delete" })
  }

  const handleToggleActive = async () => {
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await toggleRecurringRuleActive(rule._id.toString())
        if (!res.success) throw new Error(res.error || "Failed to update")
        router.refresh()
        resolve(res)
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Updating...", success: "Status updated", error: "Failed to update" })
  }

  const handleDeleteTransaction = async (txId: string) => {
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await deleteTransaction(txId)
        if (res && !res.success) throw new Error(res.error || "Failed to delete")
        setDeletedIds((prev) => new Set(prev).add(txId))
        router.refresh()
        resolve(true)
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Deleting...", success: "Transaction deleted", error: (err: unknown) => err instanceof Error ? err.message : "Failed to delete" })
  }

  const handleDeleteBill = async (bill: BillInstance) => {
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await deleteBillInstance(bill._id.toString())
        if (res && !res.success) throw new Error("Failed to delete")
        setDeletedIds((prev) => new Set(prev).add(bill._id.toString()))
        router.refresh()
        resolve(true)
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Deleting...", success: "Bill deleted", error: (err: unknown) => err instanceof Error ? err.message : "Failed to delete" })
  }

  const handleSkipBill = async (bill: BillInstance) => {
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await skipBillInstance(bill._id.toString())
        if (res && !res.success) throw new Error("Failed to skip")
        router.refresh()
        resolve(true)
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Skipping...", success: "Bill marked as skipped", error: (err: unknown) => err instanceof Error ? err.message : "Failed to skip" })
  }

  const handleProcessNow = async () => {
    setIsProcessing(true)
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await processRecurringRuleNow(rule._id.toString())
        if (!res.success) throw new Error(res.error || "Failed to process")
        router.refresh()
        resolve(res)
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Processing...", success: "Processed successfully", error: "Failed to process" })
    try { await p } catch { } finally { setIsProcessing(false) }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/recurring"
            className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{rule.description}</h1>
              <Badge variant="outline" className="rounded-full px-2 py-0 h-5 capitalize" style={{ color: accent, borderColor: accent + "40", backgroundColor: accent + "10" }}>
                {rule.kind || "Recurring"}
              </Badge>
              <Badge variant="secondary" className={cn("rounded-full px-2 py-0 h-5", rule.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                {rule.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatCurrency(rule.amount, rule.currency)} · <span className="capitalize">{rule.frequency}</span> · Started {formatDate(rule.startDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={handleToggleActive} className="h-9 rounded-xl font-bold border-border/50 bg-card">
            {rule.isActive ? <Pause className="size-4 mr-2" /> : <Play className="size-4 mr-2" />}
            {rule.isActive ? "Pause" : "Resume"}
          </Button>
          <Button onClick={() => setIsEditOpen(true)} className="h-9 rounded-xl font-bold bg-primary hover:bg-primary/90">
            <Edit className="size-4 mr-2" /> Edit
          </Button>
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
                <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this recurring template. Past transactions or bill instances will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="animate-spin" data-icon="inline-start" />} Delete
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
          icon={rule.type === "income" ? TrendingUp : TrendingDown}
          color={accent}
          label="Amount"
          value={(rule.type === "income" ? "+" : "") + formatCurrency(rule.amount, rule.currency)}
          valueClassName={rule.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Calendar}
          color="#3b82f6"
          label="Next Due"
          value={formatDate(rule.nextDueDate)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={RefreshCw}
          color="#f59e0b"
          label="Frequency"
          value={rule.frequency}
          valueClassName="capitalize"
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Clock}
          color="#10b981"
          label="Avg. Amount"
          value={avgAmount > 0 ? formatCurrency(avgAmount, rule.currency) : "—"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column: Overview + Schedule + Subscription/Bill Info ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Info className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recurring Information</span>
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge variant="secondary" className={cn("rounded-md", rule.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                  {rule.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Category</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <div style={{ color: accent }} className="flex items-center justify-center">
                    <CategoryIcon name={category?.icon || ""} className="size-3.5" />
                  </div>
                  <span>{category?.name || "Uncategorized"}</span>
                </div>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Wallet</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <WalletIcon className="size-3.5 text-muted-foreground" />
                  <span>{wallet?.name || "Unknown"}</span>
                </div>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Type</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  {rule.type === "income" ? <TrendingUp className="size-3.5 text-emerald-500" /> : <TrendingDown className="size-3.5 text-rose-500" />}
                  <span className="capitalize">{rule.type}</span>
                </div>
              </div>

              {(isSubscription || isBill) && (rule.providerName || rule.cancellationUrl || rule.reminderDaysBefore != null) && (
                <>
                  {rule.providerName && (
                    <>
                      <Separator className="bg-border/40" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Provider</span>
                        <span className="font-semibold">{rule.providerName}</span>
                      </div>
                    </>
                  )}
                  {rule.reminderDaysBefore != null && (
                    <>
                      <Separator className="bg-border/40" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Reminder</span>
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-primary/20 bg-primary/5 text-primary">
                          {rule.reminderDaysBefore} day{rule.reminderDaysBefore !== 1 ? "s" : ""} before
                        </Badge>
                      </div>
                    </>
                  )}
                  {rule.cancellationUrl && (
                    <>
                      <Separator className="bg-border/40" />
                      <a
                        href={rule.cancellationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors mt-1 w-full"
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <Ban className="size-3.5 text-muted-foreground" /> Cancellation Link
                        </span>
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                      </a>
                    </>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schedule</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-1">Start Date</p>
                  <p className="font-bold">{formatDate(rule.startDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-1">Next Due</p>
                  <p className="font-bold text-primary">{formatDate(rule.nextDueDate)}</p>
                </div>
                {rule.endDate && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-1">End Date</p>
                    <p className="font-bold">{formatDate(rule.endDate)}</p>
                  </div>
                )}
                {rule.trialEndDate && isSubscription && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-1">Trial Ends</p>
                    <p className="font-bold text-amber-500">{formatDate(rule.trialEndDate)}</p>
                  </div>
                )}
                {rule.lastProcessedDate && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-1">Last Run</p>
                    <p className="font-bold">{formatDate(rule.lastProcessedDate)}</p>
                  </div>
                )}
              </div>
              <Button onClick={handleProcessNow} disabled={!rule.isActive || isProcessing} variant="secondary" className="w-full font-bold gap-2">
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Process Now
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Right column: History Timeline ── */}
        <div className="lg:col-span-2 lg:h-0 lg:min-h-full flex flex-col gap-4">
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 max-h-[480px] lg:max-h-none flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">History</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                {localHistory.length} event{localHistory.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Quick stat strip */}
            <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30 shrink-0">
              <div className="px-4 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Last Activity</span>
                <span className="text-xs font-bold">{lastActivity ? format(new Date(isBill ? lastActivity.dueDate : lastActivity.date), "MMM d, yyyy") : "—"}</span>
              </div>
              <div className="px-4 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">{isBill ? "Paid" : "Processed"}</span>
                <span className="text-xs font-bold">{paidOrProcessedCount}</span>
              </div>
              <div className="px-4 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Avg. Amount</span>
                <span className="text-xs font-bold">{avgAmount > 0 ? formatCurrency(avgAmount, rule.currency) : "—"}</span>
              </div>
            </div>

            {localHistory.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <RefreshCw className="size-10 text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground text-sm">No history yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">When this rule is processed, its execution history will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                  {isBill ? (
                    (localHistory as BillInstance[]).map((bill) => {
                      const isPaid = bill.status === "paid"
                      const isOverdue = bill.status === "overdue" || (bill.status === "pending" && new Date(bill.dueDate) < new Date())
                      const isSkipped = bill.status === "skipped"

                      const iconColor = isPaid
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : isSkipped
                          ? "bg-muted text-muted-foreground border-muted-foreground/20"
                          : isOverdue
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      const DotIcon = isPaid ? CheckCircle2 : isSkipped ? Ban : isOverdue ? AlertTriangle : Clock

                      const hasLink = isPaid && !!bill.transactionId

                      return (
                        <Item
                          key={bill._id.toString()}
                          size="sm"
                          className={cn("group", isSkipped && "opacity-60")}
                          asChild={hasLink}
                        >
                          {hasLink ? (
                            <Link href={`/transactions/${bill.transactionId}`}>
                              <ItemMedia className={cn("size-8 rounded-xl border", iconColor)}>
                                <DotIcon className="size-3.5" />
                              </ItemMedia>
                              <ItemContent className="gap-0.5">
                                <ItemTitle className="flex-wrap gap-2">
                                  <span className={cn("text-xs font-bold", isSkipped ? "text-muted-foreground line-through" : "text-foreground")}>
                                    {formatDate(bill.dueDate)}
                                  </span>
                                  {isSkipped && (
                                    <Badge variant="secondary" className="rounded-full px-2 py-0 h-4 text-[9px] uppercase font-bold tracking-wider bg-muted text-muted-foreground border-transparent">
                                      Skipped
                                    </Badge>
                                  )}
                                </ItemTitle>
                                <ItemDescription className="text-[11px]">
                                  Paid on {formatDate(bill.paidDate!)}
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <span className={cn("text-xs font-bold whitespace-nowrap tabular-nums shrink-0", isSkipped && "text-muted-foreground line-through")}>
                                  {formatCurrency(bill.actualAmount!, bill.currency)}
                                </span>
                                <div className="size-6 flex items-center justify-center shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
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
                                        <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will remove the payment record and revert the wallet balance. This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction variant="destructive" onClick={() => handleDeleteBill(bill)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
                                  <span className={cn("text-xs font-bold", isSkipped ? "text-muted-foreground line-through" : "text-foreground")}>
                                    {formatDate(bill.dueDate)}
                                  </span>
                                  {isSkipped && (
                                    <Badge variant="secondary" className="rounded-full px-2 py-0 h-4 text-[9px] uppercase font-bold tracking-wider bg-muted text-muted-foreground border-transparent">
                                      Skipped
                                    </Badge>
                                  )}
                                </ItemTitle>
                                <ItemDescription className="text-[11px]">
                                  {isSkipped ? "Skipped" : isOverdue ? "Overdue" : "Pending"}
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <span className={cn("text-xs font-bold whitespace-nowrap tabular-nums shrink-0", isSkipped && "text-muted-foreground line-through")}>
                                  {formatCurrency(bill.expectedAmount || 0, bill.currency)}
                                </span>
                                {!isSkipped && (
                                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <Button size="sm" onClick={() => setPayingBill(bill)} className="rounded-lg font-bold h-7 text-xs shrink-0">
                                      Pay Now
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleSkipBill(bill)} className="rounded-lg font-bold h-7 text-xs shrink-0 border-border/50 bg-card hover:bg-muted/50">
                                      Skip
                                    </Button>
                                  </div>
                                )}
                                <div className="size-6 flex items-center justify-center shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
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
                                        <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {isSkipped
                                            ? "This skipped occurrence will be permanently removed from history."
                                            : "This pending occurrence will be permanently removed."}
                                          {" "}This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction variant="destructive" onClick={() => handleDeleteBill(bill)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </ItemActions>
                            </>
                          )}
                        </Item>
                      )
                    })
                  ) : (
                    (localHistory as Transaction[]).map((tx) => (
                      <Item key={tx._id.toString()} size="sm" className="group" asChild>
                        <Link href={`/transactions/${tx._id.toString()}`}>
                          <ItemMedia className="size-8 rounded-xl border" style={{ backgroundColor: accent + "18", borderColor: accent + "30", color: accent }}>
                            {tx.type === "income" ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                          </ItemMedia>
                          <ItemContent className="gap-0.5">
                            <ItemTitle>
                              <span className="text-xs font-bold text-foreground">{formatDate(tx.date)}</span>
                            </ItemTitle>
                            <ItemDescription className="truncate text-[11px]">{tx.description}</ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <span className={cn("text-xs font-bold whitespace-nowrap tabular-nums shrink-0", tx.type === "income" ? "text-emerald-500" : "text-foreground")}>
                              {tx.type === "income" ? "+" : ""}{formatCurrency(tx.amount, tx.currency)}
                            </span>
                            <div className="size-6 flex items-center justify-center shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
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
                                    <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove this generated transaction and revert the wallet balance. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction variant="destructive" onClick={() => handleDeleteTransaction(tx._id.toString())}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </ItemActions>
                        </Link>
                      </Item>
                    ))
                  )}
                </ItemGroup>
              </ScrollArea>
            )}
          </Card>

          {/* Trend & Reliability Card */}
          <Card className="rounded-2xl border border-border/40 shadow-sm p-4 h-40 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between border-b border-border/30 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="size-4" style={{ color: accent }} />
                <span className="text-sm font-bold">Trend & Reliability</span>
              </div>
              <Badge
                variant="outline"
                className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ color: accent, borderColor: accent + "30", backgroundColor: accent + "10" }}
              >
                {daysUntilNext >= 0 ? `Due in ${daysUntilNext}d` : `${Math.abs(daysUntilNext)}d overdue`}
              </Badge>
            </div>

            <div className="flex-1 flex items-center gap-3 py-2 min-h-0">
              <div className="w-3/5 h-full min-h-0">
                {sparklineData.length > 1 ? (
                  <ChartContainer
                    config={trendChartConfig}
                    className="h-full w-full aspect-auto"
                  >
                    <AreaChart
                      accessibilityLayer
                      data={sparklineData}
                      margin={{ top: 6, right: 4, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={`trend-${rule._id.toString()}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            color={accent}
                            formatter={(value) => (
                              <>
                                <div
                                  className="h-2.5 w-2.5 shrink-0 rounded-xs"
                                  style={{
                                    backgroundColor: accent,
                                  }}
                                />
                                <div className="flex flex-1 justify-between items-center leading-none">
                                  <span className="text-muted-foreground capitalize">
                                    {rule.description}
                                  </span>
                                  <span className="font-mono font-medium text-foreground tabular-nums ml-2">
                                    {formatCurrency(value as number, rule.currency)}
                                  </span>
                                </div>
                              </>
                            )}
                            labelFormatter={(_value, payload) => payload?.[0]?.payload?.date}
                          />
                        }
                      />
                      <Area
                        dataKey="amount"
                        type="monotone"
                        fill={`url(#trend-${rule._id.toString()})`}
                        fillOpacity={0.4}
                        stroke="var(--color-amount)"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/60 text-center px-2">
                    Not enough history yet for a trend
                  </div>
                )}
              </div>

              <div className="w-2/5 grid grid-cols-1 gap-2 pb-2">
                <div className="flex flex-col gap-0.5 rounded-lg border border-border/30 bg-muted/20 px-2.5 py-1.5">
                  <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                    {isBill ? "On-Time Rate" : "Occurrences"}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {isBill ? (onTimeRate !== null ? `${onTimeRate}%` : "—") : paidOrProcessedCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg border border-border/30 bg-muted/20 px-2.5 py-1.5">
                  <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">vs. Average</span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums flex items-center gap-1",
                      trendDirection === "up" ? "text-rose-500" : trendDirection === "down" ? "text-emerald-500" : "text-foreground"
                    )}
                  >
                    {trendDirection === "up" && <TrendingUp className="size-3" />}
                    {trendDirection === "down" && <TrendingDown className="size-3" />}
                    {priorAvg > 0 ? `${trendPct > 0 ? "+" : ""}${trendPct}%` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Rule</DialogTitle></DialogHeader>
          <div className="py-2">
            <RecurringForm categories={categories} wallets={wallets} initialRule={rule} onSuccess={() => setIsEditOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payingBill} onOpenChange={(open) => !open && setPayingBill(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Pay Bill</DialogTitle></DialogHeader>
          <div className="py-2">
            {payingBill && <PayBillForm bill={payingBill} rule={rule} wallets={wallets} onSuccess={() => { setPayingBill(null); router.refresh() }} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}