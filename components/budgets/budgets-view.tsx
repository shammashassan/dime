"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Budget, Category, Wallet } from "@/types"
import { BudgetWithSpending } from "@/lib/queries/budgets"
import { deleteBudget } from "@/lib/actions/budgets"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia
} from "@/components/ui/empty"
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
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BudgetForm } from "./budget-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  Edit,
  Trash2,
  Plus,
  PiggyBank,
  AlertTriangle,
  CalendarDays,
  Wallet as WalletIcon,
  ShieldAlert,
  Loader2,
  Search,
  ArrowDownRight,
} from "lucide-react"
import { toast } from "sonner"

interface BudgetsViewProps {
  budgets: BudgetWithSpending[]
  categories: Category[]
  wallets: Wallet[]
}

function MetricCard({ icon: Icon, color, label, value, valueClassName, className, style }: any) {
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

function BudgetCard({
  b,
  onEdit,
  onDelete,
}: {
  b: BudgetWithSpending
  onEdit: () => void
  onDelete: () => void
}) {
  const router = useRouter()

  const percent = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
  const remaining = Math.max(b.amount - b.spent, 0)
  const isOverBudget = percent >= 100
  const isOverThreshold = percent >= b.alertThreshold && !isOverBudget
  const barColor = isOverBudget ? "#f43f5e" : percent >= 70 ? "#f59e0b" : "#10b981"
  const pctColor = isOverBudget ? "text-rose-500" : percent >= 70 ? "text-amber-500" : "text-emerald-500"

  return (
    <Card
      className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
      onClick={() => router.push(`/budgets/${b._id.toString()}`)}
    >
      {/* Top accent */}
      <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: b.categoryColor }} />

      {/* ── Header ── */}
      <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        {/* Icon + name + badges */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: b.categoryColor + "18", color: b.categoryColor }}
          >
            <PiggyBank className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0 pr-18">
              <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                {b.name}
              </p>
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[8px] font-extrabold uppercase tracking-wider h-3.5 shrink-0 bg-muted/80 text-muted-foreground border border-border/50">
                {b.period}
              </Badge>
            </div>
            <div className="flex flex-nowrap items-center gap-1 mt-1.5 min-h-[16px] overflow-hidden w-full pr-2">
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 max-w-[100px] truncate shrink-0"
                style={{ backgroundColor: b.categoryColor + "15", color: b.categoryColor, borderColor: b.categoryColor + "30" }}>
                {b.categoryName}
              </Badge>
              {b.walletName && (
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-border/50 h-4 gap-1 max-w-[140px] truncate shrink-0">
                  <WalletIcon className="size-2 shrink-0" />
                  <span className="truncate">{b.walletName}</span>
                </Badge>
              )}
              {!b.isActive && (
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 shrink-0">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — absolutely positioned to prevent layout space reservation */}
        <div
          className="absolute top-3.5 right-3 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="size-8 rounded-lg hover:bg-muted/70"
                onClick={onEdit}
              >
                <Edit className="size-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-xl font-medium">
              Edit budget
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-xl font-medium">
              Delete budget
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      {/* ── Body ── */}
      <CardContent className="px-4 pb-3 flex flex-col gap-3">
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
          <Progress
            value={Math.min(percent, 100)}
            indicatorStyle={{ backgroundColor: barColor }}
            className="h-2 bg-muted/60"
          />
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
      </CardContent>

      {/* ── Footer ── */}
      <Separator className="bg-border/20" />
      <CardFooter className="px-4 py-2.5 flex items-center gap-1.5 mt-auto bg-muted/20">
        <CalendarDays className="size-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground font-medium truncate">
          Started {formatDate(b.startDate)}
          {b.endDate && <span className="text-muted-foreground/60"> · ends {formatDate(b.endDate)}</span>}
        </span>
      </CardFooter>
    </Card>
  )
}

export function BudgetsView({ budgets, categories, wallets }: BudgetsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "under" | "over">("all")
  const [search, setSearch] = useState("")

  const displayedBudgets = budgets.filter(b => {
    const isOver = b.spent > b.amount
    if (activeTab === "under" && isOver) return false
    if (activeTab === "over" && !isOver) return false
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      if (!b.name.toLowerCase().includes(lowerSearch)) return false
    }
    return true
  })

  const tabCounts = {
    all: budgets.length,
    under: budgets.filter(b => b.spent <= b.amount).length,
    over: budgets.filter(b => b.spent > b.amount).length,
  }

  const tabNames: Record<string, string> = {
    all: `All (${tabCounts.all})`,
    under: `Under Budget (${tabCounts.under})`,
    over: `Over Budget (${tabCounts.over})`,
  }

  const metrics = {
    totalBudgeted: budgets.reduce((sum, b) => sum + b.amount, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
    overBudgetCount: tabCounts.over,
  }

  const handleDelete = async () => {
    if (!deletingBudgetId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteBudget(deletingBudgetId)
          if (res && !res.success) {
            reject(new Error(res.error || "Unauthorized"))
          } else {
            setDeletingBudgetId(null)
            router.refresh()
            resolve(true)
          }
        }
        catch (err) { reject(err) }
      })
    })
    toast.promise(p, {
      loading: "Deleting...",
      success: "Budget deleted",
      error: (err: any) => err.message || "Failed to delete",
    })
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <PiggyBank className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Budgets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set spending limits per category and track your progress throughout the month.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" />Create Budget
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={PiggyBank} color="#6366f1" label="Total Budgeted" value={formatCurrency(metrics.totalBudgeted, wallets[0]?.currency || "USD")} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={ArrowDownRight} color="#f43f5e" label="Total Spent" value={formatCurrency(metrics.totalSpent, wallets[0]?.currency || "USD")} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={WalletIcon} color="#10b981" label="Remaining" value={formatCurrency(Math.max(0, metrics.totalBudgeted - metrics.totalSpent), wallets[0]?.currency || "USD")} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={ShieldAlert} color="#f59e0b" label="Over Budget" value={metrics.overBudgetCount} valueClassName={metrics.overBudgetCount > 0 ? "text-amber-500" : ""} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Filter (visible on sm and larger screens) */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab("under")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "under"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Under Budget ({tabCounts.under})
          </button>
          <button
            onClick={() => setActiveTab("over")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "over"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Over Budget ({tabCounts.over})
          </button>
        </div>

        {/* Mobile Filter (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All ({tabCounts.all})
              </SelectItem>
              <SelectItem value="under" className="rounded-lg">
                Under Budget ({tabCounts.under})
              </SelectItem>
              <SelectItem value="over" className="rounded-lg">
                Over Budget ({tabCounts.over})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 min-w-0">
          <InputGroup className="w-full sm:w-60 min-w-0">
            <InputGroupInput
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      {budgets.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <PiggyBank className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No budgets yet</EmptyTitle>
              <EmptyDescription>Create a budget to monitor and control your spending.</EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2"><Plus className="size-4" /> Create First Budget</Button>
            </div>
          </Empty>
        </Card>
      ) : displayedBudgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedBudgets.map((b) => (
            <BudgetCard
              key={b._id.toString()}
              b={b}
              onEdit={() => setEditingBudget(b)}
              onDelete={() => setDeletingBudgetId(b._id.toString())}
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <PiggyBank className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No budgets found</EmptyTitle>
              <EmptyDescription>Adjust your filters or search to find what you're looking for.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto min-w-0">
          <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
          <div className="py-2"><BudgetForm categories={categories} wallets={wallets} onSuccess={() => setIsCreateOpen(false)} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto min-w-0">
          <DialogHeader><DialogTitle>Edit Budget</DialogTitle></DialogHeader>
          <div className="py-2">
            {editingBudget && <BudgetForm categories={categories} wallets={wallets} initialBudget={editingBudget} onSuccess={() => setEditingBudget(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBudgetId} onOpenChange={(open) => !open && setDeletingBudgetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>This action is permanent and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}