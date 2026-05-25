"use client"

import { useState, useTransition } from "react"
import { RecurringRule, Category, Wallet } from "@/types"
import { deleteRecurringRule, toggleRecurringRuleActive, processRecurringRuleNow } from "@/lib/actions/recurring"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RecurringForm } from "./recurring-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Edit,
  Trash2,
  Plus,
  Wallet as WalletIcon,
  RefreshCw,
  CalendarSync,
  Loader2,
  FolderOpen,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface RecurringViewProps {
  rules: RecurringRule[]
  categories: Category[]
  wallets: Wallet[]
}

export function RecurringView({ rules, categories, wallets }: RecurringViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingRuleId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try { await deleteRecurringRule(deletingRuleId); setDeletingRuleId(null); router.refresh(); resolve(true) }
        catch (err) { reject(err) }
      })
    })
    toast.promise(p, { loading: "Deleting...", success: "Rule deleted", error: "Failed to delete" })
  }

  const handleToggleActive = async (id: string) => {
    const p = new Promise(async (resolve, reject) => {
      try { const res = await toggleRecurringRuleActive(id); router.refresh(); resolve(res) }
      catch (err) { reject(err) }
    })
    toast.promise(p, {
      loading: "Updating...",
      success: (res: any) => `Rule is now ${res.isActive ? "active" : "inactive"}`,
      error: "Failed to update",
    })
  }

  const handleProcessNow = async (id: string) => {
    setProcessingId(id)
    const p = new Promise(async (resolve, reject) => {
      try { const res = await processRecurringRuleNow(id); router.refresh(); resolve(res) }
      catch (err) { reject(err) }
    })
    toast.promise(p, {
      loading: "Processing...",
      success: (res: any) => `Created ${res.processedCount} transaction(s)`,
      error: "Failed to process",
    })
    try { await p } catch (_) { } finally { setProcessingId(null) }
  }

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
            <p className="text-sm text-muted-foreground mt-0.5">Automate repeated income and expenses.</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" />Create Rule
        </Button>
      </div>

      {/* ── Grid ── */}
      {rules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => {
            const category = categories.find((c) => c._id.toString() === rule.categoryId)
            const wallet = wallets.find((w) => w._id.toString() === rule.walletId)
            const isIncome = rule.type === "income"
            const accent = category?.color ?? "#888888"
            const isProcessing = processingId === rule._id.toString()
            const TypeIcon = isIncome ? TrendingUp : TrendingDown
            const iconColor = isIncome ? "#10b981" : accent

            return (
              <div
                key={rule._id.toString()}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm",
                  "hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col",
                  !rule.isActive && "opacity-70"
                )}
              >
                {/* Top accent */}
                <div className="h-[3px] w-full" style={{ backgroundColor: accent }} />

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
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
                          {rule.type}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">
                          {rule.frequency}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons — no chip */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
                    <Button
                      variant="ghost" size="icon"
                      className="size-8 rounded-lg hover:bg-muted/70"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      onClick={() => setDeletingRuleId(rule._id.toString())}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ── Body ── */}
                <div className="px-4 pb-3 flex flex-col gap-3">

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
                        <FolderOpen className="size-3" />
                      </div>
                    </div>
                  </div>

                  {/* Date grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/20 border border-border/20 rounded-xl px-3 py-2.5">
                    {[
                      { label: "Start", value: formatDate(rule.startDate) },
                      rule.endDate ? { label: "End", value: formatDate(rule.endDate) } : null,
                      { label: "Next due", value: formatDate(rule.nextDueDate) },
                      rule.lastProcessedDate ? { label: "Last run", value: formatDate(rule.lastProcessedDate) } : null,
                    ].filter(Boolean).map((item) => (
                      <div key={item!.label}>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">{item!.label}</p>
                        <p className="text-[11px] font-bold text-foreground/90 mt-0.5">{item!.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="border-t border-border/20 px-3 py-2.5 mt-auto">
                  <Button
                    onClick={() => handleProcessNow(rule._id.toString())}
                    disabled={!rule.isActive || isProcessing}
                    variant="outline"
                    className="w-full h-8 rounded-xl text-xs font-bold gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                  >
                    <RefreshCw className={cn("size-3", isProcessing && "animate-spin")} />
                    Process Now
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl p-12 text-center bg-muted/10">
          <CalendarSync className="size-10 text-muted-foreground/25 mb-3" />
          <p className="text-sm font-bold">No recurring rules</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Set up rules for subscriptions, utilities, salaries, and other regular transactions.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4 rounded-xl font-bold gap-2 h-9">
            <Plus className="size-4" />Create First Rule
          </Button>
        </div>
      )}

      {/* ── Dialogs ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Create Recurring Rule</DialogTitle></DialogHeader>
          <div className="py-2"><RecurringForm categories={categories} wallets={wallets} onSuccess={() => setIsCreateOpen(false)} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Recurring Rule</DialogTitle></DialogHeader>
          <div className="py-2">
            {editingRule && <RecurringForm categories={categories} wallets={wallets} initialRule={editingRule} onSuccess={() => setEditingRule(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRuleId} onOpenChange={(open) => !open && setDeletingRuleId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600 dark:text-rose-400">Delete Rule</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Deleting this rule won't affect transactions already created by it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5">
              {isPending && <Loader2 className="size-3.5 animate-spin" />}Delete Rule
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