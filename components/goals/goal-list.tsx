"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Goal, Wallet } from "@/types"
import { GoalCard } from "./goal-card"
import { GoalFormDialog } from "./goal-form"
import { Button } from "@/components/ui/button"
import { Plus, Target, Sparkles, Loader2, Trash2, Search, Activity, Trophy } from "lucide-react"
import { deleteGoal } from "@/lib/actions/goals"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia
} from "@/components/ui/empty"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
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

interface GoalListProps {
  initialGoals: Goal[]
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

export function GoalList({ initialGoals, wallets }: GoalListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [createOpen, setCreateOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [search, setSearch] = useState("")
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingGoalId) return
    const goal = goals.find(g => g._id.toString() === deletingGoalId)
    const goalName = goal ? goal.name : ""

    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteGoal(deletingGoalId)
          if (res && res.success) {
            setDeletingGoalId(null)
            router.refresh()
            resolve(true)
          } else {
            reject(new Error(res?.error || "Failed to delete goal"))
          }
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(deletePromise, {
      loading: "Deleting goal...",
      success: `Goal "${goalName}" deleted successfully`,
      error: (err: any) => err.message || "Failed to delete goal",
    })
  }

  // Update internal goals state if props change (though RSC layout will re-render anyway)
  React.useEffect(() => {
    setGoals(initialGoals)
  }, [initialGoals])

  const filteredGoals = goals.filter((g) => {
    const isCompleted = g.currentAmount >= g.targetAmount
    if (filter === "active" && isCompleted) return false
    if (filter === "completed" && !isCompleted) return false
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      if (!g.name.toLowerCase().includes(lowerSearch)) {
        return false
      }
    }
    return true
  })

  const tabCounts = {
    all: goals.length,
    active: goals.filter(g => g.currentAmount < g.targetAmount).length,
    completed: goals.filter(g => g.currentAmount >= g.targetAmount).length
  }

  const tabNames: Record<string, string> = {
    all: `All Goals (${tabCounts.all})`,
    active: `Active (${tabCounts.active})`,
    completed: `Completed (${tabCounts.completed})`,
  }

  const metrics = {
    totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    activeCount: tabCounts.active,
    completedCount: tabCounts.completed,
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <Target className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Savings Goals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set and fund savings targets for emergencies, purchases, or travel.
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" /> Create Goal
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={Target} color="#6366f1" label="Total Target" value={formatCurrency(metrics.totalTarget, wallets[0]?.currency || "USD")} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={Sparkles} color="#10b981" label="Total Saved" value={formatCurrency(metrics.totalSaved, wallets[0]?.currency || "USD")} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={Activity} color="#f59e0b" label="Active Goals" value={metrics.activeCount} />
        <MetricCard style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }} icon={Trophy} color="#8b5cf6" label="Completed Goals" value={metrics.completedCount} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Filter (visible on sm and larger screens) */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Goals ({tabCounts.all})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "active"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({tabCounts.active})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "completed"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed ({tabCounts.completed})
          </button>
        </div>

        {/* Mobile Filter (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[filter]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Goals ({tabCounts.all})
              </SelectItem>
              <SelectItem value="active" className="rounded-lg">
                Active ({tabCounts.active})
              </SelectItem>
              <SelectItem value="completed" className="rounded-lg">
                Completed ({tabCounts.completed})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <InputGroup className="w-full sm:w-60">
            <InputGroupInput
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      {/* Grid List */}
      {initialGoals.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Target className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No goals yet</EmptyTitle>
              <EmptyDescription>Start tracking your financial dreams by creating your first savings goal today.</EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-bold gap-2"><Plus className="size-4" /> Create Goal</Button>
            </div>
          </Empty>
        </Card>
      ) : filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard 
              key={goal._id.toString()} 
              goal={goal} 
              wallets={wallets} 
              onDeleteClick={() => setDeletingGoalId(goal._id.toString())}
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Target className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No goals found</EmptyTitle>
              <EmptyDescription>Adjust your filters or search to find what you're looking for.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}

      {/* Creation form dialog */}
      <GoalFormDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
      />

      <AlertDialog open={!!deletingGoalId} onOpenChange={(open) => !open && setDeletingGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this savings goal? This will permanently remove the goal and all of its contribution records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
