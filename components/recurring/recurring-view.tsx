"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { RecurringRule, Category, Wallet, BillInstance } from "@/types"
import { deleteRecurringRule, toggleRecurringRuleActive, processRecurringRuleNow } from "@/lib/actions/recurring"
import { skipBillInstance } from "@/lib/actions/bills"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { RecurringForm } from "./recurring-form"
import { PayBillForm } from "./pay-bill-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia
} from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import {
  Edit, Trash2, Plus, Wallet as WalletIcon, RefreshCw, CalendarSync, Loader2,
  TrendingUp, TrendingDown, Play, Pause, Ban, CreditCard, FileText, Search,
  PiggyBank, ArrowDownRight, AlertTriangle, CheckCircle2, Clock, CalendarDays, type LucideIcon
} from "lucide-react"
import { toast } from "sonner"
import { CategoryIcon } from "../categories/category-icon"

interface RecurringViewProps {
  rules: RecurringRule[]
  categories: Category[]
  wallets: Wallet[]
  billInstances?: BillInstance[]
}

interface MetricCardProps {
  icon: LucideIcon
  color: string
  label: string
  value: string | number
  valueClassName?: string
  className?: string
  style?: React.CSSProperties
}

function MetricCard({ icon: Icon, color, label, value, valueClassName, className, style }: MetricCardProps) {
  return (
    <Card className={cn("group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-[200px]", className)} style={style}>
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}, transparent 60%)` }} />
      <CardContent className="relative p-4 flex items-center gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: color + "18", color }}>
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 truncate">{label}</p>
          <p className={cn("text-xl font-black tabular-nums leading-tight truncate", valueClassName)}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function RecurringView({ rules, categories, wallets, billInstances = [] }: RecurringViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [payingBill, setPayingBill] = useState<BillInstance | null>(null)
  const [search, setSearch] = useState("")

  const [activeTab, setActiveTab] = useState<"all" | "recurring" | "subscription" | "bill">("all")

  const handleDelete = async () => {
    if (!deletingRuleId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteRecurringRule(deletingRuleId)
          if (res && !res.success) reject(new Error(res.error || "Unauthorized"))
          else { setDeletingRuleId(null); router.refresh(); resolve(true) }
        } catch (err) { reject(err) }
      })
    })
    toast.promise(p, { loading: "Deleting...", success: "Rule deleted", error: (err: unknown) => err instanceof Error ? err.message : "Failed to delete" })
  }

  const handleToggleActive = async (id: string) => {
    const p = new Promise<{ isActive: boolean }>(async (resolve, reject) => {
      try {
        const res = await toggleRecurringRuleActive(id)
        if (res && !res.success) reject(new Error(res.error || "Unauthorized"))
        else { router.refresh(); resolve(res as { isActive: boolean }) }
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Updating...", success: (res: { isActive: boolean }) => `Rule is now ${res.isActive ? "active" : "inactive"}`, error: (err: unknown) => err instanceof Error ? err.message : "Failed to update" })
  }

  const handleProcessNow = async (id: string) => {
    setProcessingId(id)
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await processRecurringRuleNow(id)
        if (res && !res.success) reject(new Error(res.error || "Unauthorized"))
        else { router.refresh(); resolve(res) }
      } catch (err) { reject(err) }
    })
    toast.promise(p, { loading: "Processing...", success: "Processed successfully", error: (err: unknown) => err instanceof Error ? err.message : "Failed to process" })
    try { await p } catch { } finally { setProcessingId(null) }
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

  const defaultCurrency = wallets[0]?.currency || "USD"

  const displayedRules = useMemo(() => {
    let filtered = rules;
    if (activeTab !== "all") {
      filtered = filtered.filter(r => (r.kind || "recurring") === activeTab);
    }
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.description.toLowerCase().includes(lowerSearch)
      );
    }
    return filtered;
  }, [rules, activeTab, search])

  const tabCounts = useMemo(() => ({
    all: rules.length, // Display total including bills
    recurring: rules.filter(r => (r.kind || "recurring") === "recurring").length,
    subscription: rules.filter(r => r.kind === "subscription").length,
    bill: rules.filter(r => r.kind === "bill").length,
  }), [rules])

  const tabNames: Record<string, string> = {
    all: `All (${tabCounts.all})`,
    recurring: `Recurring (${tabCounts.recurring})`,
    subscription: `Subscriptions (${tabCounts.subscription})`,
    bill: `Bills (${tabCounts.bill})`,
  }

  const metrics = useMemo(() => {
    let monthlyIncome = 0; let monthlyExpense = 0; let annualCost = 0; let trialEndingSoonCount = 0;
    const activeRules = displayedRules.filter(r => r.isActive && r.status !== "cancelled" && r.status !== "expired");
    const now = new Date();

    activeRules.forEach(r => {
      let monthly = 0; let annual = 0;
      if (r.frequency === "monthly") { monthly = r.amount; annual = r.amount * 12; }
      else if (r.frequency === "yearly") { monthly = r.amount / 12; annual = r.amount; }
      else if (r.frequency === "weekly") { monthly = (r.amount * 52) / 12; annual = r.amount * 52; }
      else if (r.frequency === "biweekly") { monthly = (r.amount * 26) / 12; annual = r.amount * 26; }
      else if (r.frequency === "quarterly") { monthly = r.amount / 3; annual = r.amount * 4; }
      else if (r.frequency === "daily") { monthly = r.amount * 30; annual = r.amount * 365; }

      if (r.type === "income") monthlyIncome += monthly;
      else { monthlyExpense += monthly; annualCost += annual; }

      if (r.kind === "subscription" && r.status === "trial" && r.trialEndDate) {
        const trialEnd = new Date(r.trialEndDate);
        if (trialEnd > now && (trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 7) trialEndingSoonCount++;
      }
    });

    return { activeCount: activeRules.length, monthlyIncome, monthlyExpense, annualCost, trialEndingSoonCount }
  }, [displayedRules])

  const billMetrics = useMemo(() => {
    const dueOrOverdue = billInstances.filter(b => b.status === "pending" || b.status === "overdue")
    let totalDue = 0;
    dueOrOverdue.forEach(b => totalDue += (b.expectedAmount || 0))
    return { dueCount: dueOrOverdue.length, totalDue }
  }, [billInstances])

  const renderRuleCard = (rule: RecurringRule) => {
    const category = categories.find((c) => c._id.toString() === rule.categoryId)
    const wallet = wallets.find((w) => w._id.toString() === rule.walletId)
    const isIncome = rule.type === "income"
    const accent = category?.color ?? "#888888"
    const isProcessing = processingId === rule._id.toString()
    const ruleKind = rule.kind || "recurring"

    let TypeIcon = isIncome ? TrendingUp : TrendingDown
    if (ruleKind === "subscription") TypeIcon = CreditCard
    if (ruleKind === "bill") TypeIcon = FileText
    const iconColor = isIncome ? "#10b981" : accent

    return (
      <Card key={rule._id.toString()} onClick={() => router.push(`/recurring/${rule._id.toString()}`)} className={cn("group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer", !rule.isActive && "opacity-70")}>
        <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: accent }} />
        <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: iconColor + "18", color: iconColor }}>
              <TypeIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{rule.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4" style={{ backgroundColor: accent + "15", color: accent, borderColor: accent + "30" }}>{ruleKind}</Badge>
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">{rule.frequency}</Badge>
                {ruleKind === "subscription" && rule.status === "trial" && (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-amber-500/30 text-amber-500 bg-amber-500/10">Trial</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
            {rule.cancellationUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href={rule.cancellationUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center justify-center size-8 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-primary"><Ban className="size-3.5" /></a>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-xl font-medium">Cancel Link</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("size-8 rounded-lg", rule.isActive ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10")} onClick={(e) => { e.stopPropagation(); handleToggleActive(rule._id.toString()) }}>
                  {rule.isActive ? <Pause className="size-3.5 fill-amber-500/10" /> : <Play className="size-3.5 fill-emerald-500/10" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">{rule.isActive ? "Pause rule" : "Resume rule"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-muted/70" onClick={(e) => { e.stopPropagation(); setEditingRule(rule) }}><Edit className="size-3.5 text-muted-foreground" /></Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">Edit rule</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10" onClick={(e) => { e.stopPropagation(); setDeletingRuleId(rule._id.toString()) }}><Trash2 className="size-3.5" /></Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl font-medium">Delete rule</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Amount</p>
              <p className={cn("text-[1.5rem] font-black tabular-nums leading-none select-all", isIncome ? "text-emerald-500" : "text-foreground")}>
                {isIncome ? "+" : ""}{formatCurrency(rule.amount, rule.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Status</p>
              <button onClick={(e) => { e.stopPropagation(); handleToggleActive(rule._id.toString()) }} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors", rule.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : "bg-muted border-border text-muted-foreground hover:bg-muted/70")}>
                <span className={cn("size-1.5 rounded-full", rule.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />{rule.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 border border-border/30 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="size-6 rounded-lg bg-card border border-border/50 flex items-center justify-center shrink-0"><WalletIcon className="size-3 text-muted-foreground" /></div>
              <span className="text-[10px] font-bold text-foreground truncate">{wallet?.name ?? "Wallet"}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-5 h-px bg-border/60 relative overflow-hidden">{rule.isActive && <div className="absolute top-1/2 -translate-y-1/2 size-1 rounded-full bg-primary" style={{ animation: "flowDot 1.8s ease-in-out infinite" }} />}</div>
              <RefreshCw className={cn("size-2.5 text-primary/40", rule.isActive && "animate-spin")} style={{ animationDuration: "10s" }} />
              <div className="w-5 h-px bg-border/60 relative overflow-hidden">{rule.isActive && <div className="absolute top-1/2 -translate-y-1/2 size-1 rounded-full bg-primary" style={{ animation: "flowDot 1.8s ease-in-out infinite", animationDelay: "0.9s" }} />}</div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
              <span className="text-[10px] font-bold truncate" style={{ color: accent }}>{category?.name ?? "Category"}</span>
              <div className="size-6 rounded-lg border flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "15", borderColor: accent + "25", color: accent }}><CategoryIcon name={category?.icon ?? ""} className="size-3" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/20 border border-border/20 rounded-xl px-3 py-2.5">
            {[
              { label: "Start", value: formatDate(rule.startDate) },
              rule.endDate && ruleKind === "recurring" ? { label: "End", value: formatDate(rule.endDate) } : null,
              rule.trialEndDate && ruleKind === "subscription" ? { label: "Trial Ends", value: formatDate(rule.trialEndDate) } : null,
              { label: "Next due", value: formatDate(rule.nextDueDate) },
              rule.lastProcessedDate && ruleKind === "recurring" ? { label: "Last run", value: formatDate(rule.lastProcessedDate) } : null,
            ].filter(Boolean).map((item) => (
              <div key={item!.label}>
                <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">{item!.label}</p>
                <p className="text-[11px] font-bold text-foreground/90 mt-0.5">{item!.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <Separator className="bg-border/20" />
        <CardFooter className="px-3 py-2.5 mt-auto bg-muted/20">
          <Button onClick={(e) => { e.stopPropagation(); handleProcessNow(rule._id.toString()) }} disabled={!rule.isActive || isProcessing} variant="outline" className="w-full h-8 rounded-xl text-xs font-bold gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
            <RefreshCw className={cn("size-3", isProcessing && "animate-spin")} /> Process Now
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const renderBillInstanceCard = (bill: BillInstance) => {

    const isPaid = bill.status === "paid"
    const isOverdue = bill.status === "overdue" || (bill.status === "pending" && new Date(bill.dueDate) < new Date())
    const isSkipped = bill.status === "skipped"

    return (
      <Card key={bill._id.toString()} onClick={() => router.push(`/recurring/${bill.ruleId}`)} className={cn("group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer", (isPaid || isSkipped) && "opacity-70")}>
        <div className={cn("h-[3px] w-full shrink-0", isPaid ? "bg-emerald-500" : isSkipped ? "bg-muted" : isOverdue ? "bg-rose-500" : "bg-amber-500")} />
        <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", isPaid ? "bg-emerald-500/10 text-emerald-500" : isSkipped ? "bg-muted text-muted-foreground" : isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500")}>
              {isPaid ? <CheckCircle2 className="size-4" /> : isSkipped ? <Ban className="size-4" /> : isOverdue ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-bold text-foreground truncate leading-tight", isSkipped && "text-muted-foreground line-through")}>{bill.description}</p>
              <div className="flex gap-1 mt-1">
                <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-transparent", isPaid ? "bg-emerald-500/10 text-emerald-600" : isSkipped ? "bg-muted text-muted-foreground" : isOverdue ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600")}>
                  {isPaid ? "Paid" : isSkipped ? "Skipped" : isOverdue ? "Overdue" : "Due"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Amount</p>
              <p className={cn("text-[1.5rem] font-black tabular-nums leading-none select-all", isSkipped && "text-muted-foreground line-through")}>
                {formatCurrency(isPaid ? bill.actualAmount! : bill.expectedAmount || 0, bill.currency)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/20 border border-border/20 rounded-xl px-3 py-2.5">
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">Due Date</p>
              <p className="text-[11px] font-bold text-foreground/90 mt-0.5">{formatDate(bill.dueDate)}</p>
            </div>
            {isPaid && (
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">Paid Date</p>
                <p className="text-[11px] font-bold text-foreground/90 mt-0.5">{formatDate(bill.paidDate!)}</p>
              </div>
            )}
          </div>
        </CardContent>
        <Separator className="bg-border/20" />
        <CardFooter className="px-3 py-2.5 mt-auto bg-muted/20">
          {!isPaid && !isSkipped ? (
            <div className="flex gap-2 w-full">
              <Button onClick={(e) => { e.stopPropagation(); setPayingBill(bill) }} className="flex-1 h-8 rounded-xl text-xs font-bold gap-2">
                Pay Bill
              </Button>
              <Button
                variant="outline"
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleSkipBill(bill)
                }}
                className="flex-1 h-8 rounded-xl text-xs font-bold gap-2 border-border/50 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              >
                Skip
              </Button>
            </div>
          ) : isSkipped ? (
            <Button disabled variant="outline" className="w-full h-8 rounded-xl text-xs font-bold gap-2 border-border/50">
              <Ban className="size-3 text-muted-foreground" /> Skipped
            </Button>
          ) : (
            <Button disabled variant="outline" className="w-full h-8 rounded-xl text-xs font-bold gap-2 border-border/50">
              <CheckCircle2 className="size-3 text-emerald-500" /> Settled
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0"><RefreshCw className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Recurring</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage recurring transactions, subscriptions, and bills.</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" />Create Rule
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        {activeTab === "subscription" ? (
          <>
            <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={CreditCard} color="#6366f1" label="Active Subs" value={metrics.activeCount} />
            <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={ArrowDownRight} color="#f43f5e" label="Monthly Cost" value={formatCurrency(metrics.monthlyExpense, defaultCurrency)} />
            <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={PiggyBank} color="#f59e0b" label="Annual Cost" value={formatCurrency(metrics.annualCost, defaultCurrency)} />
            <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={AlertTriangle} color="#f59e0b" label="Trials Ending Soon" value={metrics.trialEndingSoonCount} valueClassName="text-amber-500" />
          </>
        ) : activeTab === "bill" ? (
          <>
            <MetricCard icon={FileText} color="#6366f1" label="Active Bills" value={metrics.activeCount} />
            <MetricCard icon={AlertTriangle} color="#f43f5e" label="Due & Overdue" value={billMetrics.dueCount} valueClassName="text-rose-500" />
            <MetricCard icon={ArrowDownRight} color="#f43f5e" label="Total Amount Due" value={formatCurrency(billMetrics.totalDue, defaultCurrency)} />
          </>
        ) : (
          <>
            <MetricCard icon={RefreshCw} color="#6366f1" label="Active Rules" value={metrics.activeCount} />
            <MetricCard icon={TrendingUp} color="#10b981" label="Monthly Income" value={formatCurrency(metrics.monthlyIncome, defaultCurrency)} valueClassName="text-emerald-500" />
            <MetricCard icon={TrendingDown} color="#f43f5e" label="Monthly Expense" value={formatCurrency(metrics.monthlyExpense, defaultCurrency)} />
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Filter (visible on sm and larger screens) */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            All ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "recurring"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Recurring ({tabCounts.recurring})
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "subscription"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Subscriptions ({tabCounts.subscription})
          </button>
          <button
            onClick={() => setActiveTab("bill")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "bill"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Bills ({tabCounts.bill})
          </button>
        </div>

        {/* Mobile Filter (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "recurring" | "subscription" | "bill")}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All ({tabCounts.all})
              </SelectItem>
              <SelectItem value="recurring" className="rounded-lg">
                Recurring ({tabCounts.recurring})
              </SelectItem>
              <SelectItem value="subscription" className="rounded-lg">
                Subscriptions ({tabCounts.subscription})
              </SelectItem>
              <SelectItem value="bill" className="rounded-lg">
                Bills ({tabCounts.bill})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <InputGroup className="w-full sm:w-60">
            <InputGroupInput
              placeholder="Search by description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      {rules.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <CalendarSync className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No recurring items yet</EmptyTitle>
              <EmptyDescription>Set up bills, subscriptions, or recurring transfers.</EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2"><Plus className="size-4" /> Create Rule</Button>
            </div>
          </Empty>
        </Card>
      ) : activeTab === "all" ? (
        <div className="flex flex-col gap-10">
          {billInstances.filter(b => b.status !== "paid" && b.status !== "skipped").length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><AlertTriangle className="size-4" /> Action Required (Due / Overdue)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {billInstances.filter(b => b.status !== "paid" && b.status !== "skipped").map(renderBillInstanceCard)}
              </div>
            </div>
          )}

          {displayedRules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedRules.map(renderRuleCard)}
            </div>
          ) : (
            <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
              <Empty>
                <EmptyMedia className="bg-primary/5 text-primary">
                  <CalendarSync className="size-8" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No items found</EmptyTitle>
                  <EmptyDescription>Adjust your filters or search to find what you&apos;re looking for.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          )}
        </div>
      ) : activeTab === "bill" ? (
        <div className="flex flex-col gap-10">
          {billInstances.filter(b => b.status !== "paid" && b.status !== "skipped").length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><AlertTriangle className="size-4" /> Action Required (Due / Overdue)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {billInstances.filter(b => b.status !== "paid" && b.status !== "skipped").map(renderBillInstanceCard)}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CalendarDays className="size-4" /> Upcoming Bills</h3>
            {displayedRules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedRules.map(renderRuleCard)}
              </div>
            ) : (
              <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
                <Empty>
                  <EmptyMedia className="bg-primary/5 text-primary">
                    <CalendarSync className="size-8" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No upcoming bills found</EmptyTitle>
                    <EmptyDescription>Adjust your filters or search to find what you&apos;re looking for.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Card>
            )}
          </div>
        </div>
      ) : displayedRules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRules.map(renderRuleCard)}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <CalendarSync className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No items found</EmptyTitle>
              <EmptyDescription>Adjust your filters or search to find what you&apos;re looking for.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Create Rule</DialogTitle></DialogHeader>
          <div className="py-2"><RecurringForm categories={categories} wallets={wallets} onSuccess={() => setIsCreateOpen(false)} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Rule</DialogTitle></DialogHeader>
          <div className="py-2">
            {editingRule && <RecurringForm categories={categories} wallets={wallets} initialRule={editingRule} onSuccess={() => setEditingRule(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payingBill} onOpenChange={(open) => !open && setPayingBill(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Pay Bill</DialogTitle></DialogHeader>
          <div className="py-2">
            {payingBill && <PayBillForm bill={payingBill} rule={rules.find(r => r._id.toString() === payingBill.ruleId)} wallets={wallets} onSuccess={() => setPayingBill(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRuleId} onOpenChange={(open) => !open && setDeletingRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"><Trash2 /></AlertDialogMedia>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>Deleting this rule won&apos;t affect transactions already created by it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />} Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes flowDot {
          0%   { left: -6px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: calc(100% + 6px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}