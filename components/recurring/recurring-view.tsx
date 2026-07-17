"use client"

import { useState, useTransition, useMemo } from "react"
import { RecurringRule, Category, Wallet } from "@/types"
import { deleteRecurringRule, toggleRecurringRuleActive, processRecurringRuleNow } from "@/lib/actions/recurring"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RecurringForm } from "./recurring-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
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
  Edit,
  Trash2,
  Plus,
  Wallet as WalletIcon,
  RefreshCw,
  CalendarSync,
  Loader2,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Ban,
  CreditCard,
  FileText,
  LayoutGrid,
  PiggyBank,
  ArrowDownRight,
  AlertTriangle,
  type LucideIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CategoryIcon } from "../categories/category-icon"

interface RecurringViewProps {
  rules: RecurringRule[]
  categories: Category[]
  wallets: Wallet[]
}

function MetricCard({
  icon: Icon,
  color,
  label,
  value,
  valueClassName,
}: {
  icon: LucideIcon
  color: string
  label: string
  value: string | number
  valueClassName?: string
}) {
  return (
    <Card className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-[240px] shrink-0 snap-start">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}, transparent 60%)` }}
      />
      <CardContent className="relative p-4 flex items-center gap-3">
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: color + "18", color }}
        >
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

export function RecurringView({ rules, categories, wallets }: RecurringViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"all" | "recurring" | "subscription" | "bill">("all")

  const handleDelete = async () => {
    if (!deletingRuleId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteRecurringRule(deletingRuleId)
          if (res && !res.success) {
            reject(new Error(res.error || "Unauthorized"))
          } else {
            setDeletingRuleId(null)
            router.refresh()
            resolve(true)
          }
        }
        catch (err) { reject(err) }
      })
    })
    toast.promise(p, {
      loading: "Deleting...",
      success: "Rule deleted",
      error: (err: any) => err.message || "Failed to delete",
    })
  }

  const handleToggleActive = async (id: string) => {
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await toggleRecurringRuleActive(id)
        if (res && !res.success) {
          reject(new Error(res.error || "Unauthorized"))
        } else {
          router.refresh()
          resolve(res)
        }
      }
      catch (err) { reject(err) }
    })
    toast.promise(p, {
      loading: "Updating...",
      success: (res: any) => `Rule is now ${res.isActive ? "active" : "inactive"}`,
      error: (err: any) => err.message || "Failed to update",
    })
  }

  const handleProcessNow = async (id: string) => {
    setProcessingId(id)
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await processRecurringRuleNow(id)
        if (res && !res.success) {
          reject(new Error(res.error || "Unauthorized"))
        } else {
          router.refresh()
          resolve(res)
        }
      }
      catch (err) { reject(err) }
    })
    toast.promise(p, {
      loading: "Processing...",
      success: (res: any) => `Created ${res.processedCount} transaction(s)`,
      error: (err: any) => err.message || "Failed to process",
    })
    try { await p } catch (_) { } finally { setProcessingId(null) }
  }

  const defaultCurrency = wallets[0]?.currency || "USD"

  const displayedRules = useMemo(() => {
    if (activeTab === "all") return rules
    return rules.filter(r => (r.kind || "recurring") === activeTab)
  }, [rules, activeTab])

  const tabCounts = useMemo(() => ({
    all: rules.length,
    recurring: rules.filter(r => (r.kind || "recurring") === "recurring").length,
    subscription: rules.filter(r => r.kind === "subscription").length,
    bill: rules.filter(r => r.kind === "bill").length,
  }), [rules])

  const metrics = useMemo(() => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let annualCost = 0;
    let trialEndingSoonCount = 0;

    const activeRules = displayedRules.filter(r => r.isActive && r.status !== "cancelled" && r.status !== "expired");
    const now = new Date();

    activeRules.forEach(r => {
      let monthly = 0;
      let annual = 0;

      if (r.frequency === "monthly") {
        monthly = r.amount;
        annual = r.amount * 12;
      } else if (r.frequency === "yearly") {
        monthly = r.amount / 12;
        annual = r.amount;
      } else if (r.frequency === "weekly") {
        monthly = (r.amount * 52) / 12;
        annual = r.amount * 52;
      } else if (r.frequency === "biweekly") {
        monthly = (r.amount * 26) / 12;
        annual = r.amount * 26;
      } else if (r.frequency === "quarterly") {
        monthly = r.amount / 3;
        annual = r.amount * 4;
      } else if (r.frequency === "daily") {
        monthly = r.amount * 30;
        annual = r.amount * 365;
      }

      if (r.type === "income") {
        monthlyIncome += monthly;
      } else {
        monthlyExpense += monthly;
        annualCost += annual;
      }

      if (r.kind === "subscription" && r.status === "trial" && r.trialEndDate) {
        const trialEnd = new Date(r.trialEndDate);
        if (trialEnd > now && (trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 7) {
          trialEndingSoonCount++;
        }
      }
    });

    return {
      activeCount: activeRules.length,
      monthlyIncome,
      monthlyExpense,
      annualCost,
      trialEndingSoonCount
    }
  }, [displayedRules])

  return (
    <div className="flex flex-col gap-7 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <RefreshCw className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Recurring</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage recurring transactions, subscriptions, and bills.</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" />Create Rule
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/40 rounded-2xl overflow-x-auto no-scrollbar w-fit max-w-full">
        {[
          { id: "all", label: "All", icon: LayoutGrid, count: tabCounts.all },
          { id: "recurring", label: "Recurring", icon: RefreshCw, count: tabCounts.recurring },
          { id: "subscription", label: "Subscriptions", icon: CreditCard, count: tabCounts.subscription },
          { id: "bill", label: "Bills", icon: FileText, count: tabCounts.bill }
        ].map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
              )}
            >
              <Icon className={cn("size-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
              {tab.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-black tabular-nums transition-colors",
                  isActive ? "bg-primary/15 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Metrics ── */}
      {activeTab === "subscription" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={CreditCard} color="#6366f1" label="Active Subs" value={metrics.activeCount} />
          <MetricCard icon={ArrowDownRight} color="#f43f5e" label="Monthly Cost" value={formatCurrency(metrics.monthlyExpense, defaultCurrency)} />
          <MetricCard icon={PiggyBank} color="#f59e0b" label="Annual Cost" value={formatCurrency(metrics.annualCost, defaultCurrency)} />
          <MetricCard icon={AlertTriangle} color="#f59e0b" label="Trials Ending Soon" value={metrics.trialEndingSoonCount} valueClassName="text-amber-500" />
        </div>
      ) : activeTab === "bill" ? (
        <div className="grid grid-cols-2 gap-4">
          <MetricCard icon={FileText} color="#6366f1" label="Active Bills" value={metrics.activeCount} />
          <MetricCard icon={ArrowDownRight} color="#f43f5e" label="Monthly Cost" value={formatCurrency(metrics.monthlyExpense, defaultCurrency)} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard icon={RefreshCw} color="#6366f1" label="Active Rules" value={metrics.activeCount} />
          <MetricCard icon={TrendingUp} color="#10b981" label="Monthly Income" value={formatCurrency(metrics.monthlyIncome, defaultCurrency)} valueClassName="text-emerald-500" />
          <MetricCard icon={TrendingDown} color="#f43f5e" label="Monthly Expense" value={formatCurrency(metrics.monthlyExpense, defaultCurrency)} />
        </div>
      )}

      {/* ── Grid ── */}
      {displayedRules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRules.map((rule) => {
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
              <Card
                key={rule._id.toString()}
                className={cn(
                  "group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm",
                  "hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full",
                  !rule.isActive && "opacity-70"
                )}
              >
                {/* Top accent */}
                <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: accent }} />

                {/* ── Header ── */}
                <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Type icon */}
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: iconColor + "18", color: iconColor }}
                    >
                      <TypeIcon className="size-4" />
                    </div>

                    {/* Description + badges */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                        {rule.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
                          style={{ backgroundColor: accent + "15", color: accent, borderColor: accent + "30" }}>
                          {ruleKind}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">
                          {rule.frequency}
                        </Badge>
                        {ruleKind === "subscription" && rule.status === "trial" && (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-amber-500/30 text-amber-500 bg-amber-500/10">
                            Trial
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
                    {rule.cancellationUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={rule.cancellationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center size-8 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-primary"
                          >
                            <Ban className="size-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="rounded-xl font-medium">Cancel Link</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className={cn(
                            "size-8 rounded-lg",
                            rule.isActive
                              ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                              : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          )}
                          onClick={() => handleToggleActive(rule._id.toString())}
                        >
                          {rule.isActive ? (
                            <Pause className="size-3.5 fill-amber-500/10" />
                          ) : (
                            <Play className="size-3.5 fill-emerald-500/10" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        {rule.isActive ? "Pause rule" : "Resume rule"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 rounded-lg hover:bg-muted/70"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit className="size-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Edit rule
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setDeletingRuleId(rule._id.toString())}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Delete rule
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>

                {/* ── Body ── */}
                <CardContent className="px-4 pb-3 flex flex-col gap-3">

                  {/* Amount + Status */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Amount</p>
                      <p className={cn("text-[1.5rem] font-black tabular-nums leading-none select-all", isIncome ? "text-emerald-500" : "text-foreground")}>
                        {isIncome ? "+" : "−"}{formatCurrency(rule.amount, rule.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Status</p>
                      <button
                        onClick={() => handleToggleActive(rule._id.toString())}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors",
                          rule.isActive
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", rule.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                        {rule.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>

                  {/* Flow */}
                  <div className="flex items-center gap-2 bg-muted/30 border border-border/30 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="size-6 rounded-lg bg-card border border-border/50 flex items-center justify-center shrink-0">
                        <WalletIcon className="size-3 text-muted-foreground" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground truncate">
                        {wallet?.name ?? "Wallet"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-5 h-px bg-border/60 relative overflow-hidden">
                        {rule.isActive && (
                          <div className="absolute top-1/2 -translate-y-1/2 size-1 rounded-full bg-primary"
                            style={{ animation: "flowDot 1.8s ease-in-out infinite" }} />
                        )}
                      </div>
                      <RefreshCw className={cn("size-2.5 text-primary/40", rule.isActive && "animate-spin")}
                        style={{ animationDuration: "10s" }} />
                      <div className="w-5 h-px bg-border/60 relative overflow-hidden">
                        {rule.isActive && (
                          <div className="absolute top-1/2 -translate-y-1/2 size-1 rounded-full bg-primary"
                            style={{ animation: "flowDot 1.8s ease-in-out infinite", animationDelay: "0.9s" }} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                      <span className="text-[10px] font-bold truncate" style={{ color: accent }}>
                        {category?.name ?? "Category"}
                      </span>
                      <div className="size-6 rounded-lg border flex items-center justify-center shrink-0"
                        style={{ backgroundColor: accent + "15", borderColor: accent + "25", color: accent }}>
                        <CategoryIcon name={category?.icon ?? ""} className="size-3" />
                      </div>
                    </div>
                  </div>

                  {/* Date grid */}
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

                {/* ── Footer ── */}
                <Separator className="bg-border/20" />
                <CardFooter className="px-3 py-2.5 mt-auto bg-muted/20">
                  <Button
                    onClick={() => handleProcessNow(rule._id.toString())}
                    disabled={!rule.isActive || isProcessing}
                    variant="outline"
                    className="w-full h-8 rounded-xl text-xs font-bold gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                  >
                    <RefreshCw className={cn("size-3", isProcessing && "animate-spin")} />
                    Process Now
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl p-12 text-center bg-muted/10">
          <CalendarSync className="size-10 text-muted-foreground/25 mb-3" />
          <p className="text-sm font-bold">No items found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            There are no active rules in this category.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4 rounded-xl font-bold gap-2 h-9">
            <Plus className="size-4" />Create Rule
          </Button>
        </div>
      )}

      {/* ── Dialogs ── */}
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

      <AlertDialog open={!!deletingRuleId} onOpenChange={(open) => !open && setDeletingRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this rule won't affect transactions already created by it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Delete Rule
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