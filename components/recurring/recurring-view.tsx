"use client"

import { useState, useTransition } from "react"
import { RecurringRule, Category, Wallet } from "@/types"
import { deleteRecurringRule, toggleRecurringRuleActive, processRecurringRuleNow } from "@/lib/actions/recurring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { RecurringForm } from "./recurring-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Edit, Trash2, Plus, Calendar, Wallet as WalletIcon, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface RecurringViewProps {
  rules: RecurringRule[]
  categories: Category[]
  wallets: Wallet[]
}

export function RecurringView({ rules, categories, wallets }: RecurringViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Modal/dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  // Status/Feedback messages
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingRuleId) return
    startTransition(async () => {
      try {
        await deleteRecurringRule(deletingRuleId)
        setDeletingRuleId(null)
        setFeedback({ type: "success", message: "Recurring rule deleted successfully." })
        router.refresh()
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to delete recurring rule." })
      }
    })
  }

  const handleToggleActive = async (id: string) => {
    try {
      const res = await toggleRecurringRuleActive(id)
      setFeedback({
        type: "success",
        message: `Recurring rule is now ${res.isActive ? "active" : "inactive"}.`,
      })
      router.refresh()
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to toggle status." })
    }
  }

  const handleProcessNow = async (id: string) => {
    setProcessingId(id)
    setFeedback(null)
    try {
      const res = await processRecurringRuleNow(id)
      setFeedback({
        type: "success",
        message: `Successfully processed rule. ${res.processedCount} transaction(s) created.`,
      })
      router.refresh()
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to process rule." })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
            <RefreshCw className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Recurring Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automate your repeated income and expenses with customizable frequencies.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/10 flex items-center gap-2"
        >
          <Plus className="size-4" />
          Create Rule
        </Button>
      </div>

      {/* Notification banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid List of Recurring Rules */}
      {rules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => {
            const category = categories.find((c) => c._id.toString() === rule.categoryId)
            const wallet = wallets.find((w) => w._id.toString() === rule.walletId)

            const isIncome = rule.type === "income"

            return (
              <Card
                key={rule._id.toString()}
                className={`border border-border/40 bg-card shadow-xl flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:shadow-2xl ${
                  !rule.isActive ? "opacity-75" : ""
                }`}
              >
                {/* Border Accent Category Color */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: category?.color || "#888888" }}
                />

                <CardHeader className="pb-3 pt-6 flex flex-row justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {rule.description}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {category && (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0 text-[10px] font-medium"
                          style={{
                            backgroundColor: (category.color || "#888888") + "15",
                            color: category.color || "#888888",
                            borderColor: (category.color || "#888888") + "30",
                          }}
                        >
                          {category.name}
                        </Badge>
                      )}
                      {wallet && (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0 text-[10px] font-medium text-muted-foreground flex items-center gap-1"
                        >
                          <WalletIcon className="size-2.5" />
                          {wallet.name}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-medium uppercase">
                        {rule.frequency}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-muted"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      onClick={() => setDeletingRuleId(rule._id.toString())}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className={`text-2xl font-black ${isIncome ? "text-emerald-500" : "text-foreground"}`}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(rule.amount, rule.currency)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <button
                        onClick={() => handleToggleActive(rule._id.toString())}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all border ${
                          rule.isActive
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${rule.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                        {rule.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-muted/40 border border-border/10 p-3 rounded-xl text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="font-semibold text-foreground">{formatDate(rule.startDate)}</span>
                    </div>
                    {rule.endDate && (
                      <div className="flex justify-between">
                        <span>End Date:</span>
                        <span className="font-semibold text-foreground">{formatDate(rule.endDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Next Due:</span>
                      <span className="font-semibold text-foreground">{formatDate(rule.nextDueDate)}</span>
                    </div>
                    {rule.lastProcessedDate && (
                      <div className="flex justify-between">
                        <span>Last Run:</span>
                        <span className="font-semibold text-foreground">{formatDate(rule.lastProcessedDate)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t border-border/10">
                  <Button
                    onClick={() => handleProcessNow(rule._id.toString())}
                    disabled={!rule.isActive || processingId === rule._id.toString()}
                    variant="outline"
                    className="w-full h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                  >
                    <RefreshCw
                      className={`size-3 ${processingId === rule._id.toString() ? "animate-spin" : ""}`}
                    />
                    Process Now
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-border/40 shadow-xl bg-card py-16 flex flex-col items-center justify-center text-center">
          <Calendar className="size-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold">No recurring transaction rules</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Set up rules for recurring subscriptions, utilities, salaries, and other regular transactions.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-6 rounded-xl font-bold">
            Create First Rule
          </Button>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Create Recurring Rule</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <RecurringForm
              categories={categories}
              wallets={wallets}
              onSuccess={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Edit Recurring Rule</DialogTitle>
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
        <AlertDialogContent className="bg-background border border-border/40 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold tracking-tight">Delete Recurring Rule</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this recurring rule? This action is permanent and does not delete transactions already generated by the rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/40">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/95"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
