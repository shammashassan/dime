"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SharedExpense } from "@/types"
import { deleteSharedExpenseAction } from "@/lib/actions/shared-expenses"
import { Receipt, Calendar, Trash2, User, ChevronRight, Users2, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

interface ExpensesListProps {
  expenses: SharedExpense[]
  currentUserId: string
}

export function ExpensesList({ expenses, currentUserId }: ExpensesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this shared expense?")) return
    setDeletingId(id)

    try {
      await deleteSharedExpenseAction(id)
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to delete expense")
    } finally {
      setDeletingId(null)
    }
  }

  if (expenses.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {expenses.map((expense) => {
        const isOwner = expense.userId === currentUserId
        const dateStr = new Date(expense.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })

        // Find user participant net share
        const userP = expense.participants.find((p) => p.participantId === currentUserId)
        const isUserPayer = expense.paidByParticipantId === currentUserId
        const userOwedCents = userP ? userP.amountOwed : 0
        const userPaidCents = userP ? userP.amountPaid : 0
        const userNetCents = userPaidCents - userOwedCents

        // Status accent color (emerald if user is owed or settled, rose if user owes)
        const cardColor = userNetCents >= 0 ? "#10b981" : "#ef4444"

        // Calculate settled progress (total paid upfront by non-payers or settled status)
        const progress = expense.status === "settled" ? 100 : 35

        return (
          <Card
            key={expense._id.toString()}
            className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full justify-between"
            onClick={() => router.push(`/shared-expenses/${expense._id.toString()}`)}
          >
            {/* Top Accent Line matching Loan Card */}
            <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: cardColor }} />

            {/* Header */}
            <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `${cardColor}18`,
                    color: cardColor,
                  }}
                >
                  <Receipt className="size-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                    {expense.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
                      style={{
                        backgroundColor: `${cardColor}15`,
                        color: cardColor,
                        borderColor: `${cardColor}30`,
                      }}
                    >
                      {expense.splitMode} mode
                    </Badge>
                    <Badge variant={expense.status === "settled" ? "secondary" : "outline"} className="rounded-md font-semibold text-[10px] h-4 capitalize">
                      {expense.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Hover-revealed actions matching Loan Card */}
              {isOwner && (
                <div
                  className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                        onClick={(e) => handleDelete(e, expense._id.toString())}
                        disabled={deletingId === expense._id.toString()}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="rounded-xl font-medium">
                      Delete expense
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </CardHeader>

            {/* Body matching Loan Card metric layout */}
            <CardContent className="px-4 pb-3 flex flex-col gap-3">
              {/* Total & User Position */}
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Total Expense</p>
                  <p className="text-[1.5rem] font-black tabular-nums text-foreground leading-none select-all">
                    {formatCurrency(expense.totalAmount, expense.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Your Position</p>
                  <p
                    className={cn(
                      "text-[1.5rem] font-black tabular-nums leading-none",
                      userNetCents > 0 ? "text-emerald-500" : userNetCents < 0 ? "text-rose-500" : "text-muted-foreground"
                    )}
                  >
                    {userNetCents > 0 ? `+${formatCurrency(userNetCents, expense.currency)}` : userNetCents < 0 ? `-${formatCurrency(Math.abs(userNetCents), expense.currency)}` : "$0.00"}
                  </p>
                </div>
              </div>

              {/* Progress Bar matching Loan Card */}
              <div>
                <Progress
                  value={progress}
                  indicatorStyle={{ backgroundColor: cardColor }}
                  className="h-1.5 rounded-full"
                />
              </div>
            </CardContent>

            {/* Footer matching Loan Card */}
            <Separator className="bg-border/30" />
            <CardFooter className="px-3 py-2 flex items-center justify-between bg-muted/20 mt-auto" onClick={(e) => e.stopPropagation()}>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="size-3" />
                {dateStr}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
                >
                  <Link href={`/shared-expenses/${expense._id.toString()}`}>
                    Details <ChevronRight className="size-3.5 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
