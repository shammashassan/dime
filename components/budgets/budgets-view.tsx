"use client"

import { useState, useTransition, useEffect } from "react"
import { Budget, Category, Wallet } from "@/types"
import { BudgetWithSpending } from "@/lib/queries/budgets"
import { deleteBudget } from "@/lib/actions/budgets"
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
import { BudgetForm } from "./budget-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Edit,
  Trash2,
  Plus,
  Target,
  AlertTriangle,
  CalendarDays,
  Wallet as WalletIcon,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface BudgetsViewProps {
  budgets: BudgetWithSpending[]
  categories: Category[]
  wallets: Wallet[]
}

function BudgetCard({
  b,
  onEdit,
  onDelete,
}: {
  b: BudgetWithSpending
  onEdit: () => void
  onDelete: () => void
}) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 80); return () => clearTimeout(t) }, [])

  const percent = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
  const remaining = Math.max(b.amount - b.spent, 0)
  const isOverBudget = percent >= 100
  const isOverThreshold = percent >= b.alertThreshold && !isOverBudget
  const barColor = isOverBudget ? "#f43f5e" : percent >= 70 ? "#f59e0b" : "#10b981"
  const pctColor = isOverBudget ? "text-rose-500" : percent >= 70 ? "text-amber-500" : "text-emerald-500"

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Top accent */}
      <div className="h-[3px] w-full" style={{ backgroundColor: b.categoryColor }} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        {/* Icon + name + badges */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: b.categoryColor + "18", color: b.categoryColor }}
          >
            <Target className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
              {b.name}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
                style={{ backgroundColor: b.categoryColor + "15", color: b.categoryColor, borderColor: b.categoryColor + "30" }}>
                {b.categoryName}
              </Badge>
              {b.walletName && (
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-border/50 h-4 gap-1">
                  <WalletIcon className="size-2" />{b.walletName}
                </Badge>
              )}
              <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">
                {b.period}
              </Badge>
              {!b.isActive && (
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — no chip, just buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
          <Button
            variant="ghost" size="icon"
            className="size-8 rounded-lg hover:bg-muted/70"
            onClick={onEdit}
          >
            <Edit className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-3 flex flex-col gap-3">
        {/* Spent + Used % */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Spent</p>
            <p className="text-[1.5rem] font-black tabular-nums text-foreground leading-none select-all">
              {formatCurrency(b.spent, b.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Used</p>
            <p className={cn("text-[1.5rem] font-black tabular-nums leading-none", pctColor)}>
              {Math.min(percent, 999).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: animated ? `${Math.min(percent, 100)}%` : "0%", backgroundColor: barColor }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-medium text-muted-foreground mt-1">
            <span className="text-foreground/60">{formatCurrency(remaining, b.currency)} remaining</span>
            <span>Limit: {formatCurrency(b.amount, b.currency)}</span>
          </div>
        </div>

        {/* Alert */}
        {(isOverThreshold || isOverBudget) && (
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-semibold",
            isOverBudget
              ? "bg-rose-500/8 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-amber-500/8 border-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {isOverBudget
              ? <><ShieldAlert className="size-3 shrink-0" /><span>Over budget — limit reached</span></>
              : <><AlertTriangle className="size-3 shrink-0" /><span>Alert: exceeded {b.alertThreshold}% threshold</span></>
            }
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border/20 px-4 py-2.5 flex items-center gap-1.5 mt-auto">
        <CalendarDays className="size-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground font-medium">
          Started {formatDate(b.startDate)}
          {b.endDate && <span className="text-muted-foreground/60"> · ends {formatDate(b.endDate)}</span>}
        </span>
      </div>
    </div>
  )
}

export function BudgetsView({ budgets, categories, wallets }: BudgetsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingBudgetId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try { await deleteBudget(deletingBudgetId); setDeletingBudgetId(null); router.refresh(); resolve(true) }
        catch (err) { reject(err) }
      })
    })
    toast.promise(p, { loading: "Deleting...", success: "Budget deleted", error: "Failed to delete" })
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0"><Target className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Budgets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Set spending limits and track performance.</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" />Create Budget
        </Button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b._id.toString()}
              b={b}
              onEdit={() => setEditingBudget(b)}
              onDelete={() => setDeletingBudgetId(b._id.toString())}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl p-12 text-center bg-muted/10">
          <Target className="size-10 text-muted-foreground/25 mb-3" />
          <p className="text-sm font-bold">No budgets yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">Create a budget to monitor your spending limits.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4 rounded-xl font-bold gap-2 h-9">
            <Plus className="size-4" />Create First Budget
          </Button>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Create Budget</DialogTitle></DialogHeader>
          <div className="py-2"><BudgetForm categories={categories} wallets={wallets} onSuccess={() => setIsCreateOpen(false)} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Budget</DialogTitle></DialogHeader>
          <div className="py-2">
            {editingBudget && <BudgetForm categories={categories} wallets={wallets} initialBudget={editingBudget} onSuccess={() => setEditingBudget(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBudgetId} onOpenChange={(open) => !open && setDeletingBudgetId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600 dark:text-rose-400">Delete Budget</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This action is permanent and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5">
              {isPending && <Loader2 className="size-3.5 animate-spin" />}Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}