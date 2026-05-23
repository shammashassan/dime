"use client"

import { useState, useTransition } from "react"
import { RecurringRule, Category, Wallet } from "@/types"
import { deleteRecurringRule, toggleRecurringRuleActive, processRecurringRuleNow } from "@/lib/actions/recurring"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  ArrowRight,
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
    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await deleteRecurringRule(deletingRuleId)
          setDeletingRuleId(null)
          router.refresh()
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })
    toast.promise(deletePromise, {
      loading: "Deleting rule...",
      success: "Recurring rule deleted",
      error: "Failed to delete rule",
    })
  }

  const handleToggleActive = async (id: string) => {
    const togglePromise = new Promise(async (resolve, reject) => {
      try {
        const res = await toggleRecurringRuleActive(id)
        router.refresh()
        resolve(res)
      } catch (err) {
        reject(err)
      }
    })
    toast.promise(togglePromise, {
      loading: "Updating...",
      success: (res: any) => `Rule is now ${res.isActive ? "active" : "inactive"}`,
      error: "Failed to update",
    })
  }

  const handleProcessNow = async (id: string) => {
    setProcessingId(id)
    const processPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await processRecurringRuleNow(id)
        router.refresh()
        resolve(res)
      } catch (err) {
        reject(err)
      }
    })
    toast.promise(processPromise, {
      loading: "Processing...",
      success: (res: any) => `Created ${res.processedCount} transaction(s)`,
      error: "Failed to process rule",
    })
    try {
      await processPromise
    } catch (_) { }
    finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <RefreshCw className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Recurring</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automate your repeated income and expenses.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="size-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules Grid */}
      {rules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => {
            const category = categories.find((c) => c._id.toString() === rule.categoryId)
            const wallet = wallets.find((w) => w._id.toString() === rule.walletId)
            const isIncome = rule.type === "income"
            const accentColor = category?.color || "#888888"
            const isProcessing = processingId === rule._id.toString()
            const Icon = isIncome ? TrendingUp : TrendingDown

            return (
              <div
                key={rule._id.toString()}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col",
                  !rule.isActive && "opacity-75"
                )}
              >
                {/* Top accent */}
                <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />

                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: accentColor + "18", color: accentColor }}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{rule.description}</p>
                      <div className="flex gap-1 mt-0.5">
                        <Badge
                          variant="outline"
                          className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4"
                          style={{
                            backgroundColor: accentColor + "15",
                            color: accentColor,
                            borderColor: accentColor + "30",
                          }}
                        >
                          {rule.type}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4">
                          {rule.frequency}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(rule._id.toString())}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-colors border cursor-pointer h-4 shrink-0",
                      rule.isActive
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1 rounded-full",
                        rule.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      )}
                    />
                    {rule.isActive ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 flex flex-col gap-3">
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Amount</p>
                    <p
                      className={cn(
                        "text-[1.6rem] font-black tracking-tight tabular-nums select-all leading-none",
                        isIncome ? "text-emerald-500" : "text-foreground"
                      )}
                    >
                      {isIncome ? "+" : "−"}
                      {formatCurrency(rule.amount, rule.currency)}
                    </p>
                  </div>

                  {/* Flow: Wallet → Category */}
                  <div className="flex items-center gap-2 bg-muted/30 border border-border/30 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="size-7 rounded-lg bg-card border border-border/50 flex items-center justify-center shrink-0 text-muted-foreground">
                        <WalletIcon className="size-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground truncate">
                        {wallet?.name || "Wallet"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-muted-foreground/40">
                      <div className="h-px w-6 bg-border relative overflow-hidden">
                        {rule.isActive && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 size-1 rounded-full bg-primary"
                            style={{
                              animation: "flowDot 1.8s ease-in-out infinite",
                            }}
                          />
                        )}
                      </div>
                      <RefreshCw
                        className={cn("size-3 text-primary/50", rule.isActive && "animate-spin")}
                        style={{ animationDuration: "10s" }}
                      />
                      <div className="h-px w-6 bg-border relative overflow-hidden">
                        {rule.isActive && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 size-1 rounded-full bg-primary"
                            style={{
                              animation: "flowDot 1.8s ease-in-out infinite",
                              animationDelay: "0.9s",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                      <span
                        className="text-[10px] font-bold truncate"
                        style={{ color: accentColor }}
                      >
                        {category?.name || "Category"}
                      </span>
                      <div
                        className="size-7 rounded-lg border flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: accentColor + "15",
                          borderColor: accentColor + "25",
                          color: accentColor,
                        }}
                      >
                        <FolderOpen className="size-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Date grid */}
                  <div className="grid grid-cols-2 gap-2 bg-muted/20 border border-border/20 rounded-xl p-3">
                    {[
                      { label: "Start", value: formatDate(rule.startDate) },
                      rule.endDate ? { label: "End", value: formatDate(rule.endDate) } : null,
                      { label: "Next due", value: formatDate(rule.nextDueDate) },
                      rule.lastProcessedDate ? { label: "Last run", value: formatDate(rule.lastProcessedDate) } : null,
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <div key={item!.label} className="space-y-0.5">
                          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">
                            {item!.label}
                          </p>
                          <p className="text-[11px] font-bold text-foreground/90">{item!.value}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border/30 px-2.5 py-1.5 flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-0.5">
                    <Button
                      onClick={() => handleProcessNow(rule._id.toString())}
                      disabled={!rule.isActive || isProcessing}
                      variant="ghost"
                      className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1.5 text-foreground hover:bg-muted/80"
                    >
                      <RefreshCw className={cn("size-3", isProcessing && "animate-spin")} />
                      Process Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
                    onClick={() => setDeletingRuleId(rule._id.toString())}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl p-16 text-center bg-muted/10">
          <CalendarSync className="size-12 text-muted-foreground/25 mb-4" />
          <h2 className="text-base font-bold text-foreground">No recurring rules</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Set up rules for subscriptions, utilities, salaries, and other regular transactions.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-6 rounded-xl font-bold gap-2">
            <Plus className="size-4" />
            Create First Rule
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Create Recurring Rule</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <RecurringForm categories={categories} wallets={wallets} onSuccess={() => setIsCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Edit Recurring Rule</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {editingRule && (
              <RecurringForm
                categories={categories}
                wallets={wallets}
                initialRule={editingRule}
                onSuccess={() => setEditingRule(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSS for flow dot animation */}
      <style>{`
        @keyframes flowDot {
          0% { left: -6px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% + 6px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}