"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Goal, Wallet } from "@/types"
import { GoalCard } from "./goal-card"
import { GoalFormDialog } from "./goal-form"
import { Button } from "@/components/ui/button"
import { Plus, Target, Sparkles, Loader2 } from "lucide-react"
import { deleteGoal } from "@/lib/actions/goals"
import { toast } from "sonner"
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

interface GoalListProps {
  initialGoals: Goal[]
  wallets: Wallet[]
}

export function GoalList({ initialGoals, wallets }: GoalListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [createOpen, setCreateOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingGoalId) return
    const goal = goals.find(g => g._id.toString() === deletingGoalId)
    const goalName = goal ? goal.name : ""

    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteGoal(deletingGoalId)
          if (res.success) {
            setDeletingGoalId(null)
            router.refresh()
            resolve(true)
          } else {
            reject(new Error("Failed to delete goal"))
          }
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(deletePromise, {
      loading: "Deleting goal...",
      success: `Goal "${goalName}" deleted successfully`,
      error: "Failed to delete goal",
    })
  }

  // Update internal goals state if props change (though RSC layout will re-render anyway)
  React.useEffect(() => {
    setGoals(initialGoals)
  }, [initialGoals])

  const filteredGoals = goals.filter((g) => {
    const isCompleted = g.currentAmount >= g.targetAmount
    if (filter === "active") return !isCompleted
    if (filter === "completed") return isCompleted
    return true
  })

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

      {/* Top Filter Actions */}
      <div className="flex rounded-xl bg-muted/80 p-1 self-start">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Goals ({goals.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            filter === "active"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({goals.filter((g) => g.currentAmount < g.targetAmount).length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            filter === "completed"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed ({goals.filter((g) => g.currentAmount >= g.targetAmount).length})
        </button>
      </div>

      {/* Grid List */}
      {filteredGoals.length > 0 ? (
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
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-12 py-20 rounded-3xl border border-dashed border-border/60 bg-muted/10">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Target className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No goals found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {filter === "all"
              ? "Start tracking your financial dreams by creating your first savings goal today."
              : filter === "active"
              ? "No active goals found. All your savings goals have been fully funded!"
              : "No completed goals found. Contribute to your active goals to complete them."}
          </p>
          {filter === "all" && (
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-bold mt-6 cursor-pointer">
              <Plus className="mr-2 size-4" /> Create Goal
            </Button>
          )}
        </div>
      )}

      {/* Creation form dialog */}
      <GoalFormDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingGoalId} onOpenChange={(open) => !open && setDeletingGoalId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600 dark:text-rose-400">Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this savings goal? This will permanently remove the goal and all of its contribution records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
