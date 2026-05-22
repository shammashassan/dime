"use client"

import { useState, useTransition } from "react"
import { Budget, Category, Wallet } from "@/types"
import { BudgetWithSpending } from "@/lib/queries/budgets"
import { deleteBudget } from "@/lib/actions/budgets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
import { BudgetForm } from "./budget-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Edit,
  Trash2,
  Plus,
  Target,
  AlertTriangle,
  Calendar,
  Wallet as WalletIcon,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface BudgetsViewProps {
  budgets: BudgetWithSpending[]
  categories: Category[]
  wallets: Wallet[]
}

export function BudgetsView({ budgets, categories, wallets }: BudgetsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingBudgetId) return

    startTransition(async () => {
      try {
        await deleteBudget(deletingBudgetId)
        setDeletingBudgetId(null)
        router.refresh()
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
            <Target className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Budgets
            </h1>

            <p className="text-sm text-muted-foreground mt-0.5">
              Establish spending limits and track your performance relative to thresholds.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/10 flex items-center gap-2"
        >
          <Plus className="size-4" />
          Create Budget
        </Button>
      </div>

      {/* Grid List of Budgets */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const percent = b.amount > 0 ? (b.spent / b.amount) * 100 : 0

            const isOverThreshold = percent >= b.alertThreshold
            const isOverBudget = percent >= 100

            return (
              <Card
                key={b._id.toString()}
                className="border border-border/40 bg-card shadow-xl flex flex-col justify-between overflow-hidden relative group"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: b.categoryColor }}
                />

                <CardHeader className="pb-3 pt-6 flex flex-row justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                        {b.name}
                      </CardTitle>

                      {!b.isActive && (
                        <Badge variant="secondary" className="text-[10px] rounded-full px-2">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Badge
                        variant="outline"
                        className="rounded-full px-2 py-0 text-[10px] font-medium"
                        style={{
                          backgroundColor: b.categoryColor + "15",
                          color: b.categoryColor,
                          borderColor: b.categoryColor + "30",
                        }}
                      >
                        {b.categoryName}
                      </Badge>

                      {b.walletName && (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0 text-[10px] font-medium text-muted-foreground flex items-center gap-1"
                        >
                          <WalletIcon className="size-2.5" />
                          {b.walletName}
                        </Badge>
                      )}

                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0 text-[10px] font-medium uppercase"
                      >
                        {b.period}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-muted"
                      onClick={() => setEditingBudget(b)}
                    >
                      <Edit className="size-3.5 text-muted-foreground" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      onClick={() => setDeletingBudgetId(b._id.toString())}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Spent</p>

                      <p className="text-xl font-black text-foreground">
                        {formatCurrency(b.spent, b.currency)}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <p className="text-xs text-muted-foreground">Limit</p>

                      <p className="text-sm font-semibold text-muted-foreground">
                        {formatCurrency(b.amount, b.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Progress
                      value={Math.min(percent, 100)}
                      className={`h-2.5 rounded-full ${isOverBudget
                        ? "[&>div]:bg-rose-500"
                        : percent >= 70
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-emerald-500"
                        }`}
                    />

                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>{percent.toFixed(0)}% Consumed</span>
                      <span>Threshold: {b.alertThreshold}%</span>
                    </div>
                  </div>

                  {(isOverThreshold || isOverBudget) && (
                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${isOverBudget
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        }`}
                    >
                      {isOverBudget ? (
                        <>
                          <ShieldAlert className="size-4 shrink-0" />
                          <span>Over budget limit! Stop spending!</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-4 shrink-0" />
                          <span>Warning: Exceeded {b.alertThreshold}% threshold!</span>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 pb-4 text-[10px] text-muted-foreground border-t border-border/10 flex items-center gap-1">
                  <Calendar className="size-3" />

                  <span>
                    Started {formatDate(b.startDate)}
                    {b.endDate && ` • Ends ${formatDate(b.endDate)}`}
                  </span>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-border/40 shadow-xl bg-card py-16 flex flex-col items-center justify-center text-center">
          <Target className="size-16 text-muted-foreground/30 mb-4" />

          <h2 className="text-xl font-bold">No budgets established yet</h2>

          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Setting budget limits keeps your spending in check. Create a budget to monitor spending limits.
          </p>

          <Button onClick={() => setIsCreateOpen(true)} className="mt-6 rounded-xl font-bold">
            Create First Budget
          </Button>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Create Budget
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <BudgetForm
              categories={categories}
              wallets={wallets}
              onSuccess={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingBudget}
        onOpenChange={(open) => !open && setEditingBudget(null)}
      >
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Edit Budget
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {editingBudget && (
              <BudgetForm
                categories={categories}
                wallets={wallets}
                initialBudget={editingBudget}
                onSuccess={() => setEditingBudget(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingBudgetId}
        onOpenChange={(open) => !open && setDeletingBudgetId(null)}
      >
        <AlertDialogContent className="bg-popover border border-border/40 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">
              Delete Budget
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this budget? This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : null}

              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}